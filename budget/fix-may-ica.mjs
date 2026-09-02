import fs from 'node:fs';
import { initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function databaseUrl() {
  const source = fs.readFileSync('budget/auth-config.js', 'utf8');
  const match = source.match(/databaseURL\s*:\s*["']([^"']+)["']/);
  if (!match) throw new Error('Could not resolve Firebase databaseURL');
  return match[1];
}

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('sv-SE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findItem(month, wantedName) {
  const wanted = normalize(wantedName);
  for (const section of month.sections || []) {
    for (const item of section.items || []) {
      if (normalize(item && item.name) === wanted) return item;
    }
  }
  return null;
}

const serviceAccount = JSON.parse(requiredEnv('FIREBASE_SERVICE_ACCOUNT_JSON'));
const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: databaseUrl()
});
const db = getDatabase(app);

try {
  const ref = db.ref('budgetTracker');
  const snap = await ref.get();
  if (!snap.exists()) throw new Error('budgetTracker does not exist');

  const stored = snap.val();
  const wasString = typeof stored === 'string';
  const data = wasString ? JSON.parse(stored) : stored;
  const month = data && data.monthlyData && data.monthlyData['2026-05'];
  if (!month) throw new Error('May 2026 data was not found');

  const ica = findItem(month, 'Ica-kortet') || findItem(month, 'Ica Kortet');
  const childBenefitIca = findItem(month, 'Barnbidrag Ica-kort');
  if (!ica) throw new Error('ICA item was not found');
  if (!childBenefitIca) throw new Error('Separate Barnbidrag Ica-kort item was not found');

  const currentIca = Number(ica.actual);
  const separateAmount = Number(childBenefitIca.actual);
  if (!Number.isFinite(currentIca) || !Number.isFinite(separateAmount) || separateAmount <= 0) {
    throw new Error('ICA correction inputs are invalid');
  }
  if (currentIca <= separateAmount) throw new Error('ICA value is not consistent with the duplicated-category correction');

  const corrected = currentIca - separateAmount;
  ica.actual = corrected;

  await ref.set(wasString ? JSON.stringify(data) : data);

  const verifySnap = await ref.get();
  const verifyStored = verifySnap.val();
  const verifyData = typeof verifyStored === 'string' ? JSON.parse(verifyStored) : verifyStored;
  const verifyMonth = verifyData && verifyData.monthlyData && verifyData.monthlyData['2026-05'];
  const verifyIca = verifyMonth && (findItem(verifyMonth, 'Ica-kortet') || findItem(verifyMonth, 'Ica Kortet'));
  if (!verifyIca || Number(verifyIca.actual) !== corrected) throw new Error('Firebase verification failed');

  console.log('May ICA correction written and verified without exposing budget values.');
} finally {
  await deleteApp(app);
}
