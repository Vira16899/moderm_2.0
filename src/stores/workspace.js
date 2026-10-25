import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { auth } from '@/auth/index.js';
import {
  INITIAL_ATTENDANCE_TODAY,
  INITIAL_AUDIT_LOGS,
  INITIAL_DEPARTMENTS,
  INITIAL_DOCUMENT_REQUESTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SALARY_RECORDS,
  INITIAL_USERS,
} from "@/data/initialData";

export const useWorkspaceStore = defineStore("workspace", () => {
  const isAuthenticated = computed(() => Boolean(auth.state.user));
  const currentUser = computed({ get: () => auth.state.user, set: (user) => {
    if (auth.state.user) auth.state.user = { ...user, role: auth.state.user.role, role_id: auth.state.user.role_id };
  } });
  const currentRole = computed(() => auth.state.user?.role ?? null);
  const activeSection = ref("admin_dashboard");
  const users = ref(INITIAL_USERS.map((user) => ({ ...user })));
  const departments = ref(INITIAL_DEPARTMENTS.map((department) => ({ ...department })));
  const leaveRequests = ref(INITIAL_LEAVE_REQUESTS.map((request) => ({ ...request })));
  const documentRequests = ref(INITIAL_DOCUMENT_REQUESTS.map((request) => ({ ...request })));
  const salaryRecords = ref(INITIAL_SALARY_RECORDS.map((record) => ({ ...record })));
  const attendanceToday = ref({ ...INITIAL_ATTENDANCE_TODAY });
  const auditLogs = ref(INITIAL_AUDIT_LOGS.map((log) => ({ ...log })));
  const notifications = ref(INITIAL_NOTIFICATIONS.map((notification) => ({ ...notification })));

  return {
    isAuthenticated,
    currentUser,
    currentRole,
    activeSection,
    users,
    departments,
    leaveRequests,
    documentRequests,
    salaryRecords,
    attendanceToday,
    auditLogs,
    notifications,
  };
});
