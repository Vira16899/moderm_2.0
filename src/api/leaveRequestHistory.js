export function newestLeaveRequests(rows) {
  const timestamp = row => {
    const date = row.createdAt || row.created_at || row.appliedDate || row.request_date || row.startDate || row.start_date;
    const value = Date.parse(date);
    return Number.isNaN(value) ? 0 : value;
  };
  return [...rows].sort((a, b) => timestamp(b) - timestamp(a) || Number(b.id || 0) - Number(a.id || 0));
}

export function splitLeaveRequests(rows) {
  const recent = [], history = [], seen = new Set();
  for (const row of newestLeaveRequests(rows)) {
    const userId = row.employeeId || row.user_id;
    if (!userId) { recent.push(row); continue; }
    const key = String(userId);
    if (seen.has(key)) history.push(row);
    else { seen.add(key); recent.push(row); }
  }
  return { recent, history };
}
