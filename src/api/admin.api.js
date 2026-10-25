import { API_ENDPOINTS } from './endpoints';
import { apiRequest } from './client';
import { createUserBody, updateUserBody, userIdBody } from './adminUsers';
import { profileBody } from './profile.js';
import { departmentBody, positionBody } from './departmentEditor.js';
import { employmentUserBody } from './employmentVerification.js';

// Every function sends the bearer token supplied by the current session.
const call = (endpoint, body, query) => apiRequest(endpoint, { body, query });
const numericId = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(String(value ?? '').replace(/\D/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : value;
};

export const adminApi = {
  getPositions: () => call(API_ENDPOINTS.positions.getAll),
  getPosition: id => call(API_ENDPOINTS.positions.getById, userIdBody(id)),
  createPosition: position => call(API_ENDPOINTS.positions.create, positionBody(position)),
  updatePosition: position => call(API_ENDPOINTS.positions.update, positionBody(position, true)),
  deletePosition: id => call(API_ENDPOINTS.positions.remove, userIdBody(id)),
  getUsers: () => call(API_ENDPOINTS.users.getAll),
  getUser: (id) => call(API_ENDPOINTS.users.getById, userIdBody(id)),
  createUser: (user) => call(API_ENDPOINTS.users.create, createUserBody(user)),
  updateUser: (user) => call(API_ENDPOINTS.users.update, updateUserBody(user)),
  // Admin accounts do not have the employee profile row required by /updateUser.
  // Their own personal fields are editable through the authenticated profile endpoint.
  updateOwnProfile: (user) => call(API_ENDPOINTS.profile.update, profileBody({
    newkhmer_name: user.nameKh,
    newEng_name: user.nameEn,
    newphone: user.phone,
    gender: String(user.gender ?? '').toUpperCase(),
    address: user.address,
    date_of_birth: user.dob,
    emergency_contact_name: user.emergencyContactName,
    emergency_contact_phone: user.emergencyContactPhone,
    emergency_contact_relationship: user.emergencyContactRelationship,
  })),
  deleteUser: (id) => call(API_ENDPOINTS.users.remove, { id: numericId(id) }),
  setUserStatus: (id, status) => call(API_ENDPOINTS.users.updateStatus, {
    id: numericId(id), status: String(status).toLowerCase() === 'active' ? 'active' : 'disactive',
  }),
  reactivateUser: (id) => call(API_ENDPOINTS.users.reactivate, { id: numericId(id) }),
  updateSalary: (id, baseSalary, description = '') => call(API_ENDPOINTS.salary.update, {
    id: numericId(id), base_salary: Number(baseSalary), description_salary: description,
  }),
  getSalaryHistory: (id) => call(API_ENDPOINTS.salary.getUserHistory, userIdBody(id)),

  getDepartments: () => call(API_ENDPOINTS.departments.getAll),
  getDepartment: id => call(API_ENDPOINTS.departments.getById, userIdBody(id)),
  createDepartment: department => call(API_ENDPOINTS.departments.create, departmentBody({
    name: department.name ?? department.nameKh ?? department.nameEn,
    description: department.description ?? department.descriptionKh ?? department.descriptionEn,
    user_id: department.user_id ?? department.managerId ?? null,
    positions: department.positions || [],
  })),
  updateDepartment: (department, managerId) => {
    const draft = {
      departmentId: department.departmentId ?? department.id_department ?? department.id,
      name: department.name ?? department.nameKh ?? department.nameEn,
      description: department.description ?? department.descriptionKh ?? department.descriptionEn ?? '',
      positions: department.positions, deletedPositionIds: department.deletedPositionIds,
      user_id: department.user_id ?? department.managerId ?? null,
    };
    const body = managerId === undefined && Array.isArray(draft.positions)
      ? departmentBody(draft, true)
      : { departmentId: draft.departmentId, name: draft.name, description: draft.description };
    if (managerId !== undefined) body.user_id = managerId == null || managerId === '' ? null : numericId(managerId);
    else if (Object.hasOwn(department, 'user_id')) body.user_id = department.user_id == null || department.user_id === '' ? null : Number(department.user_id);
    const { departmentId, ...fields } = body;
    return call(API_ENDPOINTS.departments.update, { ...fields, ...userIdBody(departmentId) });
  },
  deleteDepartment: departmentId => call(API_ENDPOINTS.departments.remove, userIdBody(departmentId)),
  removeEmployeeFromDepartment: (departmentId, userId) => call(API_ENDPOINTS.departments.removeEmployee, {
    department_id: userIdBody(departmentId).id, user_id: userIdBody(userId).id,
  }),

  getLeaveRequests: () => call(API_ENDPOINTS.leaveRequests.getAll),
  getLeaveRequest: (userId) => call(API_ENDPOINTS.leaveRequests.getById, { user_id: userIdBody(userId).id }),
  approveLeaveRequest: (id) => call(API_ENDPOINTS.leaveRequests.approve, { id: numericId(id) }),
  rejectLeaveRequest: (id) => call(API_ENDPOINTS.leaveRequests.reject, { id: numericId(id) }),
  deleteLeaveRequest: (id) => call(API_ENDPOINTS.leaveRequests.remove, { id: numericId(id) }),

  generateAttendanceQr: (date) => call(API_ENDPOINTS.attendance.generateQr, { attendance_date: date }),
  getAttendanceQr: () => call(API_ENDPOINTS.attendance.displayQr),
  getAttendanceRecords: () => call(API_ENDPOINTS.attendance.getRecords),
  getAttendanceToday: () => call(API_ENDPOINTS.attendance.getToday),
  getEmploymentVerification: (userId) => call(API_ENDPOINTS.documents.employmentVerification.get, undefined, employmentUserBody(userId)),
  createEmploymentVerification: (userId) => call(API_ENDPOINTS.documents.employmentVerification.create, employmentUserBody(userId)),
};

export function extractApiList(payload, keys = []) {
  const candidates = [payload, payload?.data, payload?.data?.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    for (const key of keys) {
      if (Array.isArray(candidate?.[key])) return candidate[key];
    }
  }
  return [];
}
