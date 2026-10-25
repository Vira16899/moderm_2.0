import test from 'node:test';
import assert from 'node:assert/strict';
import { managerInsights } from '../src/api/managerInsights.js';

test('manager charts use unique employees and real hire dates in the requested window', () => {
  const employees = [
    { id: '1', joinedDate: '2026-10-02', status: 'active', positionKh: 'Production', phone: '012345678' },
    { id: '1', joinedDate: '2026-10-02', status: 'active' },
    { id: '2', joinedDate: '2026-05-01', status: 'inactive', positionKh: 'Production', phone: '' },
    { id: '3', joinedDate: '2026-10-26', status: 'active' },
    { id: '4', joinedDate: '2026-02-30', status: null },
    { id: '5', joinedDate: '2026-04-30', status: 'active', positionEn: 'Warehouse' },
  ];
  const result = managerInsights(employees, '2026-10-25', 6);
  assert.equal(result.team.length, 5);
  assert.equal(result.months[0].key, '2026-05');
  assert.equal(result.months.at(-1).count, 1);
  assert.deepEqual(result.months.at(-1).members.map(member => member.id), ['1']);
  assert.equal(result.hires, 2);
  assert.deepEqual(result.status, { active: 3, inactive: 1, unknown: 1 });
  assert.equal(result.positions.find(position => position.name === 'Production').count, 2);
  assert.equal(result.missingPhone.length, 4);
  assert.equal(result.missingPosition.length, 2);
  assert.equal(managerInsights(employees, '2026-10-25', 12).hires, 3);
});
test('empty manager charts preserve zero and the month range crosses year boundaries', () => {
  const result = managerInsights([], '2026-01-05', 6);
  assert.equal(result.months[0].key, '2025-08');
  assert.equal(result.months.at(-1).key, '2026-01');
  assert.equal(result.hires, 0);
  assert.deepEqual(result.status, { active: 0, inactive: 0, unknown: 0 });
  assert.deepEqual(result.positions, []);
});
