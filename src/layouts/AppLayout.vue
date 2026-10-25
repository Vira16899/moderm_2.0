<script lang="jsx">
import { defineComponent } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { createCompatRender, useEffect, useState } from "@/utils/vueCompat";
import { useWorkspaceStore } from "@/stores/workspace";
import Header from "@/components/layout/Header.vue";
import Sidebar from "@/components/layout/Sidebar.vue";
import NotificationsModal from "@/components/modals/NotificationsModal.vue";
import LogoutModal from "@/components/modals/LogoutModal.vue";
import { auth } from "@/auth/index.js";
import { adminApi, extractApiList } from "@/api/admin.api";
import { unwrapUser, userList, userIdentityFields, isProtectedAdminId } from "@/api/adminUsers";
import { buildPositionOptions, positionsForDepartment } from "@/data/positionOptions.js";
import { employeeApi } from "@/api/employeeApi";
import { managerApi } from "@/api/managerApi";
import { managerEmployees, managerDashboardData } from "@/api/managerData";
import { getAccessToken } from "@/api/client";
import { notify } from '@/stores/toasts.js';
import { verifyManagerAssignment } from '@/api/managerAssignments.js';
import { adminErrorMessage } from '@/utils/adminMessages.js';
import { departmentDetail } from '@/api/departmentEditor.js';

const normalizeAdminUser = (item) => {
  const rawRole = String(item.role ?? item.role_name ?? '').toUpperCase();
  const rawStatus = String(item.status ?? 'active').toLowerCase();
  return {
    ...item,
    id: String(item.id ?? item.user_id ?? ''),
    nameKh: item.nameKh ?? item.khmer_name ?? item.kh_name ?? '',
    nameEn: item.nameEn ?? item.Eng_name ?? item.eng_name ?? item.name ?? '',
    email: item.email ?? '',
    role: rawRole.includes('ADMIN') || Number(item.role_id) === 1 ? 'ADMIN' : rawRole.includes('MANAGER') || Number(item.role_id) === 2 ? 'MANAGER' : 'EMPLOYEE',
    status: item.is_active != null ? (Number(item.is_active) === 1 ? 'active' : 'inactive') : (rawStatus === 'disactive' ? 'inactive' : rawStatus),
    departmentId: String(item.departmentId ?? item.department_id ?? ''),
    departmentKh: item.departmentKh ?? item.department_name ?? '',
    positionKh: item.positionKh ?? item.position_name ?? '',
    positionEn: item.positionEn ?? item.position_name_en ?? '',
    positionId: String(item.positionId ?? item.position_id ?? ''),
    salary: item.salary ?? item.base_salary ?? null,
    phone: item.phone ?? '',
    dob: String(item.dob ?? item.birthday ?? item.date_of_birth ?? '').slice(0, 10),
    address: item.address ?? '',
    emergencyContactName: item.emergencyContactName ?? item.emergency_contact_name ?? '',
    emergencyContactPhone: item.emergencyContactPhone ?? item.emergency_contact_phone ?? '',
    emergencyContactRelationship: item.emergencyContactRelationship ?? item.emergency_contact_relationship ?? '',
    ...userIdentityFields(item),
    avatar: item.avatar ?? item.profile_image ?? '',
  };
};
const normalizeAdminDepartment = (item) => ({
  ...item,
  id: String(item.id ?? item.departmentId ?? item.department_id ?? item.id_department ?? ''),
  code: item.code ?? String(item.id ?? item.departmentId ?? item.department_id ?? item.id_department ?? ''),
  nameKh: item.nameKh ?? item.khmer_name ?? item.name ?? item.department_name ?? item.departmentName ?? '',
  nameEn: item.nameEn ?? item.Eng_name ?? item.eng_name ?? item.name ?? item.department_name ?? item.departmentName ?? '',
  managerId: String(item.managerId ?? item.manager_id ?? item.user_id ?? ''),
  managerNameKh: item.managerNameKh ?? item.manager_khmer_name ?? item.manager_name ?? '',
  managerNameEn: item.managerNameEn ?? item.manager_Eng_name ?? item.manager_name ?? '',
  managerAvatar: item.managerAvatar ?? item.manager_avatar ?? '',
  employeeCount: Number(item.employeeCount ?? item.employee_count ?? 0),
  employees: Array.isArray(item.employees) ? item.employees.filter((employee) => employee && typeof employee === 'object').map((employee) => ({
    ...employee,
    id: String(employee.id ?? employee.user_id ?? ''),
    positionId: String(employee.positionId ?? employee.position_id ?? ''),
    positionKh: employee.positionKh ?? employee.position_name ?? '',
    positionEn: employee.positionEn ?? employee.position_name_en ?? '',
  })) : [],
  descriptionKh: item.descriptionKh ?? item.description ?? '',
  descriptionEn: item.descriptionEn ?? item.description ?? '',
  location: item.location ?? '',
});
const resultId = (response) => {
  const value = response?.data?.data ?? response?.data ?? response;
  const id = value?.user?.id ?? value?.department?.id ?? value?.id ?? value?.user_id ?? value?.department_id ?? value?.insertId;
  return id == null ? null : String(id);
};
const SECTION_ROUTE_NAMES = {
  admin_dashboard: "admin-dashboard",
  admin_users: "admin-users",
  user_management: "admin-users",
  admin_departments: "admin-departments",
  admin_leave_requests: "admin-leave-requests",
  admin_attendance: "admin-attendance",
  admin_documents: "admin-documents",
  admin_profile: "admin-profile",
  manager_dashboard: "manager-dashboard",
  manager_employees: "manager-employees",
  manager_leave_requests: "manager-leave-requests",
  manager_profile: "manager-profile",
  employee_dashboard: "employee-dashboard",
  employee_profile: "employee-profile",
  dashboard: "employee-dashboard",
  employee_salary: "employee-salary",
  employee_leave_request: "employee-leave-request",
  employee_document_request: "employee-document-request",
  employee_my_requests: "employee-my-requests",
  my_submissions: "employee-my-requests",
  employee_notifications: "employee-notifications",
  attendance: "attendance",
  manager_attendance: "manager-attendance",
};

function App({ router, route }) {
  const workspace = useWorkspaceStore();
  const [, triggerRender] = useState(0);
  const useWorkspaceState = (key) => [workspace[key], (next) => {
    workspace[key] = typeof next === "function" ? next(workspace[key]) : next;
    triggerRender((version) => version + 1);
  }];
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("app_theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });
  const [isAuthenticated] = useWorkspaceState("isAuthenticated");
  const [currentUser, setCurrentUser] = useWorkspaceState("currentUser");
  const [currentRole] = useWorkspaceState("currentRole");
  const [activeSectionState, setActiveSectionState] = useWorkspaceState("activeSection");
  const activeSection = route.meta.section || activeSectionState;
  const setActiveSection = (section) => {
    setActiveSectionState(section);
    const routeName = SECTION_ROUTE_NAMES[section];
    if (routeName && route.name !== routeName) router.push({ name: routeName });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 640);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const resize = () => { setIsMobile(media.matches); setIsSidebarOpen(!media.matches); };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const showAdminError = (error) => notify(adminErrorMessage(error), 'error');
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersRefresh, setUsersRefresh] = useState(0);
  const [adminDataRefresh, setAdminDataRefresh] = useState(0);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState("");
  const [managerData, setManagerData] = useState(null);
  const [managerLoading, setManagerLoading] = useState(true);
  const [managerError, setManagerError] = useState("");
  const [managerRefresh, setManagerRefresh] = useState(0);
  const [users, setUsers] = useWorkspaceState("users");
  const [departments, setDepartments] = useWorkspaceState("departments");
  const [leaveRequests, setLeaveRequests] = useWorkspaceState("leaveRequests");
  const [documentRequests, setDocumentRequests] = useWorkspaceState("documentRequests");
  const [salaryRecords, setSalaryRecords] = useWorkspaceState("salaryRecords");
  const [attendanceToday, setAttendanceToday] = useWorkspaceState("attendanceToday");
  const [auditLogs, setAuditLogs] = useWorkspaceState("auditLogs");
  const [notifications, setNotifications] = useWorkspaceState("notifications");
  useEffect(() => {
    if (!isAuthenticated || currentRole !== "MANAGER") return;
    let active = true;
    setManagerData(null);
    setManagerLoading(true);
    setManagerError("");
    managerApi.getEmployees().then((payload) => {
      if (!active) return;
      const employees = managerEmployees(payload);
      setManagerData({ employees, dashboard: managerDashboardData(payload, employees) });
    }).catch((error) => {
      if (active) setManagerError(error.message || "មិនអាចទាញយកព័ត៌មានបានទេ។");
    }).finally(() => { if (active) setManagerLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, currentRole, currentUser?.id, managerRefresh]);
  const managerProps = {
    employees: managerData?.employees ?? [],
    dashboard: managerData?.dashboard,
    loading: managerLoading,
    error: managerError,
    onRetry: () => setManagerRefresh((value) => value + 1),
    onGetEmployee: managerApi.getEmployee,
  };
  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [theme]);
  useEffect(() => {
    if (!isAuthenticated || currentRole !== "ADMIN" || !getAccessToken()) return;
    let active = true;
    setDepartments([]);
    setDepartmentsLoading(true);
    setDepartmentsError("");
    // Ignore malformed records before normalizing the API response.
    adminApi.getDepartments().then((payload) => {
      if (active) setDepartments(extractApiList(payload, ["departments", "data"]).filter((item) => item && typeof item === 'object').map(normalizeAdminDepartment));
    }).catch((error) => {
      if (active) setDepartmentsError(error.message || "មិនអាចទាញយកបញ្ជីនាយកដ្ឋានបានទេ។");
    }).finally(() => {
      if (active) setDepartmentsLoading(false);
    });
    return () => { active = false; };
  }, [isAuthenticated, currentRole, currentUser?.id, adminDataRefresh]);
  useEffect(() => {
    if (!isAuthenticated || currentRole !== "ADMIN") return;
    let active = true;
    setUsers([]);
    setUsersLoading(true);
    setUsersError("");
    adminApi.getUsers().then((payload) => {
      if (active) setUsers(userList(payload).map(normalizeAdminUser));
    }).catch((error) => {
      if (active) setUsersError(error.message || "មិនអាចទាញយកបញ្ជីអ្នកប្រើប្រាស់បានទេ។");
    }).finally(() => { if (active) setUsersLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, currentRole, currentUser?.id, usersRefresh]);
  const callAdminApi = async (action) => {
    try { return { ok: true, data: await action() }; }
    catch (error) {
      const message = adminErrorMessage(error);
      showAdminError(message);
      return { ok: false, data: null, error: message };
    }
  };
  const handleGetAdminUser = async (id) => {
    const user = unwrapUser(await adminApi.getUser(id));
    return user ? normalizeAdminUser(user) : null;
  };
  const handleGetAdminDepartment = async (id) => {
    if (!getAccessToken()) return null;
    const payload = await adminApi.getDepartment(id);
    const selected = departments.find(item => String(item.id) === String(id)) || { id };
    return departmentDetail(payload, selected);
  };
  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await auth.logout();
    await router.replace('/login');
  };
  const handleAddUser = async (newUser) => {
    if (!getAccessToken()) return { ok: false, error: "សូមចូលប្រព័ន្ធជា Admin មុនពេលបង្កើតគណនី។" };
    const response = await callAdminApi(async () => {
      if (newUser.role === 'MANAGER') await verifyManagerAssignment(adminApi, '__new__', newUser.departmentId, {checkOccupied:true,newManager:true});
      return adminApi.createUser(newUser);
    });
    if (!response.ok) return response;
    const serverId = resultId(response.data);
    const { password: _password, ...safeUser } = newUser;
    const created = {
      ...safeUser,
      id: serverId
    };
    // Refresh the authoritative list; never manufacture an ID or retain passwords.
    setUsersRefresh((value) => value + 1);
    setAdminDataRefresh((value) => value + 1);
    setAuditLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        activityKh: `បានបង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី: ${created.nameKh} (${created.role})`,
        activityEn: `Created user account: ${created.nameEn} (${created.role})`,
        user: `${currentUser.nameKh} (${currentUser.nameEn})`,
        userRole: currentUser.role,
        action: "ADD_USER",
        module: "User Management",
        dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
        status: "success"
      },
      ...prev
    ]);
    return { ok: true, user: created };
  };
  const handleUpdateUser = async (updatedUser) => {
    if (!getAccessToken()) return { ok: false, error: "សូមចូលប្រព័ន្ធជា Admin មុនពេលកែប្រែព័ត៌មានអ្នកប្រើប្រាស់។" };
    const response = await callAdminApi(async () => {
      const existingUser = users.find((user) => String(user.id) === String(updatedUser.id));
      if (existingUser?.role === 'ADMIN') {
        if (String(currentUser?.id) !== String(updatedUser.id)) {
          throw new Error('អាចកែព័ត៌មានផ្ទាល់ខ្លួនរបស់ Admin ដែលបានចូលប្រព័ន្ធប៉ុណ្ណោះ។');
        }
        await adminApi.updateOwnProfile(updatedUser);
      } else {
        if (existingUser?.role === 'MANAGER' && updatedUser.role !== 'MANAGER') await verifyManagerAssignment(adminApi, updatedUser.id, null);
        if (updatedUser.role === 'MANAGER') await verifyManagerAssignment(adminApi, updatedUser.id, updatedUser.departmentId, {checkOccupied:true,newManager:existingUser?.role !== 'MANAGER'});
        await adminApi.updateUser(updatedUser);
      }
      const salaryWasEntered = updatedUser.salary !== '' && updatedUser.salary != null;
      if (existingUser?.role !== 'ADMIN' && salaryWasEntered && Number(existingUser?.salary) !== Number(updatedUser.salary)) {
        await adminApi.updateSalary(updatedUser.id, updatedUser.salary, 'Updated from admin user management');
      }
    });
    if (!response.ok) return response;
    // Reload the server's authoritative user record after mutation so fields
    // omitted or normalized by the endpoint are not shown as saved locally.
    setUsersRefresh((value) => value + 1);
    setAdminDataRefresh((value) => value + 1);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    setAuditLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        activityKh: `បានកែប្រែព័ត៌មានអ្នកប្រើប្រាស់: ${updatedUser.nameKh}`,
        activityEn: `Updated user profile: ${updatedUser.nameEn}`,
        user: `${currentUser.nameKh} (${currentUser.nameEn})`,
        userRole: currentUser.role,
        action: "UPDATE_USER",
        module: "User Management",
        dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
        status: "info"
      },
      ...prev
    ]);
    return { ok: true, user: updatedUser };
  };
  const handleToggleUserStatus = async (userId) => {
    if (isProtectedAdminId(userId)) return;
    const target = users.find((user) => user.id === userId);
    const nextStatus = target?.status === "active" ? "inactive" : "active";
    if (getAccessToken()) {
      const response = await callAdminApi(() => nextStatus === "active" ? adminApi.reactivateUser(userId) : adminApi.setUserStatus(userId, nextStatus));
      if (!response.ok) return;
    }
    setUsers(
      (prev) => prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === "active" ? "inactive" : "active";
          setAuditLogs((logs) => [
            {
              id: `LOG-${Date.now()}`,
              activityKh: `បានប្តូរស្ថានភាពគណនី ${u.nameKh} ទៅជា ${nextStatus}`,
              activityEn: `Changed account status for ${u.nameEn} to ${nextStatus}`,
              user: `${currentUser.nameKh} (${currentUser.nameEn})`,
              userRole: currentUser.role,
              action: "TOGGLE_STATUS",
              module: "User Management",
              dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
              status: "warning"
            },
            ...logs
          ]);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };
  const handleUpdateUserSalary = async (userId, salary, description) => {
    const response = await adminApi.updateSalary(userId, salary, description);
    const data = response?.data?.data ?? response?.data ?? response;
    const updatedSalary = Number(data?.base_salary ?? data?.salary ?? salary);
    setUsers((previous) => previous.map(user => String(user.id) === String(userId) ? { ...user, salary: updatedSalary } : user));
    return response;
  };
  const handleDeleteUser = async (userId) => {
    if (isProtectedAdminId(userId)) return { ok: false, error: 'មិនអាចលុបគណនីអ្នកគ្រប់គ្រងប្រព័ន្ធនេះបានទេ។' };
    if (getAccessToken()) {
      const response = await callAdminApi(() => adminApi.deleteUser(userId));
      if (!response.ok) return response;
    }
    const userToDelete = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (userToDelete) {
      setAuditLogs((prev) => [
        {
          id: `LOG-${Date.now()}`,
          activityKh: `បានលុបអ្នកប្រើប្រាស់: ${userToDelete.nameKh}`,
          activityEn: `Deleted user: ${userToDelete.nameEn}`,
          user: `${currentUser.nameKh} (${currentUser.nameEn})`,
          userRole: currentUser.role,
          action: "DELETE_USER",
          module: "User Management",
          dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
          status: "warning"
        },
        ...prev
      ]);
    }
  };
  const assignEmployeesToDepartment = async (departmentId, employeeIds) => {
    const positions = positionsForDepartment(buildPositionOptions(departments, users), departmentId);
    for (const employeeId of employeeIds) {
      const employee = users.find((user) => String(user.id) === String(employeeId));
      if (!employee) throw new Error(`រកមិនឃើញបុគ្គលិកលេខ ${employeeId} ទេ។`);
      const position = positions.find((item) => item.id === String(employee.positionId));
      if (!position) throw new Error(`សូមកែ ${employee.nameKh || employee.nameEn} ដោយជ្រើសនាយកដ្ឋាន និងមុខតំណែងដែលត្រូវគ្នាជាមុនសិន។`);
      await adminApi.updateUser({ ...employee, departmentId: String(departmentId), positionId: position.id, positionDepartmentId: position.departmentId });
    }
  };
  const handleAddDepartment = async (dept) => {
    if (!getAccessToken()) { const error = 'សូមចូលប្រព័ន្ធជា Admin មុនពេលគ្រប់គ្រងនាយកដ្ឋាន។'; showAdminError(error); return { ok: false, error }; }
    // Create only the department record here. A failed follow-up GET must not
    // make an already successful POST appear as if creation itself failed.
    const response = await callAdminApi(async () => {
      await verifyManagerAssignment(adminApi, dept.user_id ?? dept.managerId, null);
      return adminApi.createDepartment(dept);
    });
    if (!response.ok) return response;
    setAdminDataRefresh((value) => value + 1);
    setUsersRefresh((value) => value + 1);
    setAuditLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        activityKh: `បានបង្កើតនាយកដ្ឋានថ្មី: ${dept.nameKh}`,
        activityEn: `Created new department: ${dept.nameEn}`,
        user: `${currentUser.nameKh} (${currentUser.nameEn})`,
        userRole: currentUser.role,
        action: "ADD_DEPARTMENT",
        module: "Department Management",
        dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
        status: "success"
      },
      ...prev
    ]);
    return response;
  };
  const handleUpdateDepartment = async (dept) => {
    if (!getAccessToken()) { const error = 'សូមចូលប្រព័ន្ធជា Admin មុនពេលគ្រប់គ្រងនាយកដ្ឋាន។'; showAdminError(error); return { ok: false, error }; }
    const response = await callAdminApi(async () => {
      await verifyManagerAssignment(adminApi, Object.hasOwn(dept,'user_id') ? dept.user_id : dept.managerId, dept.id ?? dept.departmentId);
      return adminApi.updateDepartment(dept);
    });
    if (response.ok) {
      setAdminDataRefresh((value) => value + 1);
      setUsersRefresh((value) => value + 1);
      }
    return response;
  };
  const handleDeleteDepartment = async (departmentId) => {
    if (!getAccessToken()) { const error = 'សូមចូលប្រព័ន្ធជា Admin មុនពេលគ្រប់គ្រងនាយកដ្ឋាន។'; showAdminError(error); return { ok: false, error }; }
    const deptToDelete = departments.find((d) => d.id === departmentId);
    const response = await callAdminApi(() => adminApi.deleteDepartment(departmentId));
    if (!response.ok) return response;
    setAdminDataRefresh((value) => value + 1);
    setUsersRefresh((value) => value + 1);
    if (deptToDelete) {
      setAuditLogs((prev) => [
        {
          id: `LOG-${Date.now()}`,
          activityKh: `បានលុបនាយកដ្ឋាន: ${deptToDelete.nameKh}`,
          activityEn: `Deleted department: ${deptToDelete.nameEn}`,
          user: `${currentUser.nameKh} (${currentUser.nameEn})`,
          userRole: currentUser.role,
          action: "DELETE_DEPARTMENT",
          module: "Department Management",
          dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
          status: "warning"
        },
        ...prev
      ]);
    }
    return response;
  };
  const handleAssignManager = async (departmentId, managerId) => {
    if (!getAccessToken()) { const error = 'សូមចូលប្រព័ន្ធជា Admin មុនពេលចាត់តាំងប្រធានផ្នែក។'; showAdminError(error); return { ok: false, error }; }
    const mgr = users.find((u) => String(u.id) === String(managerId));
    if (managerId != null && managerId !== '' && (!mgr || mgr.role !== 'MANAGER')) { const error = 'សូមជ្រើសរើសគណនីដែលមានតួនាទីអ្នកគ្រប់គ្រងផ្នែក (MANAGER)។'; showAdminError(error); return { ok: false, error }; }
    const department = departments.find((item) => String(item.id) === String(departmentId));
    const response = await callAdminApi(async () => {
      await verifyManagerAssignment(adminApi, managerId, departmentId);
      return adminApi.updateDepartment(department || { id: departmentId }, managerId);
    });
    if (!response.ok) return response;
    setAdminDataRefresh((value) => value + 1);
    setUsersRefresh((value) => value + 1);
    setAuditLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        activityKh: managerId ? `បានចាត់តាំងប្រធានផ្នែក ${mgr?.nameKh || ''} សម្រាប់នាយកដ្ឋាន ${departmentId}` : `បានដកការចាត់តាំងប្រធានផ្នែកពីនាយកដ្ឋាន ${departmentId}`,
        activityEn: managerId ? `Assigned manager ${mgr?.nameEn || ''} to department ${departmentId}` : `Removed manager assignment from department ${departmentId}`,
        user: `${currentUser.nameKh} (${currentUser.nameEn})`,
        userRole: currentUser.role,
        action: "ASSIGN_MANAGER",
        module: "Department Management",
        dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
        status: "info"
      },
      ...prev
    ]);
    return response;
  };
  const handleApproveLeave = (id) => {
    if (currentRole === "ADMIN" && getAccessToken()) {
      callAdminApi(() => adminApi.approveLeaveRequest(id)).then((response) => {
        if (response.ok) setLeaveRequests((prev) => prev.map((request) => request.id === id ? { ...request, status: "approved" } : request));
      });
      return;
    }
    setLeaveRequests(
      (prev) => prev.map(
        (l) => l.id === id ? {
          ...l,
          status: "approved",
          reviewedBy: currentUser.nameKh,
          reviewDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        } : l
      )
    );
    setAuditLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        activityKh: `បានអនុម័តសំណើសុំច្បាប់ ${id}`,
        activityEn: `Approved leave request ${id}`,
        user: `${currentUser.nameKh} (${currentUser.nameEn})`,
        userRole: currentUser.role,
        action: "APPROVE_LEAVE",
        module: "Leave Requests",
        dateTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
        status: "success"
      },
      ...prev
    ]);
  };
  const handleRejectLeave = (id, reason) => {
    if (currentRole === "ADMIN" && getAccessToken()) {
      callAdminApi(() => adminApi.rejectLeaveRequest(id)).then((response) => {
        if (response.ok) setLeaveRequests((prev) => prev.map((request) => request.id === id ? { ...request, status: "rejected", rejectionReason: reason } : request));
      });
      return;
    }
    setLeaveRequests(
      (prev) => prev.map(
        (l) => l.id === id ? {
          ...l,
          status: "rejected",
          reviewedBy: currentUser.nameKh,
          reviewDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          rejectionReason: reason || "មិនត្រូវបានអនុម័តដោយប្រធានផ្នែក"
        } : l
      )
    );
  };
  const handleSubmitLeaveRequest = (req) => {
    const created = {
      ...req,
      id: `LV-2026-${String(leaveRequests.length + 1).padStart(3, "0")}`,
      status: "pending",
      appliedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    setLeaveRequests((prev) => [created, ...prev]);
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        category: "leave",
        titleKh: `សំណើសុំច្បាប់ថ្មីពី ${created.userNameKh || created.employeeNameKh || currentUser.nameKh}`,
        titleEn: `New leave request submitted`,
        messageKh: `បុគ្គលិកបានដាក់ពាក្យសុំច្បាប់ ${created.leaveType} រយៈពេល ${created.totalDays || created.daysCount || 1} ថ្ងៃ`,
        messageEn: `Employee requested ${created.leaveType} leave`,
        timestamp: "មុននេះបន្តិច",
        read: false,
        severity: "medium",
        linkSection: "manager_leave_requests"
      },
      ...prev
    ]);
  };
  const handleSubmitDocumentRequest = (doc) => {
    const created = {
      ...doc,
      id: `DOC-2026-${String(documentRequests.length + 1).padStart(3, "0")}`,
      status: "pending",
      requestDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    setDocumentRequests((prev) => [created, ...prev]);
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        category: "document",
        titleKh: `សំណើសុំឯកសារថ្មី: ${created.purpose || "លិខិតបញ្ជាក់"}`,
        titleEn: `New Document Request Submitted`,
        messageKh: `បុគ្គលិក ${currentUser.nameKh} បានស្នើសុំឯកសាររដ្ឋបាល`,
        messageEn: `Employee ${currentUser.nameEn} submitted document request`,
        timestamp: "មុននេះបន្តិច",
        read: false,
        severity: "medium",

      },
      ...prev
    ]);
  };
  const handleClockIn = () => {
    const now = /* @__PURE__ */ new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const dateStr = now.toISOString().split("T")[0];
    const updatedRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: currentUser.id,
      userId: currentUser.id,
      employeeNameKh: currentUser.nameKh,
      employeeNameEn: currentUser.nameEn,
      date: dateStr,
      clockIn: timeStr,
      checkInTime: timeStr,
      status: "present",
      overtimeMinutes: 0,
      shift: "វេនពេលព្រឹក (07:00 - 16:00)"
    };
    setAttendanceToday(updatedRecord);
  };
  const handleClockOut = () => {
    const now = /* @__PURE__ */ new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (attendanceToday) {
      setAttendanceToday({
        ...attendanceToday,
        clockOut: timeStr,
        checkOutTime: timeStr
      });
    }
  };
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const handleToggleNotificationRead = (id) => {
    setNotifications(
      (prev) => prev.map((n) => n.id === id ? { ...n, read: !n.read } : n)
    );
  };
  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  const handleOpenProfileTab = () => {
    setActiveSection(`${currentRole.toLowerCase()}_profile`);
  };
  if (!isAuthenticated) return null;
  // Vue Router supplies the lazily loaded page; this layout only supplies its props.
  const renderMainContent = (Page) => {
    if (activeSection === "admin_dashboard") {
      return <Page
        users={users}
        departments={departments}
        loading={usersLoading || departmentsLoading}
        error={[usersError, departmentsError].filter(Boolean).join(' · ')}
        onRetry={() => { setUsersRefresh((value) => value + 1); setAdminDataRefresh((value) => value + 1); }}

        onNavigateUsers={() => setActiveSection("admin_users")}
        onNavigateDepartments={() => setActiveSection("admin_departments")}
      />;
    }
    if (activeSection === "admin_users" || activeSection === "user_management") {
      return <Page
        users={users}
        loading={usersLoading}
        loadError={usersError}
        optionsLoading={departmentsLoading}
        optionsError={departmentsError}
        onRetry={() => setUsersRefresh((value) => value + 1)}
        departments={departments}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onToggleStatus={handleToggleUserStatus}
        onDeleteUser={handleDeleteUser}
        onGetUser={handleGetAdminUser}
        onSalaryHistory={adminApi.getSalaryHistory}
        onUpdateSalary={handleUpdateUserSalary}

      />;
    }
    if (activeSection === "admin_departments") {
      return <Page
        departments={departments}
        users={users}
        loading={departmentsLoading}
        error={departmentsError}
        onRetry={() => { setAdminDataRefresh((value) => value + 1); setUsersRefresh((value) => value + 1); }}
        onAddDepartment={handleAddDepartment}
        onUpdateDepartment={handleUpdateDepartment}
        onAssignManager={handleAssignManager}
        onDeleteDepartment={handleDeleteDepartment}
        onGetDepartment={handleGetAdminDepartment}

      />;
    }
    if (activeSection === "admin_leave_requests") {
      return <Page
        onList={adminApi.getLeaveRequests}
        onGetById={adminApi.getLeaveRequest}
        onApprove={adminApi.approveLeaveRequest}
        onReject={adminApi.rejectLeaveRequest}
        onDelete={adminApi.deleteLeaveRequest}
      />;
    }
    if (activeSection === "admin_attendance") {
      return <Page
        onGenerate={adminApi.generateAttendanceQr}
        onDisplay={adminApi.getAttendanceQr}
        onRecords={adminApi.getAttendanceRecords}
      />;
    }
    if (activeSection === "admin_documents") {
      return <Page
        users={users}
        usersLoading={usersLoading}
        usersError={usersError}
        onRetryUsers={() => setUsersRefresh((value) => value + 1)}
        onGet={adminApi.getEmploymentVerification}
        onCreate={adminApi.createEmploymentVerification}
      />;
    }
    if (activeSection === "admin_profile") {
      return <Page
        currentUser={currentUser}

      />;
    }
    if (activeSection === "manager_dashboard") {
      return <Page
        currentUser={currentUser}
        {...managerProps}

        onNavigateEmployees={() => setActiveSection("manager_employees")}
        onNavigateLeaves={() => setActiveSection("manager_leave_requests")}
      />;
    }
    if (activeSection === "manager_employees") {
      return <Page
        {...managerProps}
      />;
    }
    if (activeSection === "manager_leave_requests") {
      return <Page />;
    }
    if (activeSection === "attendance") {
      return <Page />;
    }
    if (activeSection === "manager_attendance") {
      return <Page />;
    }
    if (activeSection === "manager_profile") {
      return <Page
        currentUser={currentUser}

      />;
    }
    if (activeSection === "employee_dashboard" || activeSection === "dashboard") {
      return <Page
        currentUser={currentUser}
      />;
    }
    if (activeSection === "employee_profile") {
      return <Page
        currentUser={currentUser}

      />;
    }
    if (activeSection === "employee_salary") {
      return <Page />;
    }
    if (activeSection === "employee_leave_request") {
      return <Page />;
    }
    if (activeSection === "employee_document_request") {
      return <Page
        currentUser={currentUser}
        documentRequests={documentRequests}
        onSubmitDocumentRequest={handleSubmitDocumentRequest}

      />;
    }
    if (activeSection === "employee_my_requests" || activeSection === "my_submissions") {
      return <Page
        currentUser={currentUser}
        onLoadHistory={employeeApi.getLeaveHistory}
        documentRequests={documentRequests.filter((request) => String(request.userId ?? request.employeeId) === String(currentUser.id))}

      />;
    }
    if (activeSection === "employee_notifications") {
      return <Page
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onToggleRead={handleToggleNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onNavigateSection={setActiveSection}

      />;
    }
    if (currentRole === "ADMIN") {
      return <Page
        users={users}
        departments={departments}
        loading={usersLoading || departmentsLoading}
        error={[usersError, departmentsError].filter(Boolean).join(' · ')}
        onRetry={() => { setUsersRefresh((value) => value + 1); setAdminDataRefresh((value) => value + 1); }}

        onNavigateUsers={() => setActiveSection("admin_users")}
        onNavigateDepartments={() => setActiveSection("admin_departments")}
      />;
    }
    if (currentRole === "MANAGER") {
      return <Page
        currentUser={currentUser}
        {...managerProps}

        onNavigateEmployees={() => setActiveSection("manager_employees")}
        onNavigateLeaves={() => setActiveSection("manager_leave_requests")}
      />;
    }
    return <Page
      currentUser={currentUser}
      leaveRequests={leaveRequests}
      documentRequests={documentRequests}
      notifications={notifications}
      attendanceToday={attendanceToday}
      onClockIn={handleClockIn}
      onClockOut={handleClockOut}

      onNavigateSalary={() => setActiveSection("employee_salary")}
      onNavigateLeave={() => setActiveSection("employee_leave_request")}
      onNavigateDocuments={() => setActiveSection("employee_document_request")}
      onNavigateMyRequests={() => setActiveSection("employee_my_requests")}
      onNavigateNotifications={() => setActiveSection("employee_notifications")}
    />;
  };
  return <div
    class={`app-shell ${isSidebarOpen ? "" : "sidebar-collapsed"} h-screen max-h-screen overflow-hidden bg-slate-50/70 dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 flex flex-col  transition-colors duration-200 ${theme === "dark" ? "dark" : ""}`}
  >
      <a class="skip-link" href="#main-content-scrollable">ទៅកាន់មាតិកាចម្បង</a>
      {
    /* Header: Logo, Dark/Light mode toggle, Notification Bell, Profile */
  }
      <Header
    activeSection={activeSection}
    onNavigate={setActiveSection}
    currentRole={currentRole}
    currentUser={currentUser}
    theme={theme}
    onToggleTheme={() => setTheme((prev) => prev === "light" ? "dark" : "light")}
    notifications={notifications}
    onOpenNotifications={() => setIsNotificationsModalOpen(true)}
    onOpenProfile={handleOpenProfileTab}
    onLogoutClick={() => setIsLogoutModalOpen(true)}
    sidebarOpen={isSidebarOpen}
    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
    inert={isMobile && isSidebarOpen ? true : undefined}
  />

      {
    /* Main Container: Sidebar + Active Workspace (Sidebar is fixed, only main scrolls) */
  }
      <div class="workspace-container">
        <Sidebar
    currentRole={currentRole}
    activeSection={activeSection}
    onSelectSection={setActiveSection}
    isOpen={isSidebarOpen}
    onToggle={() => setIsSidebarOpen((prev) => !prev)}

    currentUser={currentUser}
    onOpenProfile={() => handleOpenProfileTab("view")}
    onLogoutClick={() => setIsLogoutModalOpen(true)}

  />

        {
    /* Dynamic Workspace Area: strictly scrolls independently without moving sidebar */
  }
        <main
    id="main-content-scrollable"
    tabindex="-1"
    inert={isMobile && isSidebarOpen ? true : undefined}
    class="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full"
        >
          <div class="max-w-7xl w-full mx-auto pb-4">
            <RouterView v-slots={{ default: ({ Component }) => Component ? renderMainContent(Component) : null }} />
            <footer class="workspace-footer"><span> {new Date().getFullYear()} GarmentPro</span><span>រួមគ្នាឆ្ពោះទៅរកភាពរីកចម្រើន</span></footer>
          </div>
        </main>
      </div>

      {
    /* Popups and Modals */
  }
      <NotificationsModal
    isOpen={currentRole === "EMPLOYEE" && isNotificationsModalOpen}
    onClose={() => setIsNotificationsModalOpen(false)}
    notifications={notifications}
    onMarkAllAsRead={handleMarkAllNotificationsRead}
    onToggleRead={handleToggleNotificationRead}
    onDeleteNotification={handleDeleteNotification}

  />



      <LogoutModal
    isOpen={isLogoutModalOpen}
    onClose={() => setIsLogoutModalOpen(false)}
    onConfirm={handleConfirmLogout}

  />
    </div>;
}
export default defineComponent({
  name: "AppLayout",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    const router = useRouter();
    const route = useRoute();
    return createCompatRender(App, () => ({ ...attrs, router, route }));
  }
});
</script>
