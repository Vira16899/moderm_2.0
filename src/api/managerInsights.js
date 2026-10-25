const dateOnly = value => String(value ?? '').slice(0, 10);
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function managerInsights(employees, today, monthCount = 6) {
  const unique = new Map();
  for (const employee of employees) if (employee.id != null && !unique.has(String(employee.id))) unique.set(String(employee.id), employee);
  const team = [...unique.values()];
  const start = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(start);
    date.setUTCMonth(date.getUTCMonth() - monthCount + index + 1);
    const key = date.toISOString().slice(0, 7);
    const members = team.filter(employee => {
      const hired = dateOnly(employee.joinedDate);
      return validDate(hired) && hired <= today && hired.startsWith(key);
    });
    return { key, count: members.length, members };
  });
  const status = { active: 0, inactive: 0, unknown: 0 };
  const positions = new Map();
  for (const employee of team) {
    const state = String(employee.status ?? '').toLowerCase();
    status[['active', 'inactive'].includes(state) ? state : 'unknown']++;
    const name = employee.positionKh || employee.positionEn || '';
    positions.set(name, (positions.get(name) || 0) + 1);
  }
  return {
    team, months, status,
    hires: months.reduce((sum, month) => sum + month.count, 0),
    positions: [...positions].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    missingPhone: team.filter(employee => !employee.phone?.trim()),
    missingPosition: team.filter(employee => !(employee.positionKh || employee.positionEn)),
  };
}
