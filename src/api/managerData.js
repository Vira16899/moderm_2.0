export function unwrapManagerData(payload) {
  return payload?.data?.data ?? payload?.data ?? payload;
}

export function managerEmployeeIdBody(id) {
  if (id == null || String(id).trim() === '') throw new Error('Employee ID is required.');
  const value = String(id).trim();
  return { employeeId: /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : value };
}

export function normalizeManagerEmployee(item) {
  const user = { ...item, ...(item.user ?? item.employee ?? {}) };
  return {
    ...user,
    id: String(user.id ?? user.user_id ?? user.employee_id ?? ''),
    nameKh: user.nameKh ?? user.khmer_name ?? user.kh_name ?? user.name ?? '',
    nameEn: user.nameEn ?? user.Eng_name ?? user.eng_name ?? user.name ?? '',
    email: user.email ?? '',
    role: 'EMPLOYEE',
    status: user.is_active != null ? (Number(user.is_active) === 1 ? 'active' : 'inactive') : String(user.user_status ?? user.status ?? 'active').toLowerCase(),
    departmentId: String(user.departmentId ?? user.department_id ?? user.department?.id ?? ''),
    departmentKh: user.departmentKh ?? user.department_name ?? user.department?.name ?? '',
    departmentEn: user.departmentEn ?? user.department_name_en ?? user.department?.eng_name ?? '',
    positionKh: user.positionKh ?? user.position_name ?? user.position?.name ?? '',
    positionEn: user.positionEn ?? user.position_name_en ?? user.position?.eng_name ?? '',
    phone: user.phone ?? '',
    dob: user.dob ?? user.birthday ?? user.date_of_birth ?? '',
    joinedDate: user.joinedDate ?? user.hireDate ?? user.hire_date ?? '',
    salary: user.salary ?? user.base_salary ?? null,
    avatar: user.avatar ?? user.profile_image ?? '',
  };
}

export function managerEmployees(payload) {
  const data = unwrapManagerData(payload);
  const rows = Array.isArray(data) ? data : data?.employees ?? data?.users;
  if (!Array.isArray(rows)) throw new Error('Invalid employee list response.');
  return rows.map(normalizeManagerEmployee);
}

export function managerEmployeeDetail(profilePayload, detailPayload = profilePayload) {
  const profile = unwrapManagerData(profilePayload);
  const detail = unwrapManagerData(detailPayload);
  const record = (value) => Array.isArray(value) ? value[0] : value?.employee ?? value?.user ?? value;
  const user = record(profile);
  if (!user || !(user.id ?? user.user_id ?? user.employee_id)) throw new Error('Employee not found.');
  return normalizeManagerEmployee({ ...user, ...record(detail) });
}

export function managerDashboardData(payload, employees) {
  const data = unwrapManagerData(payload);
  const summary = data?.summary ?? data?.statistics ?? data?.stats ?? {};
  const number = (...values) => {
    const value = values.find((item) => item != null && item !== '' && Number.isFinite(Number(item)));
    return value == null ? null : Number(value);
  };
  const leaveRequests = data?.leaveRequests ?? data?.leave_requests;
  const pendingLeaves = Array.isArray(leaveRequests) ? leaveRequests.filter((item) => String(item.status).toLowerCase() === 'pending') : null;
  return {
    total: employees.length,
    present: number(summary.present, summary.presentCount, summary.present_count),
    absent: number(summary.absent, summary.absentCount, summary.absent_count),
    pending: number(summary.pendingLeaves, summary.pending_leave_requests, pendingLeaves?.length),
    pendingLeaves,
    leaveRequests: Array.isArray(leaveRequests) ? leaveRequests : null,
  };
}
