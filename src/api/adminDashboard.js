export function dashboardInsights(users, departments, today, monthCount = 6) {
  const staff = users.filter(user => ['EMPLOYEE', 'MANAGER'].includes(user.role));
  const employees = staff.filter(user => user.role === 'EMPLOYEE');
  const hireDate = user => String(user.joinedDate || user.hireDate || user.hire_date || '').slice(0, 10);
  const knownHires = staff.filter(user => /^\d{4}-\d{2}-\d{2}$/.test(hireDate(user)) && !Number.isNaN(Date.parse(hireDate(user))) && hireDate(user) <= today);
  const [year, month] = today.split('-').map(Number);
  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(Date.UTC(year, month - monthCount + index, 1));
    const key = date.toISOString().slice(0, 7);
    return { key, count: knownHires.filter(user => hireDate(user).startsWith(key)).length };
  });
  const departmentRows = departments.map(department => ({
    ...department,
    count: employees.filter(user => String(user.departmentId ?? user.department_id) === String(department.id)).length,
  })).sort((a, b) => b.count - a.count || String(a.nameKh || a.nameEn).localeCompare(String(b.nameKh || b.nameEn)));
  return {
    months, departmentRows,
    active: users.filter(user => user.status === 'active').length,
    inactive: users.filter(user => ['inactive', 'disactive'].includes(user.status)).length,
    unassigned: employees.filter(user => !departments.some(department => String(department.id) === String(user.departmentId ?? user.department_id))).length,
    unmanaged: departments.filter(department => !(department.managerId || department.manager_id || department.user_id) && !staff.some(user => user.role === 'MANAGER' && String(user.departmentId ?? user.department_id) === String(department.id))).length,
    missingHireDate: staff.filter(user => !hireDate(user) || Number.isNaN(Date.parse(hireDate(user)))).length,
    recentHires: [...knownHires].sort((a, b) => hireDate(b).localeCompare(hireDate(a))).slice(0, 5),
  };
}
