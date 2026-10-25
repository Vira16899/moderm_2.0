
import { createRouter, createWebHistory } from "vue-router";

import { auth, passwordReset } from "@/auth/index.js";
import { createResetGuard } from "@/auth/passwordReset.js";
import { createAuthGuard } from "@/auth/guard.js";

const routes = [
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: {
      guestOnly: true,
      title: "Sign in",
    },
  },
  {
    path: "/verify-admin-otp",
    alias: "/verify-otp",
    name: "verify-admin-otp",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: {
      guestOnly: true,
      adminOtp: true,
      title: "Verify admin OTP",
    },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("@/views/auth/PasswordResetView.vue"),
    meta: {
      resetStage: "request",
      title: "ភ្លេចពាក្យសម្ងាត់",
    },
  },
  {
    path: "/verify-reset-otp",
    name: "verify-reset-otp",
    component: () => import("@/views/auth/PasswordResetView.vue"),
    meta: {
      resetStage: "verify",
      title: "ផ្ទៀងផ្ទាត់លេខកូដកំណត់ពាក្យសម្ងាត់ថ្មី",
    },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/views/auth/PasswordResetView.vue"),
    meta: {
      resetStage: "reset",
      title: "កំណត់ពាក្យសម្ងាត់ថ្មី",
    },
  },

  // ==========================================
  // ATTENDANCE QR DISPLAY
  // Public TV display
  // ==========================================
  {
    path: "/attendanceQrDisplay",
    name: "attendance-tv-qr",
    component: () =>
      import("@/views/attendance/AttendanceQRDisplay.vue"),
    meta: {
      title: "Attendance QR Display",
    },
  },

  // ==========================================
  // MAIN APPLICATION
  // ==========================================
  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        redirect: { name: "admin-dashboard" },
      },

      // ==========================================
      // ADMIN
      // ==========================================
      {
        path: "admin/dashboard",
        name: "admin-dashboard",
        component: () => import("@/views/admin/AdminDashboard.vue"),
        meta: {
          section: "admin_dashboard",
          title: "Admin Dashboard",
        },
      },
      {
        path: "admin/users",
        name: "admin-users",
        component: () =>
          import("@/views/admin/AdminUserManagement.vue"),
        meta: {
          section: "admin_users",
          title: "User Management",
        },
      },
      {
        path: "admin/departments",
        name: "admin-departments",
        component: () =>
          import("@/views/admin/AdminDepartmentManagement.vue"),
        meta: {
          section: "admin_departments",
          title: "Departments",
        },
      },
      {
        path: "admin/leave-requests",
        name: "admin-leave-requests",
        component: () =>
          import("@/views/admin/AdminLeaveRequestsView.vue"),
        meta: {
          section: "admin_leave_requests",
          title: "Leave Requests",
        },
      },
      {
        path: "admin/attendance",
        name: "admin-attendance",
        component: () =>
          import("@/views/admin/AdminAttendanceView.vue"),
        meta: {
          section: "admin_attendance",
          title: "Attendance",
        },
      },
      {
        path: "admin/attendance/qr-generate",
        name: "AttendanceQRDisplay",
        component: () =>
          import("@/views/admin/attendance/AttendanceQRGenerate.vue"),
        meta: {
          section: "admin_attendance",
          title: "Generate Attendance QR",
          requiresAuth: true,
          role: "ADMIN",
        },
      },
      {
        path: "admin/documents",
        name: "admin-documents",
        component: () =>
          import("@/views/admin/AdminDocumentsView.vue"),
        meta: {
          section: "admin_documents",
          title: "Documents",
        },
      },
      {
        path: "admin/salary",
        redirect: { name: "admin-users" },
      },
      {
        path: "admin/profile",
        name: "admin-profile",
        component: () =>
          import("@/views/employee/EmployeeProfileView.vue"),
        meta: {
          section: "admin_profile",
          title: "Profile",
        },
      },

      // ==========================================
      // MANAGER
      // ==========================================
      {
        path: "manager/dashboard",
        name: "manager-dashboard",
        component: () =>
          import("@/views/manager/ManagerDashboard.vue"),
        meta: {
          section: "manager_dashboard",
          title: "Manager Dashboard",
        },
      },
      {
        path: "manager/employees",
        name: "manager-employees",
        component: () =>
          import("@/views/manager/ManagerEmployeesView.vue"),
        meta: {
          section: "manager_employees",
          title: "Employees",
        },
      },
      {
        path: "manager/leave-requests",
        name: "manager-leave-requests",
        component: () =>
          import("@/views/manager/ManagerLeaveRequestsView.vue"),
        meta: {
          section: "manager_leave_requests",
          title: "Leave Requests",
        },
      },
      {
        path: "manager/attendance",
        name: "manager-attendance",
        component: () => import("@/views/manager/ManagerAttendanceView.vue"),
        meta: {
          section: "manager_attendance",
          title: "Department Attendance",
          role: "MANAGER",
        },
      },
      {
        path: "manager/profile",
        name: "manager-profile",
        component: () =>
          import("@/views/employee/EmployeeProfileView.vue"),
        meta: {
          section: "manager_profile",
          title: "Profile",
        },
      },
      {
        path: "attendance",
        name: "attendance",
        component: () => import("@/views/attendance/AttendanceScan.vue"),
        meta: {
          section: "attendance",
          title: "Attendance",
          roles: ["MANAGER", "EMPLOYEE"],
        },
      },

      // ==========================================
      // ==========================================
      // EMPLOYEE
      // ==========================================
      {
        path: "employee/dashboard",
        name: "employee-dashboard",
        component: () =>
          import("@/views/employee/EmployeeDashboard.vue"),
        meta: {
          section: "employee_dashboard",
          title: "Employee Dashboard",
        },
      },
      {
        path: "employee/profile",
        name: "employee-profile",
        component: () =>
          import("@/views/employee/EmployeeProfileView.vue"),
        meta: {
          section: "employee_profile",
          title: "Profile",
        },
      },
      {
        path: "employee/salary",
        name: "employee-salary",
        component: () =>
          import("@/views/employee/EmployeeSalaryView.vue"),
        meta: {
          section: "employee_salary",
          title: "Salary",
        },
      },
      {
        path: "employee/leave-request",
        alias: "/employee/leave-history",
        name: "employee-leave-request",
        component: () =>
          import("@/views/employee/EmployeeLeaveRequestView.vue"),
        meta: {
          section: "employee_leave_request",
          title: "Leave Request",
        },
      },
      {
        path: "employee/document-request",
        name: "employee-document-request",
        component: () =>
          import("@/views/employee/EmployeeDocumentRequestView.vue"),
        meta: {
          section: "employee_document_request",
          title: "Document Request",
        },
      },
      {
        path: "employee/my-requests",
        name: "employee-my-requests",
        component: () =>
          import("@/views/employee/EmployeeMyRequestsView.vue"),
        meta: {
          section: "employee_my_requests",
          title: "My Requests",
        },
      },
      {
        path: "employee/notifications",
        name: "employee-notifications",
        component: () =>
          import("@/views/shared/NotificationsView.vue"),
        meta: {
          section: "employee_notifications",
          title: "Notifications",
        },
      },

      // ==========================================
      // NOT FOUND
      // ==========================================
      {
        path: ":pathMatch(.*)*",
        redirect: { name: "admin-dashboard" },
      },
    ],
  },
];

// ==========================================
// APPLY ROLE METADATA
// ==========================================
for (const route of routes) {
  for (const child of route.children || []) {
    const role = child.path.split("/")[0].toUpperCase();

    if (["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
      child.meta = {
        ...child.meta,
        role,
      };
    }
  }
}

// ==========================================
// CREATE ROUTER
// ==========================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ==========================================
// AUTHENTICATION GUARDS
// ==========================================
router.beforeEach(createResetGuard(passwordReset));
router.beforeEach(createAuthGuard(auth));

// ==========================================
// PAGE TITLE
// ==========================================
router.beforeEach((to) => {
  const pageTitle = to.meta.title
    ? `${to.meta.title} - GarmentPro`
    : "GarmentPro";

  document.title = pageTitle;

  return true;
});

export default router;
