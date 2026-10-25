import { Home as LayoutDashboard, Users, Building2, Calendar, User as UserIcon, DollarSign, FileText, ClipboardList, CalendarCheck2 } from "lucide-vue-next";

export function getNavigationItems(currentRole) {
    switch (currentRole) {
      case "ADMIN":
        return [
          {
            id: "admin_dashboard",
            labelKh: "ផ្ទាំងគ្រប់គ្រងទូទៅ",
            icon: LayoutDashboard
          },
          {
            id: "admin_users",
            labelKh: "គ្រប់គ្រងអ្នកប្រើប្រាស់",
            icon: Users
          },
          {
            id: "admin_departments",
            labelKh: "គ្រប់គ្រងនាយកដ្ឋាន",
            icon: Building2
          },
          {
            id: "admin_leave_requests",
            labelKh: "សំណើសុំច្បាប់",
            icon: Calendar
          },
          {
            id: "admin_attendance",
            labelKh: "វត្តមាន និង QR",
            icon: ClipboardList
          },
          {
            id: "admin_documents",
            labelKh: "លិខិតបញ្ជាក់ការងារ",
            icon: FileText
          },
          {
            id: "admin_profile",
            labelKh: "ព័ត៌មានគណនីខ្ញុំ",
            icon: UserIcon
          }
        ];
      case "MANAGER":
        return [
          {
            id: "manager_dashboard",
            labelKh: "ផ្ទាំងគ្រប់គ្រងផ្នែក",
            icon: LayoutDashboard
          },
          {
            id: "manager_employees",
            labelKh: "បុគ្គលិកក្នុងផ្នែកខ្ញុំ",
            icon: Users
          },
          {
            id: "manager_leave_requests",
            labelKh: "សំណើសុំច្បាប់ឈប់",
            icon: Calendar
          },
          {
            id: "manager_attendance",
            labelKh: "វត្តមាន",
            icon: CalendarCheck2
          },
          {
            id: "manager_salary",
            labelKh: "ប្រវត្តិប្រាក់ខែ",
            icon: DollarSign
          },
          {
            id: "manager_profile",
            labelKh: "ព័ត៌មានគណនីខ្ញុំ",
            icon: UserIcon
          }
        ];
      case "EMPLOYEE":
      default:
        return [
          {
            id: "employee_dashboard",
            labelKh: "ផ្ទាំងគ្រប់គ្រងផ្ទាល់ខ្លួន",
            icon: LayoutDashboard
          },
          {
            id: "employee_leave_request",
            labelKh: "ស្នើសុំច្បាប់ឈប់សម្រាក",
            icon: Calendar
          },
          {
            id: "attendance",
            labelKh: "វត្តមានរបស់ខ្ញុំ",
            icon: CalendarCheck2
          },
          {
            id: "employee_salary",
            labelKh: "ប្រវត្តិប្រាក់ខែ",
            icon: DollarSign
          },

          {
            id: "employee_profile",
            labelKh: "ព័ត៌មានប្រវត្តិរូប",
            icon: UserIcon
          }
        ];
    }
}
