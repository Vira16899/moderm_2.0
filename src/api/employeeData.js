export const leaveTypes = [
  { value: 'ANNUAL', label: 'ច្បាប់ប្រចាំឆ្នាំ' },
  { value: 'SICK', label: 'ច្បាប់ឈឺ' },
  { value: 'CASUAL', label: 'ច្បាប់ពិសេសផ្ទាល់ខ្លួន' },
  { value: 'MATERNITY', label: 'ច្បាប់សម្រាលកូន' },
  { value: 'MARRIAGE', label: 'ច្បាប់អាពាហ៍ពិពាហ៍' },
  { value: 'UNPAID', label: 'ច្បាប់គ្មានប្រាក់បៀវត្ស' },
];
export const statusLabels = { pending: 'កំពុងរង់ចាំ', approved: 'បានអនុម័ត', rejected: 'បានបដិសេធ', cancelled: 'បានលុបចោល' };
export const dateOnly = value => String(value ?? '').slice(0, 10);
export function localToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function employeeList(payload, keys) {
  for (const candidate of [payload, payload?.data, payload?.data?.data]) {
    if (Array.isArray(candidate)) return candidate;
    for (const key of keys) if (Array.isArray(candidate?.[key])) return candidate[key];
  }
  return [];
}
export function leaveDays(start, end) {
  const days = (Date.parse(dateOnly(end)) - Date.parse(dateOnly(start))) / 86400000;
  return Number.isFinite(days) && days > 0 ? days : 0;
}
export function nextLeaveDate(value) {
  const date = new Date(`${dateOnly(value)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function leaveHistory(payload) {
  return employeeList(payload, ['leaveRequests', 'leave_requests', 'requests', 'history', 'records']).map(item => ({
    ...item,
    id: item.id ?? item.leave_request_id ?? item.leaveRequestId,
    leaveType: item.leave_type ?? item.leaveType ?? '',
    startDate: dateOnly(item.start_date ?? item.startDate),
    endDate: dateOnly(item.end_date ?? item.endDate),
    appliedDate: dateOnly(item.created_at ?? item.appliedDate ?? item.request_date),
    status: String(item.status ?? item.leave_status ?? '').toLowerCase().replace('canceled', 'cancelled'),
    reason: item.reason ?? '',
    fileUrl: item.file_url ?? item.fileUrl ?? '',
    rejectionReason: item.rejection_reason ?? item.rejectionReason ?? '',
  })).sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
}
export function leaveUrlError(value) {
  if (!value?.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (['https:', 'http:'].includes(url.protocol) && url.hostname) return '';
  } catch { /* Show the same Khmer feedback for malformed and unsafe URLs. */ }
  return 'សូមបញ្ចូលតំណឯកសារត្រឹមត្រូវ ដែលចាប់ផ្តើមដោយ https:// ឬ http://។';
}
export function leaveErrors(form) {
  const errors = {};
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && Number.isFinite(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!validDate(form.startDate)) errors.startDate = 'សូមបញ្ចូលថ្ងៃចាប់ផ្តើមឱ្យបានត្រឹមត្រូវ។';
  if (!validDate(form.endDate)) errors.endDate = 'សូមបញ្ចូលថ្ងៃបញ្ចប់ឱ្យបានត្រឹមត្រូវ។';
  else if (validDate(form.startDate) && form.endDate <= form.startDate) errors.endDate = 'ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើមយ៉ាងហោចណាស់ ១ ថ្ងៃ។';
  if (!form.reason?.trim()) errors.reason = 'សូមបញ្ចូលមូលហេតុសុំច្បាប់។';
  if (leaveUrlError(form.fileUrl)) errors.fileUrl = leaveUrlError(form.fileUrl);
  else if (leaveDays(form.startDate, form.endDate) > 2 && !form.fileUrl?.trim()) errors.fileUrl = 'ការសុំច្បាប់លើសពី ២ ថ្ងៃ ត្រូវបញ្ចូលតំណឯកសារបញ្ជាក់។';
  return errors;
}
export function leaveBody(form) {
  const errors = leaveErrors(form);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    start_date: form.startDate,
    end_date: form.endDate,
    reason: form.reason.trim(),
    file_url: form.fileUrl?.trim() || '',
  };
}
export function salaryHistory(payload) {
  return employeeList(payload, ['salaryHistory', 'salary_history', 'history', 'records', 'salaries']).map((item, index) => ({
    id: item.id ?? item.history_id ?? item.salary_id ?? index,
    date: item.effective_date ?? item.change_date ?? item.created_at ?? item.updated_at ?? item.date ?? item.salary_month ?? item.month ?? '',
    salary: item.new_salary ?? item.base_salary ?? item.baseSalary ?? item.salary ?? item.amount ?? null,
    previous: item.previous_salary ?? item.old_salary ?? item.from_salary ?? null,
    description: item.description_salary ?? item.description ?? item.reason ?? '',
    netSalary: item.net_salary ?? item.netSalary ?? null,
  })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
export function attendanceHistory(payload) {
  let list = employeeList(payload, ['attendance', 'records', 'attendanceRecords', 'attendance_records', 'history']);
  if (!list.length) {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    const record = data?.attendance ?? data?.record ?? data;
    if (record && !Array.isArray(record) && (record.date || record.attendance_date)) list = [record];
  }
  return list.map(item => ({
    ...item,
    date: dateOnly(item.date ?? item.attendance_date ?? item.created_at),
    checkInTime: item.checkInTime ?? item.check_in_time ?? item.check_in ?? item.clockIn ?? item.clock_in ?? item.MORNING_CHECK_IN ?? item.morning_check_in,
    checkOutTime: item.checkOutTime ?? item.check_out_time ?? item.check_out ?? item.clockOut ?? item.clock_out ?? item.AFTERNOON_CHECK_OUT ?? item.afternoon_check_out,
  })).sort((a, b) => b.date.localeCompare(a.date));
}
export function money(value) {
  return value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}
