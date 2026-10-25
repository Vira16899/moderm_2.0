const key = date => date.toISOString().slice(0, 10);
export function calendarDays(month) {
  const start = new Date(`${month}-01T00:00:00Z`);
  start.setUTCDate(1 - (start.getUTCDay() + 6) % 7);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return key(date);
  });
}
export function shiftMonth(month, offset) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return key(date).slice(0, 7);
}
export function eventsOnDay(day, employees, leaves) {
  const events = [];
  const seen = new Set();
  for (const employee of employees) {
    if (seen.has(employee.id)) continue;
    seen.add(employee.id);
    if (String(employee.dob).slice(5, 10) === day.slice(5)) events.push({ key: `birthday-${employee.id}`, kind: 'birthday', title: employee.nameKh || employee.nameEn, detail: 'ថ្ងៃខួបកំណើត' });
    if (String(employee.joinedDate).slice(0, 10) === day) events.push({ key: `hire-${employee.id}`, kind: 'hire', title: employee.nameKh || employee.nameEn, detail: 'ថ្ងៃចូលបម្រើការងារ' });
  }
  for (const leave of leaves) {
    const start = String(leave.start_date ?? leave.startDate ?? '').slice(0, 10);
    const end = String(leave.end_date ?? leave.endDate ?? '').slice(0, 10);
    const status = String(leave.status).toLowerCase();
    if (start && end && start <= day && end > day && ['pending', 'approved'].includes(status)) events.push({ key: `leave-${leave.id}`, kind: status, title: leave.userNameKh || leave.employeeNameKh || leave.khmer_name || 'បុគ្គលិក', detail: status === 'approved' ? 'ច្បាប់បានអនុម័ត' : 'ច្បាប់កំពុងរង់ចាំ' });
  }
  return events;
}
