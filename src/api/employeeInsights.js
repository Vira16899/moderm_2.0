export function employeeAttendanceTrend(records, today, count = 6) {
  const start = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const dates = new Set(records.map(row => String(row.date ?? '').slice(0, 10)).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today && Number.isFinite(Date.parse(date)) && new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date));
  return Array.from({ length:count }, (_, index) => {
    const month = new Date(start);
    month.setUTCMonth(month.getUTCMonth() - count + index + 1);
    const key = month.toISOString().slice(0, 7);
    return { key, count:[...dates].filter(date => date.startsWith(key)).length };
  });
}
