<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900"
          title="ត្រឡប់ក្រោយ"
          @click="router.back()"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-3xl font-normal text-gray-900">
            ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់
          </h1>
          <p class="mt-1 text-gray-500">
            មើលព័ត៌មានពេញលេញ និងរូបភាពប្រវត្តិរូប
          </p>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#84A98C] px-5 py-2.5 font-normal text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLoading"
        @click="fetchUserDetail"
      >
        <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        ផ្ទុកឡើងវិញ
      </button>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-gray-100 bg-white p-12 shadow-sm">
      <EmptyState
        :icon="UserIcon"
        title="កំពុងទាញយកព័ត៌មានអ្នកប្រើប្រាស់..."
        description="សូមរង់ចាំបន្តិច"
      />
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-red-100 bg-white p-12 shadow-sm">
      <EmptyState :icon="AlertCircleIcon" title="មិនអាចទាញយកព័ត៌មានបានទេ" :description="loadError">
        <template #action>
          <button
            type="button"
            class="rounded-lg bg-[#84A98C] px-5 py-2.5 text-white shadow-sm transition-all hover:opacity-90"
            @click="fetchUserDetail"
          >
            ព្យាយាមម្តងទៀត
          </button>
        </template>
      </EmptyState>
    </div>

    <template v-else-if="user">
      <section class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div class="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div
              class="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#84A98C] text-3xl font-medium text-white shadow-lg"
            >
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="`${displayName} avatar`"
                class="h-full w-full object-cover"
                @error="avatarFailed = true"
              />
              <span v-else>{{ initials }}</span>
            </div>

            <div class="text-center sm:text-left">
              <div class="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 class="text-2xl font-normal text-gray-900">{{ displayName }}</h2>
                <StatusBadge v-if="user.role" :status="user.role" variant="info" />
                <StatusBadge v-if="user.status" :status="user.status" />
              </div>
              <div class="flex flex-wrap justify-center gap-3 text-sm text-gray-500 sm:justify-start">
                <span class="inline-flex items-center gap-1.5">
                  <BadgeCheckIcon class="h-4 w-4" />
                  ID: <strong class="font-medium text-gray-700">{{ user.id || "-" }}</strong>
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <MailIcon class="h-4 w-4" />
                  {{ user.email || "-" }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 class="mb-4 text-lg font-medium text-gray-900">ព័ត៌មានផ្ទាល់ខ្លួន</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem
              v-for="item in personalInfoItems"
              :key="item.label"
              :label="item.label"
              :value="item.value"
              :icon="item.icon"
            />
          </div>
        </div>

        <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 class="mb-4 text-lg font-medium text-gray-900">ព័ត៌មានការងារ</h3>
          <div class="space-y-4">
            <InfoItem
              v-for="item in workInfoItems"
              :key="item.label"
              :label="item.label"
              :value="item.value"
              :icon="item.icon"
            />
          </div>
        </div>
      </section>

      <section
        v-if="!isManagerStaffDetail"
        class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-medium text-gray-900">ប្រវត្តិប្រាក់បៀវត្ស</h3>
            <p class="mt-1 text-sm text-gray-500">Salary changes for this user</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isLoadingSalaryHistory"
            @click="fetchSalaryHistory"
          >
            <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': isLoadingSalaryHistory }" />
            ផ្ទុកឡើងវិញ
          </button>
        </div>

        <div v-if="isLoadingSalaryHistory" class="rounded-xl border border-gray-100 bg-gray-50 p-10">
          <EmptyState
            :icon="DollarSignIcon"
            title="កំពុងទាញយកប្រវត្តិប្រាក់បៀវត្ស..."
            description="សូមរង់ចាំបន្តិច"
          />
        </div>

        <div v-else-if="salaryHistoryError" class="rounded-xl border border-red-100 bg-red-50 p-10">
          <EmptyState
            :icon="AlertCircleIcon"
            title="មិនអាចទាញយកប្រវត្តិប្រាក់បៀវត្សបានទេ"
            :description="salaryHistoryError"
          />
        </div>

        <div v-else-if="salaryHistory.length === 0" class="rounded-xl border border-gray-100 bg-gray-50 p-10">
          <EmptyState
            :icon="DollarSignIcon"
            title="មិនមានប្រវត្តិប្រាក់បៀវត្ស"
            description="ប្រវត្តិប្រាក់បៀវត្សនឹងបង្ហាញនៅទីនេះ"
          />
        </div>

        <template v-else>
          <div class="overflow-hidden rounded-xl border border-gray-100">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-100">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      v-for="column in salaryHistoryColumns"
                      :key="column.key"
                      class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 bg-white">
                  <tr v-for="record in salaryHistory" :key="record.id">
                    <td class="px-5 py-4 text-sm font-semibold text-gray-700">
                      {{ formatCurrency(record.previousSalary) }}
                    </td>
                    <td class="px-5 py-4 text-sm font-semibold text-emerald-600">
                      {{ formatCurrency(record.newSalary) }}
                    </td>
                    <td class="px-5 py-4 text-sm font-semibold" :class="getSalaryChangeClass(record)">
                      {{ formatSalaryChange(record) }}
                    </td>
                    <td class="max-w-[260px] px-5 py-4 text-sm text-gray-600">
                      <span class="line-clamp-2">{{ record.changeReason || "-" }}</span>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-600">
                      {{ formatDate(record.effectiveDate) || "-" }}
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-600">
                      {{ formatDateTime(record.createdAt) || "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            v-if="salaryHistoryTotalPages > 1"
            class="mt-4 flex items-center justify-between gap-3"
          >
            <p class="text-sm font-medium text-gray-500">
              Page <span class="font-semibold text-gray-900">{{ salaryHistoryPage }}</span>
              of <span class="font-semibold text-gray-900">{{ salaryHistoryTotalPages }}</span>
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="salaryHistoryPage === 1 || isLoadingSalaryHistory"
                @click="handleSalaryHistoryPageChange(salaryHistoryPage - 1)"
              >
                <ChevronLeftIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="salaryHistoryPage === salaryHistoryTotalPages || isLoadingSalaryHistory"
                @click="handleSalaryHistoryPageChange(salaryHistoryPage + 1)"
              >
                <ChevronRightIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Activity as ActivityIcon,
  AlertCircle as AlertCircleIcon,
  ArrowLeft as ArrowLeftIcon,
  BadgeCheck as BadgeCheckIcon,
  Calendar as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  RefreshCw as RefreshCwIcon,
  Shield as ShieldIcon,
  User as UserIcon,
  UserRoundCog as UserRoundCogIcon,
  Users as UsersIcon,
} from "lucide-vue-next";
import EmptyState from "@/components/common/EmptyState.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import { salaryHistoryApi, usersApi, DEFAULT_API_BASE_URL } from "@/api/api";

const InfoItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: "" },
    icon: { type: [Object, Function], required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "rounded-lg border border-gray-100 bg-gray-50 p-4" }, [
        h("div", { class: "mb-2 flex items-center gap-2 text-sm text-gray-500" }, [
          h(props.icon, { class: "h-4 w-4 text-[#84A98C]" }),
          h("span", props.label),
        ]),
        h("p", { class: "break-words text-sm font-medium text-gray-900" }, props.value || "-"),
      ]);
  },
});

const route = useRoute();
const router = useRouter();

const isManagerStaffDetail = computed(() => route.name === "ManagerStaffDetail");

const user = ref(null);
const isLoading = ref(false);
const loadError = ref("");
const avatarFailed = ref(false);
const salaryHistory = ref([]);
const salaryHistoryPage = ref(1);
const salaryHistoryTotal = ref(0);
const isLoadingSalaryHistory = ref(false);
const salaryHistoryError = ref("");
const salaryHistoryItemsPerPage = 10;

const salaryHistoryColumns = [
  { key: "previousSalary", label: "Previous" },
  { key: "newSalary", label: "New" },
  { key: "change", label: "Change" },
  { key: "changeReason", label: "Reason" },
  { key: "effectiveDate", label: "Effective Date" },
  { key: "createdAt", label: "Created" },
];

const getResponseData = (response) => response.data?.data || response.data;

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

const normalizeStatus = (status) => {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "ACTIVE") return "ACTIVATED";
  if (normalized === "INACTIVE" || normalized === "DISABLED") return "DEACTIVATED";

  return normalized;
};

const getFullName = (rawUser) =>
  rawUser.fullName ||
  rawUser.fullname ||
  rawUser.full_name ||
  rawUser.name ||
  rawUser.username ||
  rawUser.displayName ||
  rawUser.display_name ||
  [rawUser.firstName || rawUser.first_name, rawUser.lastName || rawUser.last_name]
    .filter(Boolean)
    .join(" ") ||
  "";

const normalizeUser = (rawUser) => ({
  ...rawUser,
  id: rawUser.id || rawUser._id || rawUser.uuid || rawUser.userId || rawUser.user_id,
  fullName: getFullName(rawUser),
  email: rawUser.email || "",
  phoneNumber:
    rawUser.phoneNumber ||
    rawUser.phone_number ||
    rawUser.phone ||
    rawUser.mobile ||
    rawUser.mobileNumber ||
    "",
  role:
    normalizeRole(rawUser.role || rawUser.userRole || rawUser.type) ||
    getRoleName(rawUser.roleId || rawUser.role_id),
  roleId: rawUser.roleId || rawUser.role_id || rawUser.role?.id || rawUser.userRole?.id || "",
  managerId:
    rawUser.managerId ||
    rawUser.manager_id ||
    rawUser.manager?.id ||
    rawUser.manager?.userId ||
    "",
  manager: rawUser.manager || rawUser.supervisor || null,
  status: normalizeStatus(rawUser.status || rawUser.accountStatus),
  salary: Number(rawUser.salary || rawUser.currentSalary || 0),
  avatar:
    rawUser.avatar ||
    rawUser.avatarUrl ||
    rawUser.avatar_url ||
    rawUser.profileImage ||
    rawUser.profile_image ||
    rawUser.photo ||
    "",
  birthday: rawUser.birthday || rawUser.birthDate || rawUser.birth_date || "",
  hireDate: rawUser.hireDate || rawUser.hire_date || rawUser.joinedAt || rawUser.joined_at || "",
  createdAt: rawUser.createdAt || rawUser.created_at || "",
  updatedAt: rawUser.updatedAt || rawUser.updated_at || "",
});

const resolveAssetUrl = (value) => {
  if (!value) return "";

  try {
    return new URL(value, DEFAULT_API_BASE_URL).href;
  } catch {
    return value;
  }
};

const fetchUserDetail = async () => {
  if (!route.params.id) return;

  isLoading.value = true;
  loadError.value = "";
  avatarFailed.value = false;

  try {
    const response =
      isManagerStaffDetail.value
        ? await usersApi.getMyStaffUser(route.params.id)
        : await usersApi.getUser(route.params.id);
    const data = getResponseData(response);
    const detail = data.user || data.profile || data.item || data;

    user.value = normalizeUser(detail);
  } catch (err) {
    user.value = null;
    loadError.value =
      err.response?.data?.message || "មិនអាចទាញយកព័ត៌មានលម្អិតអ្នកប្រើប្រាស់បានទេ";
  } finally {
    isLoading.value = false;
  }
};

const getSalaryHistoryList = (data) =>
  data?.salaryHistory ||
  data?.history ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getSalaryHistoryTotal = (data, list) =>
  Number(
    data?.total ||
      data?.totalItems ||
      data?.totalRecords ||
      data?.meta?.total ||
      data?.meta?.totalItems ||
      data?.pagination?.total ||
      list.length,
  );

const toNumber = (value) => {
  const numberValue = Number(value || 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeSalaryRecord = (record) => ({
  ...record,
  id: record.id || record._id || `${record.createdAt}-${record.effectiveDate}`,
  previousSalary: toNumber(record.previousSalary || record.oldSalary),
  newSalary: toNumber(record.newSalary || record.currentSalary || record.salary),
  changeReason: record.changeReason || record.reason || "",
  effectiveDate: record.effectiveDate || record.effective_date || "",
  createdAt: record.createdAt || record.created_at || "",
});

const fetchSalaryHistory = async (page = salaryHistoryPage.value) => {
  if (!route.params.id || isManagerStaffDetail.value) return;

  isLoadingSalaryHistory.value = true;
  salaryHistoryError.value = "";

  try {
    const response = await salaryHistoryApi.getStaffSalaryHistory(route.params.id, {
      params: {
        _page: page,
        _per_page: salaryHistoryItemsPerPage,
        sortBy: "createdAt",
        sortDir: "ASC",
      },
    });
    const data = getResponseData(response);
    const list = getSalaryHistoryList(data);

    salaryHistory.value = list.map(normalizeSalaryRecord);
    salaryHistoryTotal.value = getSalaryHistoryTotal(data, list);
    salaryHistoryPage.value = page;
  } catch (err) {
    salaryHistory.value = [];
    salaryHistoryTotal.value = 0;
    salaryHistoryError.value =
      err.response?.data?.message || "មិនអាចទាញយកប្រវត្តិប្រាក់បៀវត្សបានទេ";
  } finally {
    isLoadingSalaryHistory.value = false;
  }
};

const displayName = computed(() => user.value?.fullName || user.value?.email || "Unknown User");

const initials = computed(() =>
  displayName.value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase(),
);

const avatarUrl = computed(() =>
  user.value?.avatar && !avatarFailed.value ? resolveAssetUrl(user.value.avatar) : "",
);

const managerName = computed(() => {
  const manager = user.value?.manager;

  if (!manager) return user.value?.managerId || "";

  return getFullName(manager) || manager.email || manager.id || user.value?.managerId || "";
});

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return new Intl.DateTimeFormat("en-CA").format(date);
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatSalary = (value) => {
  const salary = Number(value || 0);

  if (!salary) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(salary);
};

const formatCurrency = (value) =>
  toNumber(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatSalaryChange = (record) => {
  const change = toNumber(record.newSalary) - toNumber(record.previousSalary);

  return `${change >= 0 ? "+" : ""}${formatCurrency(change)}`;
};

const getSalaryChangeClass = (record) => {
  const change = toNumber(record.newSalary) - toNumber(record.previousSalary);

  return change >= 0 ? "text-emerald-600" : "text-red-500";
};

const salaryHistoryTotalPages = computed(() =>
  Math.max(1, Math.ceil(salaryHistoryTotal.value / salaryHistoryItemsPerPage)),
);

const handleSalaryHistoryPageChange = (page) => {
  fetchSalaryHistory(page);
};

const hasValue = (value) => value !== "" && value !== null && value !== undefined;

const filterInfoItems = (items) => items.filter((item) => hasValue(item.value));

const personalInfoItems = computed(() =>
  filterInfoItems([
    { label: "ឈ្មោះពេញ", value: displayName.value, icon: UserIcon },
    { label: "អ៊ីមែល", value: user.value?.email, icon: MailIcon },
    { label: "លេខទូរស័ព្ទ", value: user.value?.phoneNumber, icon: PhoneIcon },
    { label: "ភេទ", value: user.value?.gender, icon: UsersIcon },
    {
      label: "ថ្ងៃខែឆ្នាំកំណើត",
      value: formatDate(user.value?.birthday),
      icon: CalendarIcon,
    },
    {
      label: "ថ្ងៃបង្កើត",
      value: formatDateTime(user.value?.createdAt),
      icon: ClockIcon,
    },
    {
      label: "ថ្ងៃកែប្រែចុងក្រោយ",
      value: formatDateTime(user.value?.updatedAt),
      icon: ClockIcon,
    },
  ]),
);

const workInfoItems = computed(() =>
  filterInfoItems([
    { label: "តួនាទី", value: user.value?.role, icon: ShieldIcon },
    { label: "ស្ថានភាព", value: user.value?.status, icon: ActivityIcon },
    { label: "ប្រាក់បៀវត្ស", value: formatSalary(user.value?.salary), icon: DollarSignIcon },
    {
      label: "ថ្ងៃចូលធ្វើការ",
      value: formatDate(user.value?.hireDate),
      icon: CalendarIcon,
    },
    { label: "អ្នកគ្រប់គ្រង", value: managerName.value, icon: UserRoundCogIcon },
  ]),
);

watch(
  () => route.params.id,
  () => {
    salaryHistoryPage.value = 1;
    fetchUserDetail();
    if (!isManagerStaffDetail.value) {
      fetchSalaryHistory(1);
    }
  },
);

onMounted(() => {
  fetchUserDetail();
  if (!isManagerStaffDetail.value) {
    fetchSalaryHistory(1);
  }
});
</script>
