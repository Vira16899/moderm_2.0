// User department IDs are the source of truth for employee membership.
export function updateDepartmentMembership(departments, users, department) {
  const { employeeIds = [], ...savedDepartment } = department;
  const selected = new Set(employeeIds);
  const affected = new Set([department.id]);
  const nextUsers = users.map((user) => {
    if (user.role !== "EMPLOYEE") return user;
    if (selected.has(user.id)) {
      affected.add(user.departmentId);
      return { ...user, departmentId: department.id, departmentKh: department.nameKh, departmentEn: department.nameEn };
    }
    if (user.departmentId === department.id) {
      return { ...user, departmentId: "", departmentKh: "", departmentEn: "" };
    }
    return user;
  });
  const nextDepartments = departments.some((item) => item.id === department.id)
    ? departments.map((item) => item.id === department.id ? savedDepartment : item)
    : [savedDepartment, ...departments];
  return {
    users: nextUsers,
    departments: nextDepartments.map((item) => affected.has(item.id)
      ? { ...item, employeeCount: nextUsers.filter((user) => user.role === "EMPLOYEE" && user.departmentId === item.id).length }
      : item),
  };
}

export function nextDepartmentId(departments) {
  let number = 1;
  while (departments.some((department) => department.id === `DEP-${String(number).padStart(3, "0")}` || department.code === `DEP-${String(number).padStart(3, "0")}`)) number++;
  return `DEP-${String(number).padStart(3, "0")}`;
}
