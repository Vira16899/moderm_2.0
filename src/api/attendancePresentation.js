import { attendanceRecords, attendanceStatus } from './adminAttendance.js';

export function attendanceTime(value) {
  if (value == null || value === '') return '—';
  const text = String(value);
  if (/T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(text) && Number.isFinite(Date.parse(text))) return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }).format(new Date(text));
  return text.match(/(?:T|\s|^)(\d{2}:\d{2})/)?.[1] || text;
}
export function attendanceState(record) {
  const status = String(record.status ?? record.attendance_status ?? '').toLowerCase();
  const states = { present: 'present', on_time: 'present', checked_in: 'present', checked_out: 'present', late: 'late', absent: 'absent', missing: 'absent', leave: 'leave', on_leave: 'leave' };
  return states[status] || 'recorded';
}
export function attendanceStateLabel(record) {
  const status = String(record.status ?? record.attendance_status ?? '').toLowerCase();
  if (status === 'leave' || status === 'on_leave') return 'ឈប់សម្រាក';
  return attendanceState(record) === 'recorded' ? 'បានកត់ត្រា' : status === 'missing' ? 'អវត្តមាន' : attendanceStatus(status);
}
export function attendanceSlots(record) {
  const sessions = [
    ['MORNING_CHECK_IN', 'ចូលពេលព្រឹក'], ['MORNING_CHECK_OUT', 'ចេញពេលព្រឹក'],
    ['AFTERNOON_CHECK_IN', 'ចូលពេលរសៀល'], ['AFTERNOON_CHECK_OUT', 'ចេញពេលរសៀល'],
  ].map(([key, label]) => ({ key, label, value: record?.[key] ?? record?.[key.toLowerCase()] ?? record?.[key.replaceAll('_', '').toLowerCase()] }));
  if (sessions.some(session => session.value != null)) return sessions;
  return [
    { key: 'check-in', label: 'ម៉ោងចូល', value: record?.checkInTime ?? record?.check_in ?? record?.check_in_time ?? record?.clockIn ?? record?.clock_in },
    { key: 'check-out', label: 'ម៉ោងចេញ', value: record?.checkOutTime ?? record?.check_out ?? record?.check_out_time ?? record?.clockOut ?? record?.clock_out },
  ];
}
export function departmentAttendanceRows(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const rows = Array.isArray(data) ? data : data?.attendance ?? data?.records ?? data?.employees ?? data?.data;
  if (!Array.isArray(rows)) throw new Error('មិនអាចអានកំណត់ត្រាវត្តមានក្នុងផ្នែកបានទេ។');
  return attendanceRecords(rows.map(row => ({ ...row, user: row.user ?? row.employee }))).map((row, index) => ({
    ...row,
    checkIn: row.checkIn || rows[index].checkInTime || rows[index].clockIn || '',
    checkOut: row.checkOut || rows[index].checkOutTime || rows[index].clockOut || '',
  }));
}
