import fs from 'node:fs';
import crypto from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';

const LOOKBACK_MINUTES = 20;
const MEMBER_LABELS = {
  markus: 'Markus',
  maja: 'Maja',
  mila: 'Mila',
  melker: 'Melker',
  family: 'Familjen'
};

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function firebaseDatabaseUrl() {
  const source = fs.readFileSync('budget/auth-config.js', 'utf8');
  const match = source.match(/databaseURL\s*:\s*["']([^"']+)["']/);
  if (!match) throw new Error('Could not resolve Firebase databaseURL from budget/auth-config.js');
  return match[1];
}

function parseStored(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); }
  catch (_) { return fallback; }
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function utcDayNumber(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function eventOccursOn(ev, targetDate) {
  if (!ev || !ev.date || targetDate < ev.date) return false;
  if (ev.repeatUntil && targetDate > ev.repeatUntil) return false;

  const repeat = ev.repeat || 'none';
  if (repeat === 'none') return targetDate === ev.date;

  if (repeat === 'weekly') {
    const diff = utcDayNumber(targetDate) - utcDayNumber(ev.date);
    return diff >= 0 && diff % 7 === 0;
  }

  if (repeat === 'monthly') {
    const base = new Date(`${ev.date}T12:00:00`);
    for (let i = 0; i <= 60; i += 1) {
      const occurrence = new Date(base);
      occurrence.setMonth(base.getMonth() + i);
      const key = dateKey(occurrence);
      if (key === targetDate) return true;
      if (key > targetDate) return false;
      if (ev.repeatUntil && key > ev.repeatUntil) return false;
    }
  }

  return false;
}

function reminderLabel(minutes) {
  if (minutes === 0) return 'Nu';
  if (minutes === 15) return 'Om 15 min';
  if (minutes === 60) return 'Om 1 timme';
  if (minutes === 180) return 'Om 3 timmar';
  if (minutes === 1440) return 'Om 1 dag';
  if (minutes < 60) return `Om ${minutes} min`;
  if (minutes % 1440 === 0) return `Om ${minutes / 1440} dagar`;
  if (minutes % 60 === 0) return `Om ${minutes / 60} timmar`;
  return `Om ${minutes} min`;
}

function reminderId(ev, occurrenceDate, minutes) {
  return crypto
    .createHash('sha256')
    .update(`${ev.id || ev.title}|${occurrenceDate}|${minutes}`)
    .digest('hex')
    .slice(0, 32);
}

function deviceAccepts(device, member) {
  if (!device || !device.enabled || !device.token) return false;
  if (!device.members || typeof device.members !== 'object') return true;
  return device.members[member] === true;
}

function invalidTokenCode(code) {
  return code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/invalid-argument';
}

const serviceAccount = JSON.parse(requiredEnv('FIREBASE_SERVICE_ACCOUNT_JSON'));
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: firebaseDatabaseUrl()
});

const db = getDatabase();
const fcm = getMessaging();

async function sendToDevices(deviceEntries, payload) {
  let success = 0;
  let failed = 0;

  for (const [deviceId, device] of deviceEntries) {
    try {
      await fcm.send({
        token: device.token,
        data: {
          title: String(payload.title || 'Familjekalender'),
          body: String(payload.body || ''),
          url: String(payload.url || 'home.html'),
          tag: String(payload.tag || '')
        },
        webpush: {
          headers: { Urgency: 'high' }
        }
      });
      success += 1;
    } catch (error) {
      failed += 1;
      const code = error && error.code ? error.code : '';
      console.warn(`[push] send failed for ${deviceId}: ${code || error.message}`);
      if (invalidTokenCode(code)) {
        await db.ref(`pushDevices/${deviceId}`).update({ enabled: false, token: '' });
      }
    }
  }

  return { success, failed };
}

async function processQueue(devices) {
  const snap = await db.ref('pushQueue').get();
  const queue = snap.val() || {};
  const now = Date.now();

  for (const [queueId, item] of Object.entries(queue)) {
    if (!item || item.status !== 'pending') continue;
    if (item.createdAt && now - Number(item.createdAt) > 24 * 60 * 60 * 1000) {
      await db.ref(`pushQueue/${queueId}`).update({ status: 'expired', finishedAt: now });
      continue;
    }

    let targets = [];
    if (item.deviceId && devices[item.deviceId] && devices[item.deviceId].enabled && devices[item.deviceId].token) {
      targets = [[item.deviceId, devices[item.deviceId]]];
    } else if (item.member) {
      targets = Object.entries(devices).filter(([, device]) => deviceAccepts(device, item.member));
    }

    if (!targets.length) {
      console.log(`[push] queue ${queueId}: no enabled target device yet`);
      continue;
    }

    const result = await sendToDevices(targets, {
      title: item.title || 'Familjekalender',
      body: item.body || '',
      url: item.url || 'home.html',
      tag: `queue-${queueId}`
    });

    await db.ref(`pushQueue/${queueId}`).update({
      status: result.success ? 'sent' : 'error',
      sentCount: result.success,
      failedCount: result.failed,
      finishedAt: Date.now()
    });
    console.log(`[push] queue ${queueId}: ${result.success} sent, ${result.failed} failed`);
  }
}

async function processReminders(events, devices) {
  const now = new Date();
  const oldestDue = new Date(now.getTime() - LOOKBACK_MINUTES * 60000);
  const maxReminder = events.reduce((max, ev) => {
    const value = Number(ev && ev.reminderMinutes);
    return Number.isFinite(value) && value >= 0 ? Math.max(max, value) : max;
  }, 1440);
  const daysForward = Math.max(1, Math.ceil(maxReminder / 1440) + 1);
  const candidateDates = [];
  for (let i = 0; i <= daysForward; i += 1) candidateDates.push(dateKey(addDays(now, i)));

  for (const ev of events) {
    if (!ev || !ev.id || !ev.date || !ev.time) continue;
    if (ev.reminderMinutes === null || ev.reminderMinutes === undefined || ev.reminderMinutes === '') continue;
    const minutes = Number(ev.reminderMinutes);
    if (!Number.isFinite(minutes) || minutes < 0) continue;

    for (const occurrenceDate of candidateDates) {
      if (!eventOccursOn(ev, occurrenceDate)) continue;

      const start = new Date(`${occurrenceDate}T${ev.time}:00`);
      if (Number.isNaN(start.getTime())) continue;
      const dueAt = new Date(start.getTime() - minutes * 60000);
      if (dueAt > now || dueAt <= oldestDue) continue;

      const key = reminderId(ev, occurrenceDate, minutes);
      const sentRef = db.ref(`pushSent/${key}`);
      const alreadySent = await sentRef.get();
      if (alreadySent.exists()) continue;

      const member = ev.member || 'family';
      const targets = Object.entries(devices).filter(([, device]) => deviceAccepts(device, member));
      if (!targets.length) {
        console.log(`[push] ${ev.title}: no enabled device subscribed to ${member}`);
        continue;
      }

      const memberLabel = MEMBER_LABELS[member] || 'Familjen';
      const title = `${ev.emoji ? `${ev.emoji} ` : ''}${ev.title}`;
      const body = `${reminderLabel(minutes)} · ${ev.time} · ${memberLabel}`;
      const result = await sendToDevices(targets, {
        title,
        body,
        url: `home.html?date=${encodeURIComponent(occurrenceDate)}&event=${encodeURIComponent(ev.id)}`,
        tag: `calendar-${key}`
      });

      if (result.success > 0) {
        await sentRef.set({
          eventId: String(ev.id),
          occurrenceDate,
          reminderMinutes: minutes,
          sentAt: Date.now(),
          sentCount: result.success
        });
      }
      console.log(`[push] reminder ${ev.id}/${occurrenceDate}: ${result.success} sent, ${result.failed} failed`);
    }
  }
}

const [eventsSnap, devicesSnap] = await Promise.all([
  db.ref('cal_events').get(),
  db.ref('pushDevices').get()
]);

const eventsValue = parseStored(eventsSnap.val(), []);
const events = Array.isArray(eventsValue) ? eventsValue : [];
const devices = devicesSnap.val() || {};

console.log(`[push] ${events.length} calendar events, ${Object.keys(devices).length} registered devices`);
await processQueue(devices);
await processReminders(events, devices);
console.log('[push] worker complete');
