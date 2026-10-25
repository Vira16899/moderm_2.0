import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeAttendanceTrend } from '../src/api/employeeInsights.js';
test('employee attendance chart counts distinct recorded days, excludes future and invalid dates', () => {
  const months = employeeAttendanceTrend([{date:'2026-10-25'},{date:'2026-10-25'},{date:'2026-10-24'},{date:'2026-10-26'},{date:'2026-09-03'},{date:'2026-02-30'},{date:'bad'}], '2026-10-25');
  assert.equal(months.length, 6);
  assert.deepEqual(months.at(-1), {key:'2026-10',count:2});
  assert.deepEqual(months.at(-2), {key:'2026-09',count:1});
});
test('employee attendance chart preserves empty months across year boundaries', () => {
  const months = employeeAttendanceTrend([], '2026-02-02');
  assert.equal(months[0].key, '2025-09');
  assert.equal(months.at(-1).key, '2026-02');
  assert.ok(months.every(month => month.count === 0));
});
