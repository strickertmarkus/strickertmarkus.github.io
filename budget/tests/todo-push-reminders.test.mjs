import test from 'node:test';
import assert from 'node:assert/strict';
import { stockholmDateISO, advanceIsoDay, dueTomorrowTasks } from '../todo-push-reminders.mjs';

test('Stockholm date is independent of the server clock and handles DST', () => {
  assert.equal(stockholmDateISO(new Date('2026-10-21T23:30:00Z')), '2026-10-22');
  assert.equal(stockholmDateISO(new Date('2026-03-29T00:30:00Z')), '2026-03-29');
  assert.equal(stockholmDateISO(new Date('2026-03-29T22:30:00Z')), '2026-03-30');
  assert.equal(advanceIsoDay('2026-12-31'), '2027-01-01');
  assert.equal(advanceIsoDay('2026-02-30'), '');
});

test('Only open tasks due tomorrow qualify for push notifications', () => {
  const items = {
    open: { id: 'open', text: ' Boka bilservice ', dueDate: '2026-10-22', member: 'markus' },
    another: { text: 'Handla', dueDate: '2026-10-22', member: 'family' },
    done: { text: 'Klart', dueDate: '2026-10-22', done: true },
    checked: { text: 'Check', dueDate: '2026-10-22', checked: true },
    deleted: { text: 'Raderad', dueDate: '2026-10-22', deleted: true },
    today: { text: 'Idag', dueDate: '2026-10-21' },
    later: { text: 'Senare', dueDate: '2026-10-23' },
    undated: { text: 'Utan datum', dueDate: '' },
    empty: { text: '  ', dueDate: '2026-10-22' }
  };
  assert.deepEqual(dueTomorrowTasks(items, new Date('2026-10-21T08:17:00Z')), [
    { id: 'open', text: 'Boka bilservice', dueDate: '2026-10-22', member: 'markus' },
    { id: 'another', text: 'Handla', dueDate: '2026-10-22', member: 'family' }
  ]);
  assert.deepEqual(dueTomorrowTasks(items, new Date('2026-10-22T08:17:00Z')), [
    { id: 'later', text: 'Senare', dueDate: '2026-10-23', member: 'family' }
  ]);
});

test('Editing due date affects next reminder, invalid member remains family', () => {
  const tasks = { task42: { text: 'Byta filter', dueDate: '2026-10-23', member: 'unknown' } };
  const when = new Date('2026-10-21T08:17:00Z');
  assert.equal(dueTomorrowTasks(tasks, when).length, 0);
  tasks.task42.dueDate = '2026-10-22';
  assert.deepEqual(dueTomorrowTasks(tasks, when), [
    { id: 'task42', text: 'Byta filter', dueDate: '2026-10-22', member: 'family' }
  ]);
  tasks.task42.done = true;
  assert.equal(dueTomorrowTasks(tasks, when).length, 0);
});
