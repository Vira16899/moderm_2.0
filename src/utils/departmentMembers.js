export function departmentMembers(department, users = []) {
  const id = String(department.id);
  const candidates = [...(department.employees || []), ...users.filter(user => String(user.departmentId ?? user.department_id ?? '') === id && !['ADMIN', 'MANAGER'].includes(String(user.role || '').toUpperCase()))];
  const members = new Map();
  for (const member of candidates) {
    const key = member.id ?? member.user_id ?? member.employee_id;
    if (key == null || key === '') continue;
    const profile = users.find(user => String(user.id) === String(key));
    members.set(String(key), { ...profile, ...members.get(String(key)), ...member, avatar: member.avatar || profile?.avatar || members.get(String(key))?.avatar });
  }
  return [...members.values()];
}
