import test from 'node:test';
import assert from 'node:assert/strict';
import { departmentMembers } from '../src/utils/departmentMembers.js';
import { tooltipPosition } from '../src/utils/chartTooltip.js';

test('department avatars combine real members and profiles without duplicate IDs', () => {
  const result = departmentMembers({ id: 3, employees: [{ user_id: 6, khmer_name: 'Member' }, { user_id: 6 }] }, [
    { id: '6', departmentId: '3', avatar: 'member.webp', nameEn: 'Member' },
    { id: 7, departmentId: '4' }, { id: 1, departmentId: '3', role: 'ADMIN' }, { id: 2, departmentId: '3', role: 'MANAGER' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].avatar, 'member.webp');
  assert.equal(result[0].khmer_name, 'Member');
});
test('department stacks do not invent profiles for a count without member data', () => {
  assert.deepEqual(departmentMembers({ id: 3, employeeCount: 10 }), []);
});
test('chart tooltip stays within the viewport and flips below near the top', () => {
  assert.deepEqual(tooltipPosition({ left: 295, width: 10, top: 5, bottom: 15 }, 120, 50, 320, 200), { left: 192, top: 25 });
  assert.deepEqual(tooltipPosition({ left: 0, width: 5, top: 180, bottom: 190 }, 120, 50, 320, 200), { left: 8, top: 120 });
});
