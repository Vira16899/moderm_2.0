import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, shiftMonth, eventsOnDay } from '../src/api/managerCalendar.js';

test('manager calendar starts Monday, covers six weeks and handles year boundaries', () => {
  const days = calendarDays('2026-11');
  assert.equal(days.length, 42);
  assert.equal(days[0], '2026-10-26');
  assert.equal(days[41], '2026-12-06');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
test('manager agenda uses real dates, deduplicates employees and excludes rejected or cancelled leave', () => {
  const employee = { id: 1, nameKh: 'Test', dob: '1995-10-25', joinedDate: '2026-10-25' };
  const leaves = ['approved', 'pending', 'rejected', 'cancelled'].map((status, id) => ({ id, status, start_date: '2026-10-24', end_date: '2026-10-26' }));
  assert.deepEqual(eventsOnDay('2026-10-25', [employee, employee], leaves).map(event => event.kind), ['birthday', 'hire', 'approved', 'pending']);
  assert.equal(eventsOnDay('2026-10-26', [employee], leaves).length, 0);
  assert.equal(eventsOnDay('2027-10-25', [employee], []).length, 1);
  assert.deepEqual(eventsOnDay('2026-10-25', [], []), []);
});
