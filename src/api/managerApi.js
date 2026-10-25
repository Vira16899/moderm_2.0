import { apiRequest } from './client';
import { API_ENDPOINTS } from './endpoints';
import { managerEmployeeDetail, managerEmployeeIdBody } from './managerData';

export const managerApi = {
  getEmployees: () => apiRequest(API_ENDPOINTS.manager.getEmployees),
  async getEmployee(id) {
    const detail = await apiRequest(API_ENDPOINTS.manager.getEmployeeDetail, {
      body: managerEmployeeIdBody(id),
    });
    return managerEmployeeDetail(detail);
  },
};
