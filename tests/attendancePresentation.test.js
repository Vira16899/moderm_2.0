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
