import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceQrItems, attendanceRecords, attendanceDateError, attendanceQrForDate } from '../src/api/adminAttendance.js';

test('generation dates reject impossible dates and QR results stay scoped to the selected day', () => {
  assert.equal(attendanceDateError('2026-10-25'), '');
  assert.equal(attendanceDateError('2028-02-29'), '');
  for (const value of ['', '2026-02-29', '2026-04-31', '2026-13-01', 'invalid']) assert.ok(attendanceDateError(value));
  const payload = { data: [
    { id: 1, qr_token: 'selected', attendance_date: '2026-10-25', is_active: 1 },
    { id: 2, qr_token: 'other-date', attendance_date: '2026-10-24', is_active: 1 },
    { id: 3, qr_token: 'inactive', attendance_date: '2026-10-25', is_active: 0 },
  ] };
  assert.deepEqual(attendanceQrForDate(payload, '2026-10-25').map(row => row.id), ['1']);
  assert.deepEqual(attendanceQrForDate({ data: [] }, '2026-10-25'), []);
});

test('QR display supports active session arrays and never displays inactive codes', () => {
  const rows = attendanceQrItems({ data: [{ id: 7, is_active: 1, session_type: 'MORNING_CHECK_IN', qr_token: 'sample-token', attendance_date: '2026-10-24', available_from: '07:00' }, { id: 8, is_active: 0, qr_token: 'inactive' }] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, 'sample-token');
  assert.equal(rows[0].label, 'ចូលធ្វើការពេលព្រឹក');
  assert.equal(rows[0].date, '2026-10-24');
  assert.deepEqual(attendanceQrItems({ data: { sessions: [] } }), []);
});

test('QR images and single tokens are supported without unsafe image URLs', () => {
  assert.equal(attendanceQrItems({ data: { qr_image: '/qr.png' } })[0].image, '/qr.png');
  assert.equal(attendanceQrItems({ qrToken: 'sample' })[0].value, 'sample');
  assert.deepEqual(attendanceQrItems({ image: 'javascript:bad' }), []);
  assert.deepEqual(attendanceQrItems({ message: 'Generated sessions' }), []);
});

test('attendance records normalize date/time aliases and distinguish malformed responses', () => {
  const rows = attendanceRecords({ data: { records: [{ attendance_id: 4, user_id: 3, khmer_name: 'សុខ', attendance_date: '2026-10-24T00:00:00Z', check_in_time: '07:00', clock_out: null, status: 'LATE' }] } });
  assert.equal(rows[0].date, '2026-10-24');
  assert.equal(rows[0].checkIn, '07:00');
  assert.equal(rows[0].checkOut, '');
  assert.equal(rows[0].status, 'late');
  assert.deepEqual(attendanceRecords({ data: [] }), []);
  assert.throws(() => attendanceRecords({ message: 'Malformed' }));
});

test('admin and manager attendance map shift timestamps to first check-in and last check-out', () => {
  const [row] = attendanceRecords({data:[{
    attendance_id:2, employee_id:6, Eng_name:'Vira Chea', khmer_name:'តតត', attendance_date:'2026-10-25',
    morning_check_in:null, morning_check_out:null, afternoon_check_in:'2026-10-25 14:27:37', afternoon_check_out:null, status:'LATE',
  }]});
  assert.equal(row.checkIn,'2026-10-25 14:27:37');
  assert.equal(row.checkOut,'');
  assert.equal(row.employeeId,6);
  const [full] = attendanceRecords([{morning_check_in:'2026-10-25 07:30:00', morning_check_out:'2026-10-25 12:00:00', afternoon_check_in:'2026-10-25 13:30:00', afternoon_check_out:'2026-10-25 17:00:00'}]);
  assert.equal(full.checkIn,'2026-10-25 07:30:00');
  assert.equal(full.checkOut,'2026-10-25 17:00:00');
  assert.equal(attendanceRecords([{morning_check_out:'12:00:00'}])[0].checkOut,'12:00:00');
});
