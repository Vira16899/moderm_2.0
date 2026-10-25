import { apiRequest } from './client';
import { API_ENDPOINTS } from './endpoints';


export const employeeApi = {
  getSalaryHistory: () => apiRequest(API_ENDPOINTS.salary.getMyHistory),
  getAttendance: () => apiRequest(API_ENDPOINTS.attendance.getMine),
  getLeaveHistory: () => apiRequest(API_ENDPOINTS.leaveRequests.getHistory),
  createLeave: (body) => apiRequest(API_ENDPOINTS.leaveRequests.create, { body }),
  updateLeave: (id, body) => apiRequest(API_ENDPOINTS.leaveRequests.update, {
    body: { ...body, id: leaveId(id) },
  }),
  cancelLeave: (id) => apiRequest(API_ENDPOINTS.leaveRequests.cancel, {
    body: { id: leaveId(id) },
  }),
};

function leaveId(id) {
  const value = Number(id);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('លេខសំណើមិនត្រឹមត្រូវ។');
  return value;
}

export function extractEmployeeList(payload, keys = []) {
  const candidates = [payload, payload?.data, payload?.data?.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    for (const key of keys) {
      if (Array.isArray(candidate?.[key])) return candidate[key];
    }
  }
  return [];
}






