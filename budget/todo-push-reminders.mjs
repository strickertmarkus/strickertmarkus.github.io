// Pure shared-task push reminder selection. The sender reads the live
// family_todos_v2/items node: no client-side timers or open tabs are needed.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function stockholmDateISO(instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function advanceIsoDay(date, days = 1) {
  if (!ISO_DATE.test(String(date || ''))) return '';
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) return '';
  return new Date(time + days * 86400000).toISOString().slice(0, 10);
}

export function dueTomorrowTasks(items, instant = new Date()) {
  const deadline = advanceIsoDay(stockholmDateISO(instant), 1);
  if (!deadline) return [];
  return Object.entries(items || {}).flatMap(([key, raw]) => {
    if (!raw || typeof raw !== 'object') return [];
    const id = String(raw.id || key || '').trim();
    const text = String(raw.text || '').trim();
    if (!id || !text || raw.done || raw.checked || raw.deleted || raw.dueDate !== deadline) return [];
    return [{
      id, text, dueDate: deadline,
      member: ['markus','maja','melker','mila','family'].includes(raw.member) ? raw.member : 'family'
    }];
  });
}
