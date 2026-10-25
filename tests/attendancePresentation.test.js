import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceSlots, attendanceState, attendanceStateLabel, attendanceTime, departmentAttendanceRows } from '../src/api/attendancePresentation.js';

test('personal attendance never repeats aggregate times in invented shift slots', () => {
  const slots = attendanceSlots({ checkInTime: '08:05', checkOutTime: '17:10' });
  assert.deepEqual(slots.map(slot => slot.value), ['08:05', '17:10']);
  const sessions = attendanceSlots({ MORNING_CHECK_IN: '08:00', checkInTime: '08:00', checkOutTime: '17:00' });
  assert.equal(sessions.length, 4);
  assert.equal(sessions[0].value, '08:00');
  assert.equal(sessions[1].value, undefined);
  assert.equal(sessions[3].value, undefined);
  assert.ok(attendanceSlots(null).every(slot => slot.value == null));
});
test('attendance presentation preserves unknown states and formats UTC timestamps in Bangkok time', () => {
  assert.equal(attendanceState({ status: 'ABSENT' }), 'absent');
  assert.equal(attendanceState({ status: 'LATE' }), 'late');
  assert.equal(attendanceState({}), 'recorded');
  assert.equal(attendanceStateLabel({}), 'បានកត់ត្រា');
  assert.equal(attendanceTime(null), '—');
  assert.equal(attendanceTime('08:05:00'), '08:05');
  assert.equal(attendanceTime('2026-10-25T01:05:00.000Z'), '08:05');
});
test('department attendance preserves nested employee identity, date and time aliases', () => {
  const rows = departmentAttendanceRows({ data: { employees: [{ id: 8, user_id: 3, employee: { khmer_name: 'Test', Eng_name: 'Employee' }, attendance_date: '2026-10-25', checkInTime: '08:00', clockOut: '17:00', status: 'LATE' }] } });
  assert.equal(rows[0].employeeId, 3);
  assert.equal(rows[0].name, 'Test');
  assert.equal(rows[0].checkIn, '08:00');
  assert.equal(rows[0].checkOut, '17:00');
  assert.equal(rows[0].status, 'late');
  assert.deepEqual(departmentAttendanceRows({ data: [] }), []);
  assert.throws(() => departmentAttendanceRows({ data: { message: 'Invalid' } }));
});

test('department attendance uses nested avatars and joins missing images by employee ID', async () => {
  const { withEmployeeAvatars } = await import('../src/api/attendancePresentation.js');
  const records = departmentAttendanceRows({ data: [
    { id: 88, user: { id: 6, avatar: 'uploads/avatars/current.webp' } },
    { id: 6, user_id: 9 },
    { id: 9, user_id: 10 },
  ] });
  const employees = [{ id: '6', avatar: 'other.webp' }, { id: '9', avatar: 'manager-team.webp' }];
  const result = withEmployeeAvatars(records, employees);
  assert.equal(result[0].avatar, 'uploads/avatars/current.webp');
  assert.equal(result[1].avatar, 'manager-team.webp');
  assert.equal(result[2].avatar, '');
  assert.equal(records[1].avatar, '');
  assert.equal(withEmployeeAvatars(records, [{ id: 9, avatar: 'updated.webp' }])[1].avatar, 'updated.webp');
});
