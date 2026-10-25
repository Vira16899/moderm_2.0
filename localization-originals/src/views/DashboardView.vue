<template>
  <div class="dashboard-creative space-y-8">
    <div class="dashboard-hero mb-8">
      <h1 class="text-3xl font-semibold text-gray-900 mb-2">
        {{ dashboardTitle }}
      </h1>
      <p class="text-gray-500 font-normal">
        {{ dashboardSubtitle }}
      </p>
    </div>

    <div
      v-if="!currentRole"
      class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-gray-600"
    >
      Unable to load dashboard because this account does not have a valid role.
    </div>

    <!-- Stats Cards -->
    <div
      v-else
      class="dashboard-stat-grid grid grid-cols-1 md:grid-cols-2 gap-7"
      :class="currentRole === 'STAFF' ? 'xl:grid-cols-2' : 'xl:grid-cols-3'"  
    >
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="dashboard-stat-card creative-stat-card bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 group"
      >
        <div
          class="relative z-10 flex h-full items-center justify-between gap-5"
        >
          <div>
            <p class="dashboard-stat-label text-gray-500">
              {{ card.label }}
            </p>
            <h2 class="dashboard-stat-value text-gray-900">{{ card.value }}</h2>
            <p
              v-if="currentRole === 'STAFF' && card.caption"
              class="mt-1 text-xs text-gray-500"
            >
              {{ card.caption }}
            </p>
          </div>
          <div
            class="dashboard-stat-icon creative-stat-icon flex items-center justify-center transition-transform group-hover:scale-105"
            :class="card.color"
          >
            <component :is="card.icon" class="w-7 h-7" />
          </div>
        </div>
        <span class="creative-stat-line"></span>
      </div>
    </div>

    <!-- Visual Analytics -->
    <div v-if="currentRole" class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div
        class="creative-panel bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-7"
      >
        <div class="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">
              {{ analyticsTitle }}
            </h3>
            <p class="text-sm text-gray-400">{{ analyticsSubtitle }}</p>
          </div>
          <span
            class="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500"
          >
            {{ analyticsTotal }} សរុប
          </span>
        </div>

        <div
          class="creative-chart-grid flex h-56 items-end gap-4 border-b border-gray-100 px-1 pb-4"
        >
          <div
            v-for="bar in analyticsBars"
            :key="bar.label"
            class="flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
          >
            <div
              class="flex h-40 w-full items-end justify-center rounded-xl bg-gray-50 px-2"
            >
              <div
                class="w-full max-w-12 rounded-t-xl transition-all duration-700"
                :class="bar.color"
                :style="{ height: `${bar.height}%` }"
              ></div>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">{{ bar.value }}</p>
              <p class="truncate text-xs text-gray-400">{{ bar.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="creative-panel bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-5"
      >
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-900">{{ mixTitle }}</h3>
          <p class="text-sm text-gray-400">{{ mixSubtitle }}</p>
        </div>
        <div
          class="grid grid-cols-1 gap-6 sm:grid-cols-[160px_1fr] sm:items-center"
        >
          <div
            class="mx-auto h-40 w-40 rounded-full"
            :style="{ background: donutBackground }"
          >
            <div
              class="flex h-full w-full items-center justify-center rounded-full p-5"
            >
              <div
                class="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-inner"
              >
                <span class="text-2xl font-semibold text-gray-900">{{
                  analyticsTotal
                }}</span>
                <span class="text-xs text-gray-400">កំណត់ត្រា</span>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="item in analyticsMix"
              :key="item.label"
              class="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="h-3 w-3 rounded-full" :class="item.color"></span>
                <span class="truncate text-sm font-medium text-gray-700">{{
                  item.label
                }}</span>
              </div>
              <span class="text-sm font-semibold text-gray-900">{{
                item.value
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Content for Admin -->
    <div
      v-if="user?.role === 'ADMIN'"
      class="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-8"
    >
      <div
        class="lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm"
      >
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-xl font-normal text-gray-900">
              របាយការណ៍រង់ចាំពិនិត្យ
            </h3>
            <p class="text-sm text-gray-400 mt-1">
              ការងារសំខាន់ៗដែលត្រូវដោះស្រាយ
            </p>
          </div>
          <span
            class="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full"
          >
            {{ pendingReports.length }} រង់ចាំ
          </span>
        </div>
        <div v-if="pendingReports.length" class="space-y-4">
          <div
            v-for="report in pendingReports"
            :key="report.id"
            class="flex items-center justify-between gap-4 py-4 border-b border-gray-50 last:border-0"
          >
            <div class="flex flex-col">
              <span class="text-gray-900 font-normal text-base">{{
                report.title || "-"
              }}</span>
              <span class="text-sm text-gray-400 font-normal">
                {{ report.staffName }} • {{ report.managerName }}
              </span>
            </div>
            <span
              class="text-xs text-gray-500 font-normal bg-gray-50 px-3 py-1.5 rounded-full whitespace-nowrap"
              >{{
                report.submittedAt
                  ? new Date(report.submittedAt).toLocaleDateString()
                  : "Draft"
              }}</span
            >
          </div>
        </div>
        <div v-else-if="isLoadingAdminDashboard" class="py-2">
          <SkeletonLoader type="list" :rows="4" />
        </div>
        <div
          v-else
          class="text-center text-gray-400 py-10 border border-dashed border-gray-100 rounded-xl"
        >
          មិនមានរបាយការណ៍រង់ចាំពិនិត្យទេ
        </div>
      </div>

      <div
        class="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm"
      >
        <h3 class="text-xl font-normal text-gray-900 mb-8">ស្ថិតិរហ័ស</h3>
        <div class="space-y-8">
          <div v-for="stat in quickStats" :key="stat.label">
            <div class="flex items-center justify-between text-sm mb-3">
              <span class="text-gray-900 font-normal">{{ stat.label }}</span>
              <span class="text-gray-500 font-normal"
                >{{ stat.value }}{{ stat.suffix }}</span
              >
            </div>
            <div
              class="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner"
            >
              <div
                class="h-full rounded-full transition-all duration-1000 shadow-sm"
                :class="stat.color"
                :style="{ width: stat.value + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm"
      >
        <h3 class="text-xl font-normal text-gray-900 mb-6">
          ការចែកចាយអ្នកប្រើប្រាស់
        </h3>
        <div class="space-y-4">
          <div
            v-for="role in roleBreakdown"
            :key="role.label"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="h-3 w-3 rounded-full" :class="role.color"></span>
              <span class="text-gray-700">{{ role.label }}</span>
            </div>
            <span class="font-normal text-gray-900">{{ role.value }}</span>
          </div>
        </div>
      </div>

      <div
        class="lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm"
      >
        <h3 class="text-xl font-normal text-gray-900 mb-6">ទិដ្ឋភាពប្រព័ន្ធ</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="item in systemHealth"
            :key="item.label"
            class="bg-gray-50 border border-gray-100 rounded-xl p-5"
          >
            <p class="text-xs uppercase tracking-wider text-gray-400 mb-2">
              {{ item.label }}
            </p>
            <p class="text-2xl font-normal text-gray-900">{{ item.value }}</p>
            <p class="text-xs text-gray-500 mt-2">{{ item.subtext }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Content for Manager -->
    <div
      v-if="currentRole === 'MANAGER'"
      class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h3 class="text-xl font-normal text-gray-900 mb-6">ការងារត្រូវធ្វើ</h3>
        <div v-if="managerTasks.length" class="space-y-4">
          <div
            v-for="task in managerTasks"
            :key="task.label"
            class="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0"
          >
            <span class="text-gray-700">{{ task.label }}</span>
            <span
              class="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full"
            >
              {{ task.value }}
            </span>
          </div>
        </div>
        <div v-else-if="isLoadingManagerDashboard" class="py-2">
          <SkeletonLoader type="list" :rows="4" />
        </div>
        <div
          v-else
          class="text-center text-gray-400 py-8 border border-dashed border-gray-100 rounded-xl"
        >
          មិនមានទិន្នន័យត្រូវបង្ហាញទេ
        </div>
      </div>

      <div class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h3 class="text-xl font-normal text-gray-900 mb-6">ក្រុមសកម្ម</h3>
        <div v-if="managerTeams.length" class="space-y-4">
          <div v-for="team in managerTeams" :key="team.name">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-700">{{ team.name }}</span>
              <span class="text-sm text-gray-500"
                >{{ team.members }} សមាជិក</span
              >
            </div>
            <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#84A98C]"
                :style="{ width: `${team.progress}%` }"
              />
            </div>
          </div>
        </div>
        <div v-else-if="isLoadingManagerDashboard" class="py-2">
          <SkeletonLoader type="list" :rows="4" />
        </div>
        <div
          v-else
          class="text-center text-gray-400 py-8 border border-dashed border-gray-100 rounded-xl"
        >
          មិនមានក្រុមសកម្មទេ
        </div>
      </div>
    </div>

    <!-- Additional Content for Staff -->
    <div
      v-if="currentRole === 'STAFF'"
      class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h3 class="text-xl font-normal text-gray-900 mb-6">ព័ត៌មានបុគ្គលិក</h3>
        <div class="space-y-4">
          <div
            v-for="item in staffInfo"
            :key="item.label"
            class="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0"
          >
            <span class="text-gray-500">{{ item.label }}</span>
            <span class="text-gray-900">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h3 class="text-xl font-normal text-gray-900 mb-6">
          សកម្មភាពរបស់ខ្ញុំ
        </h3>
        <div class="space-y-4">
          <router-link
            v-for="activity in staffActivities"
            :key="activity.label"
            :to="activity.path"
            class="flex items-center justify-between text-gray-700 border-b border-gray-50 pb-4 last:border-0 last:pb-0 hover:text-[#52796F]"
          >
            <span>{{ activity.label }}</span>
            <span class="text-sm text-gray-400">{{ activity.value }}</span>
          </router-link>
        </div>
      </div>

      <div
        class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm lg:col-span-2"
      >
        <div class="mb-6 flex items-center justify-between gap-4">
          <h3 class="text-xl font-normal text-gray-900">
            ប្រវត្តិប្រាក់បៀវត្សថ្មីៗ
          </h3>
          <router-link
            to="/staff/salary-history"
            class="text-sm font-medium text-[#52796F] hover:text-[#354F52]"
          >
            មើលទាំងអស់
          </router-link>
        </div>
        <div
          v-if="isLoadingStaffSalary"
          class="overflow-hidden rounded-xl border border-gray-100"
        >
          <SkeletonLoader type="table" :rows="4" :columns="3" />
        </div>
        <div
          v-else-if="!staffSalaryHistory.length"
          class="text-center text-gray-400 py-8 border border-dashed border-gray-100 rounded-xl"
        >
          រកមិនឃើញប្រវត្តិប្រាក់បៀវត្សទេ។
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  មុន
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  បច្ចុប្បន្ន
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  ថ្ងៃអនុវត្ត
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr
                v-for="record in staffSalaryHistory.slice(0, 3)"
                :key="record.id"
              >
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ formatCurrency(record.previousSalary) }}
                </td>
                <td class="px-4 py-3 text-sm font-semibold text-emerald-600">
                  {{ formatCurrency(record.newSalary) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ formatDate(record.effectiveDate) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import {
  groupsApi,
  performanceReportsApi,
  salaryHistoryApi,
  usersApi,
} from "@/api/api";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import {
  Users as UsersIcon,
  UsersRound as UsersRoundIcon,
  FileText as FileTextIcon,
  DollarSign as DollarSignIcon,
  Bell as BellIcon,
  CheckCircle as CheckCircleIcon,
} from "lucide-vue-next";

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const currentRole = computed(() => user.value?.role);
const isLoadingAdminDashboard = ref(false);
const isLoadingManagerDashboard = ref(false);
const adminUsers = ref([]);
const adminGroups = ref([]);
const adminReports = ref([]);
const managerStaff = ref([]);
const managerGroups = ref([]);
const managerReports = ref([]);
const staffSalaryHistory = ref([]);
const isLoadingStaffSalary = ref(false);
const adminTotals = ref({
  users: 0,
  groups: 0,
  reports: 0,
});
const managerTotals = ref({
  staff: 0,
  groups: 0,
  reports: 0,
});

const dashboardTitle = computed(() => {
  switch (currentRole.value) {
    case "ADMIN":
      return "ផ្ទាំងគ្រប់គ្រង";
    case "MANAGER":
      return "ផ្ទាំងគ្រប់គ្រង";
    case "STAFF":
      return "ផ្ទាំងគ្រប់គ្រង";
    default:
      return "ផ្ទាំងគ្រប់គ្រង";
  }
});

const dashboardSubtitle = computed(() =>
  user.value?.fullName
    ? `សូមស្វាគមន៍ត្រឡប់មកវិញ ${user.value.fullName}!`
    : "សូមស្វាគមន៍ត្រឡប់មកវិញ!",
);

const getResponseData = (response) => response.data?.data || response.data;

const getList = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  return Array.isArray(data) ? data : [];
};

const getTotal = (data, list) =>
  Number(
    data?.total ||
      data?.totalItems ||
      data?.totalRecords ||
      data?.totalUsers ||
      data?.totalGroups ||
      data?.totalReports ||
      data?.meta?.total ||
      data?.pagination?.total ||
      list.length,
  );

const normalizeRole = (role) => {
  if (!role) return "";
  if (typeof role === "object") {
    return normalizeRole(role.name || role.role || role.code || role.value);
  }
  return String(role).trim().toUpperCase();
};

const getRoleName = (roleId) => {
  const roles = {
    1: "ADMIN",
    2: "MANAGER",
    3: "STAFF",
  };

  return roles[Number(roleId)] || "";
};

const normalizeUser = (item) => ({
  ...item,
  id: String(
    item.id || item.userId || item.user_id || item._id || item.uuid || "",
  ),
  role:
    normalizeRole(item.role || item.userRole || item.type) ||
    getRoleName(
      item.roleId || item.role_id || item.role?.id || item.userRole?.id,
    ),
  status: String(item.status || item.accountStatus || "").toUpperCase(),
});

const getPersonName = (source = {}) =>
  source.fullName ||
  source.fullname ||
  source.full_name ||
  source.name ||
  source.username ||
  source.email ||
  "-";

const normalizeReport = (report) => {
  const staff =
    report.staff || report.user || report.employee || report.staffMember || {};
  const manager = report.manager || report.reviewer || report.createdBy || {};

  return {
    ...report,
    id: String(
      report.id ||
        report.reportId ||
        report.performanceReportId ||
        report.report_id ||
        report.performance_report_id ||
        report._id ||
        report.uuid ||
        "",
    ),
    title: report.title || "",
    status: String(report.status || "DRAFT").toUpperCase(),
    staffName: report.staffName || report.staff_name || getPersonName(staff),
    managerName:
      report.managerName || report.manager_name || getPersonName(manager),
    submittedAt: report.submittedAt || report.submitted_at || "",
  };
};

const normalizeGroup = (group) => ({
  ...group,
  id: String(
    group.id ||
      group.groupId ||
      group.group_id ||
      group._id ||
      group.uuid ||
      "",
  ),
  name: group.name || group.groupName || group.group_name || "Untitled group",
  memberCount:
    Number(
      group.memberCount ||
        group.member_count ||
        group.membersCount ||
        group.members?.length ||
        group.memberIds?.length ||
        group.member_ids?.length ||
        0,
    ) || 0,
});

const toNumber = (value) => {
  const numberValue = Number(value || 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatCurrency = (value) =>
  toNumber(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const getSalaryHistoryList = (data) =>
  data?.salaryHistory ||
  data?.history ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const normalizeSalaryRecord = (record) => ({
  ...record,
  id: String(
    record.id || record._id || `${record.createdAt}-${record.effectiveDate}`,
  ),
  previousSalary: toNumber(record.previousSalary || record.oldSalary),
  newSalary: toNumber(
    record.newSalary || record.currentSalary || record.salary,
  ),
  changeReason: record.changeReason || record.reason || "",
  effectiveDate: record.effectiveDate || record.effective_date || "",
  createdAt: record.createdAt || record.created_at || "",
});

const sortedSalaryHistory = (records) =>
  [...records].sort((first, second) => {
    const firstDate = new Date(
      first.createdAt || first.effectiveDate,
    ).getTime();
    const secondDate = new Date(
      second.createdAt || second.effectiveDate,
    ).getTime();

    return (secondDate || 0) - (firstDate || 0);
  });

const latestStaffSalary = computed(() => staffSalaryHistory.value[0] || null);
const currentStaffSalary = computed(
  () => latestStaffSalary.value?.newSalary || toNumber(user.value?.salary),
);

const submittedReports = computed(() =>
  adminReports.value.filter((report) => report.status === "SUBMITTED"),
);

const reviewedReports = computed(() =>
  adminReports.value.filter((report) => report.status === "REVIEWED"),
);

const activeUsers = computed(() =>
  adminUsers.value.filter((item) =>
    ["ACTIVATED", "ACTIVE", "ENABLED"].includes(item.status),
  ),
);

const adminCards = computed(() => [
  {
    label: "អ្នកប្រើប្រាស់សរុប",
    value: adminTotals.value.users,
    icon: UsersIcon,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "អ្នកគ្រប់គ្រងសរុប",
    value: adminUsers.value.filter((item) => item.role === "MANAGER").length,
    icon: UsersIcon,
    color: "bg-sky-50 text-blue-600",
  },
  {
    label: "បុគ្គលិកសរុប",
    value: adminUsers.value.filter((item) => item.role === "STAFF").length,
    icon: UsersIcon,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "ក្រុមសរុប",
    value: adminTotals.value.groups,
    icon: UsersRoundIcon,
    color: "bg-amber-50 text-amber-500",
  },
  {
    label: "របាយការណ៍បានដាក់ស្នើ",
    value: submittedReports.value.length,
    icon: FileTextIcon,
    color: "bg-amber-50 text-amber-500",
  },
  {
    label: "របាយការណ៍បានពិនិត្យ",
    value: reviewedReports.value.length,
    icon: CheckCircleIcon,
    color: "bg-emerald-50 text-emerald-600",
  },
]);

const managerDraftReports = computed(() =>
  managerReports.value.filter((report) => report.status === "DRAFT"),
);

const managerSubmittedReports = computed(() =>
  managerReports.value.filter((report) => report.status === "SUBMITTED"),
);

const managerReviewedReports = computed(() =>
  managerReports.value.filter((report) => report.status === "REVIEWED"),
);

const managerCards = computed(() => [
  {
    label: "បុគ្គលិករបស់ខ្ញុំ",
    value: managerTotals.value.staff,
    icon: UsersIcon,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "ក្រុមរបស់ខ្ញុំ",
    value: managerTotals.value.groups,
    icon: UsersRoundIcon,
    color: "bg-sky-50 text-blue-600",
  },
  {
    label: "របាយការណ៍សេចក្តីព្រាង",
    value: managerDraftReports.value.length,
    icon: FileTextIcon,
    color: "bg-amber-50 text-amber-500",
  },
  {
    label: "របាយការណ៍បានដាក់ស្នើ",
    value: managerSubmittedReports.value.length,
    icon: FileTextIcon,
    color: "bg-amber-50 text-amber-500",
  },
  {
    label: "របាយការណ៍បានពិនិត្យ",
    value: managerReviewedReports.value.length,
    icon: CheckCircleIcon,
    color: "bg-emerald-50 text-emerald-600",
  },
]);

const staffCards = computed(() => {
  return [
    {
      label: "ប្រាក់បៀវត្សបច្ចុប្បន្ន",
      value: isLoadingStaffSalary.value
        ? "កំពុងទាញយក..."
        : formatCurrency(currentStaffSalary.value),
      caption: "កំណត់ត្រាប្រាក់បៀវត្សចុងក្រោយ",
      icon: DollarSignIcon,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "ស្ថានភាពគណនី",
      value: "សកម្ម",
      caption: "គណនីកំពុងដំណើរការ",
      icon: UsersIcon,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];
});

const cards = computed(() => {
  switch (currentRole.value) {
    case "ADMIN":
      return adminCards.value;
    case "MANAGER":
      return managerCards.value;
    case "STAFF":
      return staffCards.value;
    default:
      return [];
  }
});

const cardCaptions = [
  "បុគ្គលិកសកម្ម",
  "ក្រុម",
  "របាយការណ៍បើក",
  "រង់ចាំអនុម័ត",
  "បានបញ្ចប់",
];

const getCardCaption = (index) => cardCaptions[index] || "Workspace";

const reportStatusCounts = computed(() => {
  const reports =
    currentRole.value === "ADMIN" ? adminReports.value : managerReports.value;

  return {
    draft: reports.filter((report) => report.status === "DRAFT").length,
    submitted: reports.filter((report) => report.status === "SUBMITTED").length,
    reviewed: reports.filter((report) => report.status === "REVIEWED").length,
  };
});

const analyticsTitle = computed(() =>
  currentRole.value === "STAFF" ? "ទិដ្ឋភាពប្រាក់បៀវត្ស" : "លំហូររបាយការណ៍",
);

const analyticsSubtitle = computed(() =>
  currentRole.value === "STAFF"
    ? "ទិន្នន័យថ្មីៗពីប្រវត្តិប្រាក់បៀវត្សរបស់អ្នក"
    : "ទិន្នន័យបច្ចុប្បន្នពីកន្លែងការងារ",
);

const mixTitle = computed(() =>
  currentRole.value === "STAFF" ? "សមាសភាពប្រាក់បៀវត្ស" : "សមាសភាពការងារ",
);

const mixSubtitle = computed(() =>
  currentRole.value === "STAFF"
    ? "ប្រៀបធៀបប្រាក់បៀវត្សបច្ចុប្បន្ន និងមុន"
    : "ការបែងចែកតាមប្រភេទការងារសំខាន់ៗ",
);

const analyticsTotal = computed(() => {
  if (currentRole.value === "ADMIN") {
    return Math.max(adminTotals.value.reports || adminReports.value.length, 0);
  }

  if (currentRole.value === "MANAGER") {
    return Math.max(
      managerTotals.value.reports || managerReports.value.length,
      0,
    );
  }

  return currentStaffSalary.value;
});

const normalizeBars = (items) => {
  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return items.map((item) => ({
    ...item,
    height: Math.max(
      10,
      Math.round((Number(item.value || 0) / maxValue) * 100),
    ),
  }));
};

const analyticsBars = computed(() => {
  if (currentRole.value === "STAFF") {
    const previousSalary =
      staffSalaryHistory.value[1]?.newSalary ||
      latestStaffSalary.value?.previousSalary ||
      0;
    const salaryChange = currentStaffSalary.value - previousSalary;

    return normalizeBars([
      { label: "មុន", value: previousSalary, color: "bg-[#84A98C]" },
      {
        label: "បច្ចុប្បន្ន",
        value: currentStaffSalary.value,
        color: "bg-emerald-500",
      },
      {
        label: "ផ្លាស់ប្តូរ",
        value: Math.abs(salaryChange),
        color: "bg-teal-600",
      },
    ]);
  }

  return normalizeBars([
    {
      label: "សេចក្តីព្រាង",
      value: reportStatusCounts.value.draft,
      color: "bg-orange-400",
    },
    {
      label: "បានដាក់ជូន",
      value: reportStatusCounts.value.submitted,
      color: "bg-amber-400",
    },
    {
      label: "បានពិនិត្យ",
      value: reportStatusCounts.value.reviewed,
      color: "bg-[#84A98C]",
    },
  ]);
});

const analyticsMix = computed(() => {
  if (currentRole.value === "ADMIN") {
    return [
      {
        label: "អ្នកគ្រប់គ្រងជាន់ខ្ពស់",
        value: adminUsers.value.filter((item) => item.role === "ADMIN").length,
        color: "bg-slate-500",
        cssColor: "#64748b",
      },
      {
        label: "អ្នកគ្រប់គ្រង",
        value: adminUsers.value.filter((item) => item.role === "MANAGER")
          .length,
        color: "bg-teal-500",
        cssColor: "#14b8a6",
      },
      {
        label: "បុគ្គលិក",
        value: adminUsers.value.filter((item) => item.role === "STAFF").length,
        color: "bg-[#84A98C]",
        cssColor: "#84A98C",
      },
    ];
  }

  if (currentRole.value === "MANAGER") {
    return [
      {
        label: "បុគ្គលិក",
        value: managerTotals.value.staff,
        color: "bg-[#84A98C]",
        cssColor: "#84A98C",
      },
      {
        label: "ក្រុម",
        value: managerTotals.value.groups,
        color: "bg-teal-500",
        cssColor: "#14b8a6",
      },
      {
        label: "របាយការណ៍",
        value: managerTotals.value.reports,
        color: "bg-amber-400",
        cssColor: "#fbbf24",
      },
    ];
  }

  const previousSalary =
    staffSalaryHistory.value[1]?.newSalary ||
    latestStaffSalary.value?.previousSalary ||
    0;

  return [
    {
      label: "បច្ចុប្បន្ន",
      value: currentStaffSalary.value,
      color: "bg-[#84A98C]",
      cssColor: "#84A98C",
    },
    {
      label: "មុន",
      value: previousSalary,
      color: "bg-teal-500",
      cssColor: "#14b8a6",
    },
  ];
});

const donutBackground = computed(() => {
  const total = Math.max(
    analyticsMix.value.reduce((sum, item) => sum + Number(item.value || 0), 0),
    1,
  );
  let cursor = 0;

  const segments = analyticsMix.value.map((item) => {
    const start = cursor;
    cursor += (Number(item.value || 0) / total) * 100;

    return `${item.cssColor} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
});

const pendingReports = computed(() =>
  submittedReports.value
    .slice()
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5),
);

const roleBreakdown = computed(() => [
  {
    label: "Admin",
    value: adminUsers.value.filter((item) => item.role === "ADMIN").length,
    color: "bg-slate-500",
  },
  {
    label: "Manager",
    value: adminUsers.value.filter((item) => item.role === "MANAGER").length,
    color: "bg-teal-500",
  },
  {
    label: "Staff",
    value: adminUsers.value.filter((item) => item.role === "STAFF").length,
    color: "bg-emerald-500",
  },
]);

const quickStats = computed(() => {
  const totalUsers = Math.max(
    adminTotals.value.users || adminUsers.value.length,
    1,
  );
  const totalReports = Math.max(
    adminTotals.value.reports || adminReports.value.length,
    1,
  );
  const activeUserRate = Math.round(
    (activeUsers.value.length / totalUsers) * 100,
  );
  const reviewedRate = Math.round(
    (reviewedReports.value.length / totalReports) * 100,
  );
  const groupCoverage = Math.min(
    100,
    Math.round(
      (adminTotals.value.groups /
        Math.max(
          adminUsers.value.filter((item) => item.role === "MANAGER").length,
          1,
        )) *
        100,
    ),
  );

  return [
    {
      label: "អ្នកប្រើប្រាស់សកម្ម",
      value: activeUserRate,
      suffix: "%",
      color: "bg-emerald-500",
    },
    {
      label: "ការបញ្ចប់របាយការណ៍",
      value: reviewedRate,
      suffix: "%",
      color: "bg-[#84A98C]",
    },
    {
      label: "ការគ្របដណ្ដប់ក្រុម",
      value: groupCoverage,
      suffix: "%",
      color: "bg-orange-500",
    },
  ];
});

const systemHealth = computed(() => [
  {
    label: "របាយការណ៍រង់ចាំពិនិត្យ",
    value: submittedReports.value.length,
    subtext: "របាយការណ៍កំពុងរង់ចាំការពិនិត្យពី Admin",
  },
  {
    label: "អ្នកប្រើប្រាស់សកម្ម",
    value: activeUsers.value.length,
    subtext: "គណនីដែលបានបើកដំណើរការក្នុងប្រព័ន្ធ",
  },
  {
    label: "ក្រុមការងារ",
    value: adminTotals.value.groups,
    subtext: "ចំនួនក្រុមដែលបានចុះឈ្មោះក្នុងប្រព័ន្ធ",
  },
]);

const managerTasks = computed(() => [
  {
    label: "សេចក្តីព្រាងកំពុងដំណើរការ",
    value: managerDraftReports.value.length,
  },
  {
    label: "របាយការណ៍បានដាក់ស្នើ",
    value: managerSubmittedReports.value.length,
  },
  { label: "របាយការណ៍បានពិនិត្យ", value: managerReviewedReports.value.length },
  {
    label: "បុគ្គលិកមិនទាន់មានក្រុម",
    value: Math.max(
      managerTotals.value.staff -
        managerGroups.value.reduce(
          (sum, group) => sum + Number(group.memberCount || 0),
          0,
        ),
      0,
    ),
  },
]);

const managerTeams = computed(() => {
  const largestTeamSize = Math.max(
    ...managerGroups.value.map((group) => Number(group.memberCount || 0)),
    1,
  );

  return managerGroups.value.slice(0, 5).map((group) => ({
    name: group.name,
    members: group.memberCount,
    progress: Math.max(
      8,
      Math.round((Number(group.memberCount || 0) / largestTeamSize) * 100),
    ),
  }));
});

const staffInfo = computed(() => [
  { label: "ឈ្មោះ", value: user.value?.fullName || "-" },
  { label: "អ៊ីម៉ែល", value: user.value?.email || "-" },
  { label: "តួនាទី", value: user.value?.role || "-" },
  {
    label: "ប្រាក់បៀវត្សប្រចាំឆ្នាំ",
    value: currentStaffSalary.value
      ? formatCurrency(currentStaffSalary.value)
      : "-",
  },
]);

const staffActivities = computed(() => [
  {
    label: "ពិនិត្យប្រវត្តិប្រាក់បៀវត្ស",
    value: staffSalaryHistory.value.length
      ? `${staffSalaryHistory.value.length} កំណត់ត្រា`
      : "បើក",
    path: "/staff/salary-history",
  },
  {
    label: "ធ្វើបច្ចុប្បន្នភាពព័ត៌មានផ្ទាល់ខ្លួន",
    value: "Profile",
    path: "/profile",
  },
]);

const loadAdminDashboard = async () => {
  if (currentRole.value !== "ADMIN") return;

  isLoadingAdminDashboard.value = true;

  try {
    const [usersResponse, groupsResponse, reportsResponse] = await Promise.all([
      usersApi.getUsers(null, {
        params: {
          _page: 1,
          _per_page: 100,
          sortBy: "createdAt",
          sortDir: "DESC",
        },
      }),
      groupsApi.getGroups(null, {
        params: {
          _page: 1,
          _per_page: 100,
        },
      }),
      performanceReportsApi.getAllReports({
        params: {
          _page: 1,
          _per_page: 100,
          sortBy: "status",
          sortDir: "DESC",
        },
      }),
    ]);

    const usersData = getResponseData(usersResponse);
    const groupsData = getResponseData(groupsResponse);
    const reportsData = getResponseData(reportsResponse);
    const usersList = getList(usersData, [
      "users",
      "items",
      "results",
      "records",
    ]);
    const groupsList = getList(groupsData, [
      "groups",
      "items",
      "results",
      "records",
    ]);
    const reportsList = getList(reportsData, [
      "reports",
      "performanceReports",
      "items",
      "results",
      "records",
    ]);

    adminUsers.value = usersList.map(normalizeUser);
    adminGroups.value = groupsList;
    adminReports.value = reportsList.map(normalizeReport);
    adminTotals.value = {
      users: getTotal(usersData, usersList),
      groups: getTotal(groupsData, groupsList),
      reports: getTotal(reportsData, reportsList),
    };
  } catch {
    adminUsers.value = [];
    adminGroups.value = [];
    adminReports.value = [];
    adminTotals.value = {
      users: 0,
      groups: 0,
      reports: 0,
    };
  } finally {
    isLoadingAdminDashboard.value = false;
  }
};

const loadManagerDashboard = async () => {
  if (currentRole.value !== "MANAGER") return;

  isLoadingManagerDashboard.value = true;

  try {
    const [staffResponse, groupsResponse, reportsResponse] = await Promise.all([
      usersApi.getMyStaff(),
      groupsApi.getMyGroups(),
      performanceReportsApi.getMyReports({
        params: {
          _page: 1,
          _per_page: 100,
          sortBy: "status",
          sortDir: "DESC",
        },
      }),
    ]);

    const staffData = getResponseData(staffResponse);
    const groupsData = getResponseData(groupsResponse);
    const reportsData = getResponseData(reportsResponse);
    const staffList = getList(staffData, [
      "users",
      "staff",
      "items",
      "results",
      "records",
    ]);
    const groupsList = getList(groupsData, [
      "groups",
      "items",
      "results",
      "records",
    ]);
    const reportsList = getList(reportsData, [
      "reports",
      "performanceReports",
      "items",
      "results",
      "records",
    ]);

    managerStaff.value = staffList.map(normalizeUser);
    managerGroups.value = groupsList.map(normalizeGroup);
    managerReports.value = reportsList.map(normalizeReport);
    managerTotals.value = {
      staff: getTotal(staffData, staffList),
      groups: getTotal(groupsData, groupsList),
      reports: getTotal(reportsData, reportsList),
    };
  } catch {
    managerStaff.value = [];
    managerGroups.value = [];
    managerReports.value = [];
    managerTotals.value = {
      staff: 0,
      groups: 0,
      reports: 0,
    };
  } finally {
    isLoadingManagerDashboard.value = false;
  }
};

const loadStaffSalary = async () => {
  if (currentRole.value !== "STAFF") return;

  isLoadingStaffSalary.value = true;

  try {
    const response = await salaryHistoryApi.getMySalaryHistory({
      params: {
        sortBy: "createdAt",
      },
    });
    const data = getResponseData(response);
    const list = getSalaryHistoryList(data);

    staffSalaryHistory.value = sortedSalaryHistory(
      list.map(normalizeSalaryRecord),
    );
  } catch {
    staffSalaryHistory.value = [];
  } finally {
    isLoadingStaffSalary.value = false;
  }
};

watch(
  currentRole,
  (role) => {
    if (role === "ADMIN") {
      loadAdminDashboard();
    } else if (role === "MANAGER") {
      loadManagerDashboard();
    } else if (role === "STAFF") {
      loadStaffSalary();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.dashboard-stat-grid {
  grid-auto-rows: 132px;
}

.dashboard-stat-card {
  height: 132px;
  padding: 28px 30px;
  border-color: rgba(226, 232, 240, 0.86) !important;
  border-radius: 16px !important;
  background: #ffffff !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
  transition:
    transform 0.32s cubic-bezier(0.21, 0.85, 0.32, 1),
    box-shadow 0.32s ease,
    border-color 0.32s ease;
}

.dashboard-stat-card::before,
.dashboard-stat-card .creative-stat-line {
  display: none !important;
}

.dashboard-stat-card:hover {
  border-color: rgba(148, 163, 184, 0.34) !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12) !important;
  transform: translateY(-5px);
}

.dashboard-stat-label {
  margin-bottom: 8px;
  font-size: 1.05rem;
  font-weight: 500;
  line-height: 1.25;
}

.dashboard-stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.dashboard-stat-icon {
  width: 68px;
  height: 68px;
  flex: 0 0 68px;
  border-radius: 8px;
  box-shadow: none;
}

:global(:root[data-theme="dark"]) .dashboard-stat-card {
  border-color: rgba(148, 163, 184, 0.18) !important;
  background: #121f22 !important;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.3) !important;
}

:global(:root[data-theme="dark"]) .dashboard-stat-card:hover {
  border-color: rgba(94, 227, 154, 0.28) !important;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.38) !important;
}

:global(:root[data-theme="dark"]) .dashboard-stat-label {
  color: #94a3b8 !important;
}

:global(:root[data-theme="dark"]) .dashboard-stat-value {
  color: #f8fafc !important;
}

:global(:root[data-theme="dark"]) .dashboard-stat-icon {
  background: rgba(94, 227, 154, 0.1) !important;
  color: #9ff0c0 !important;
}

@media (max-width: 575.98px) {
  .dashboard-stat-grid {
    grid-auto-rows: auto;
  }

  .dashboard-stat-card {
    min-height: 124px;
    height: auto;
    padding: 24px;
  }
}
</style>
