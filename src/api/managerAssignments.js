const idOf = row => String(row?.id ?? row?.departmentId ?? row?.department_id ?? '');
export const managerIdOf = department => String(department?.managerId ?? department?.manager_id ?? department?.user_id ?? department?.manager?.id ?? '');
const hasManagerField = department => ['managerId','manager_id','user_id','manager'].some(key => Object.hasOwn(department,key));

export function managerDepartments(managerId, departments = [], users = []) {
  if (managerId == null || managerId === '') return [];
  const found = new Map();
  for (const department of departments) if (managerIdOf(department) === String(managerId)) found.set(idOf(department), department);
  for (const user of users) {
    if (String(user.id ?? user.user_id) !== String(managerId)) continue;
    const assignments = user.departmentAssignments || [{id:user.departmentId ?? user.department_id,nameKh:user.departmentKh ?? user.department_name}];
    for (const assignment of assignments) {
      const id = String(assignment.id ?? '');
      if (!id) continue;
      const department = departments.find(item => idOf(item) === id);
      // Explicit department ownership wins over a stale user join/profile row.
      if (department && hasManagerField(department)) continue;
      found.set(id, department || assignment);
    }
  }
  return [...found.values()];
}

export function managerAssignmentError(managerId, departmentId, departments = [], users = [], {checkOccupied = false, newManager = false} = {}) {
  if (managerId == null || managerId === '') return '';
  if (!newManager && !users.some(user => String(user.id ?? user.user_id) === String(managerId) && (String(user.role ?? user.role_name).toUpperCase() === 'MANAGER' || Number(user.role_id) === 2))) return 'សូមជ្រើសរើសគណនីអ្នកគ្រប់គ្រងត្រឹមត្រូវ។';
  const otherDepartments = managerDepartments(managerId,departments,users).filter(item => idOf(item) !== String(departmentId ?? ''));
  if (otherDepartments.length) return 'អ្នកគ្រប់គ្រងនេះមាននាយកដ្ឋានរួចហើយ។ សូមដកការចាត់តាំងពីនាយកដ្ឋានផ្សេងជាមុនសិន។';
  const department = departments.find(item => idOf(item) === String(departmentId));
  const occupied = managerIdOf(department) && managerIdOf(department) !== String(managerId)
    || users.some(user => String(user.id ?? user.user_id) !== String(managerId) && (String(user.role ?? user.role_name).toUpperCase() === 'MANAGER' || Number(user.role_id) === 2) && managerDepartments(user.id ?? user.user_id,departments,users).some(item => idOf(item) === String(departmentId)));
  if (checkOccupied && occupied) return 'នាយកដ្ឋាននេះមានអ្នកគ្រប់គ្រងរួចហើយ។ សូមជ្រើសរើសនាយកដ្ឋានផ្សេង។';
  return '';
}

export async function verifyManagerAssignment(api, managerId, departmentId, options) {
  if (managerId == null || managerId === '') return;
  const [departmentPayload,userPayload] = await Promise.all([api.getDepartments(),api.getUsers()]);
  const list = (payload,key) => {
    if (payload?.result === false || payload?.ok === false) throw new Error(payload.message || payload.msg || 'មិនអាចផ្ទៀងផ្ទាត់ការចាត់តាំងបានទេ។');
    const data = payload?.data?.data ?? payload?.data ?? payload;
    const rows = Array.isArray(data) ? data : data?.[key];
    if (!Array.isArray(rows)) throw new Error('មិនអាចផ្ទៀងផ្ទាត់ការចាត់តាំងអ្នកគ្រប់គ្រងបានទេ។ សូមទាញយកទិន្នន័យម្ដងទៀត។');
    return rows;
  };
  const error = managerAssignmentError(managerId,departmentId,list(departmentPayload,'departments'),list(userPayload,'users'),options);
  if (error) throw new Error(error);
}
