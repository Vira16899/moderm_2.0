import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { attendanceHistory, leaveBody, leaveErrors, leaveDays, nextLeaveDate, leaveHistory, money, salaryHistory } from '../src/api/employeeData.js';
import { API_ENDPOINTS } from '../src/api/endpoints.js';
import { employeeError } from '../src/utils/employeeMessages.js';

test('employee feedback translates overlapping dates and never exposes English API errors', () => {
  const overlap = employeeError(new Error('You already have a leave request on these dates'));
  assert.match(overlap, /កាលបរិច្ឆេទ/);
  assert.doesNotMatch(overlap, /[a-z]/i);
  for (const message of ['Network Error', 'Only pending requests can be updated', 'Unexpected database error', 'Unauthorized']) {
    const translated = employeeError(new Error(message));
    assert.match(translated, /[\u1780-\u17ff]/);
    assert.doesNotMatch(translated, /[a-z]/i);
  }
  assert.equal(employeeError(new Error('សូមបំពេញមូលហេតុ។')), 'សូមបំពេញមូលហេតុ។');
  assert.equal(employeeError(new Error('Internal error'), 'មិនអាចរក្សាទុកបានទេ។'), 'មិនអាចរក្សាទុកបានទេ។');
});

test('leave JSON payload sends a trimmed URL and omits identity and upload data', () => {
  const form = { leaveType: ' ANNUAL ', startDate: '2026-10-01', endDate: '2026-10-02', reason: ' Family event ', fileUrl: '' };
  assert.deepEqual(leaveBody(form), { start_date: '2026-10-01', end_date: '2026-10-02', reason: 'Family event', file_url: '' });
  assert.equal(leaveBody({ ...form, fileUrl: ' https://example.com/proof.pdf ' }).file_url, 'https://example.com/proof.pdf');
  assert.equal(leaveBody({ ...form, fileUrl: 'http://example.com/proof.jpg' }).file_url, 'http://example.com/proof.jpg');
  for (const fileUrl of ['javascript:alert(1)', 'data:text/html,test', 'file:///test.pdf', 'not a url', 'https://']) assert.ok(leaveErrors({ ...form, fileUrl }).fileUrl);
  assert.throws(() => leaveBody({ ...form, endDate: '2026-09-30' }));
  assert.throws(() => leaveBody({ ...form, startDate: '2026-02-30' }));
  assert.throws(() => leaveBody({ ...form, reason: '  ' }));
  assert.equal(leaveDays('2026-10-01', '2026-10-03'), 2);
  assert.equal(leaveDays('2026-10-01', '2026-10-01'), 0);
});

test('leave over two elapsed days requires a valid evidence URL', () => {
  const form = { leaveType: ' ច្បាប់ផ្ទាល់ខ្លួន ', startDate: '2026-10-12', endDate: '2026-10-13', reason: 'Family matter', fileUrl: '' };
  assert.deepEqual(leaveErrors(form), {});
  assert.equal(leaveBody(form).file_url, '');
  assert.equal(Object.hasOwn(leaveBody(form), 'leave_type'), false);
  const long = { ...form, endDate: '2026-10-15' };
  assert.deepEqual(leaveErrors({ ...form, endDate: '2026-10-14' }), {});
  assert.ok(leaveErrors({ ...form, endDate: form.startDate }).endDate);
  assert.match(leaveErrors(long).fileUrl, /២/);
  assert.throws(() => leaveBody(long));
  const existing = { ...long, fileUrl: 'https://example.com/existing.pdf' };
  assert.deepEqual(leaveErrors(existing), {});
  assert.equal(leaveBody(existing).file_url, existing.fileUrl);
  assert.ok(leaveErrors({ ...existing, fileUrl: '  ' }).fileUrl);
  assert.deepEqual(leaveErrors({ ...form, leaveType: null }), {});
  assert.deepEqual(leaveErrors({ ...form, leaveType: undefined }), {});
  assert.match(employeeError(new Error('Leave more than 2 days requires a file (file_url)')), /២/);
});

test('one day is the following date with month, year and leap-year rollover', () => {
  assert.equal(leaveDays('2026-10-25', '2026-10-26'), 1);
  assert.equal(nextLeaveDate('2026-10-25'), '2026-10-26');
  assert.equal(nextLeaveDate('2026-10-31'), '2026-11-01');
  assert.equal(nextLeaveDate('2026-12-31'), '2027-01-01');
  assert.equal(nextLeaveDate('2028-02-28'), '2028-02-29');
  assert.equal(nextLeaveDate(''), '');
});

test('leave history normalizes server fields and preserves real IDs and empty responses', () => {
  const record = { id: 1, leave_type: 'ANNUAL', start_date: '2026-10-01T00:00:00Z', end_date: '2026-10-03', status: 'PENDING', reason: 'Family', file_url: null };
  for (const payload of [[record], { data: [record] }, { data: { data: { leave_requests: [record] } } }]) {
    const [row] = leaveHistory(payload);
    assert.equal(row.id, 1);
    assert.equal(row.leaveType, 'ANNUAL');
    assert.equal(row.status, 'pending');
    assert.equal(row.startDate, '2026-10-01');
    assert.equal(row.fileUrl, '');
  }
  assert.deepEqual(leaveHistory({ data: [] }), []);
  assert.equal(leaveHistory([{ status: 'CANCELED' }])[0].status, 'cancelled');
});

test('salary history sorts by effective date, supports changes and preserves zero', () => {
  const rows = salaryHistory({ data: { history: [
    { id: 1, new_salary: '350.50', old_salary: 0, effective_date: '2026-01-01', description_salary: 'Raise' },
    { id: 2, new_salary: 0, effective_date: '2026-10-01' },
  ] } });
  assert.equal(rows[0].id, 2);
  assert.equal(rows[0].salary, 0);
  assert.equal(rows[1].previous, 0);
  assert.equal(rows[1].description, 'Raise');
  assert.equal(money(rows[1].salary), '$350.50');
  assert.equal(money(null), '—');
  assert.deepEqual(salaryHistory({ data: [] }), []);
});

test('attendance sorts records and only matches the requested day', () => {
  const rows = attendanceHistory({ data: { attendance: [
    { attendance_date: '2026-10-01', check_in_time: '08:00', check_out_time: '17:00' },
    { attendance_date: '2026-10-02', check_in: '08:05' },
  ] } });
  assert.equal(rows[0].date, '2026-10-02');
  assert.equal(rows[1].checkOutTime, '17:00');
  assert.equal(rows.find(row => row.date === '2026-10-03'), undefined);
  assert.equal(attendanceHistory({ data: { attendance: { attendance_date: '2026-10-01', check_in: '08:00' } } })[0].checkInTime, '08:00');
  assert.deepEqual(attendanceHistory({ data: [] }), []);
});

test('employee API sends mutation bodies using correct endpoints, including DELETE body', async () => {
  const source = (await readFile(new URL('../src/api/employeeApi.js', import.meta.url), 'utf8'))
    .replace("import { apiRequest } from './client';", 'const apiRequest = async (endpoint, options = {}) => ({ endpoint, ...options });')
    .replace("import { API_ENDPOINTS } from './endpoints';", `const API_ENDPOINTS = ${JSON.stringify(API_ENDPOINTS)};`);
  const { employeeApi } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.deepEqual(await employeeApi.cancelLeave(1), { endpoint: { method: 'DELETE', path: '/cancelLeaveRequest' }, body: { id: 1 } });
  const body = leaveBody({ leaveType: 'SICK', startDate: '2026-10-01', endDate: '2026-10-03', reason: 'Updated', fileUrl: 'https://example.com/proof.pdf' });
  const updated = await employeeApi.updateLeave('1', body);
  assert.equal(updated.endpoint.path, '/updateLeaveRequest');
  assert.deepEqual(updated.body, { ...body, id: 1 });
  assert.equal(body.id, undefined, 'do not mutate the form payload');
  const shortUpdate = await employeeApi.updateLeave(12, leaveBody({ leaveType: 'ANNUAL', reason: 'Family matter', startDate: '2026-10-12', endDate: '2026-10-13', fileUrl: '' }));
  assert.deepEqual(shortUpdate.body, { id: 12, reason: 'Family matter', start_date: '2026-10-12', end_date: '2026-10-13', file_url: '' });
  const created = await employeeApi.createLeave(body);
  assert.equal(created.endpoint.path, '/leaveRequest');
  assert.deepEqual(created.body, body);
  assert.throws(() => employeeApi.updateLeave('bad', body));
  assert.throws(() => employeeApi.cancelLeave(null));
  assert.deepEqual((await employeeApi.cancelLeave('1')).body, { id: 1 });
  assert.equal((await employeeApi.getLeaveHistory()).endpoint.path, '/leaveRequest/history');
  assert.equal((await employeeApi.getSalaryHistory()).endpoint.path, '/mySalary/history');
  assert.equal((await employeeApi.getAttendance()).endpoint.path, '/my-attendance');
});

test('salary summary reads the actual profile salary without inventing history or zero values', async () => {
  const { currentProfileSalary } = await import('../src/api/employeeData.js');
  assert.equal(currentProfileSalary({ data: { salary: '11994.98' } }), 11994.98);
  assert.equal(currentProfileSalary({ data: { user: { base_salary: 0 } } }), 0);
  assert.equal(currentProfileSalary({ data: { salary: null } }), null);
  assert.equal(currentProfileSalary({ data: {} }), null);
  assert.equal(currentProfileSalary({ data: { salary: 'invalid' } }), null);
  assert.deepEqual(salaryHistory({ data: [] }), []);
});
