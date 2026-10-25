﻿
<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-normal text-gray-900 mb-2">
          គ្រប់គ្រងអ្នកប្រើប្រាស់
        </h1>
        <p class="text-gray-500 font-normal">
          គ្រប់គ្រងអ្នកប្រើប្រាស់ និងតួនាទីក្នុងអង្គភាព
        </p>
      </div>
      <button
        @click="handleCreate"
        class="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
      >
        <PlusIcon class="w-5 h-5" />
        បន្ថែមអ្នកប្រើប្រាស់ថ្មី
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-3">
        <div class="relative">
          <SearchIcon
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអ៊ីមែល..."
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          />
        </div>
        <select
          v-model="filterStatus"
          class="w-full px-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVATED">ACTIVATED</option>
          <option value="DEACTIVATED">DEACTIVATED</option>
        </select>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      v-if="isLoadingUsers || users.length > 0"
      :columns="columns"
      :data="users"
      :key-extractor="(user) => user.id"
      :loading="isLoadingUsers"
      :pagination="{
        currentPage,
        totalPages,
        onPageChange: handlePageChange,
      }"
      :on-row-click="handleViewUser"
    >
      <template #cell(phoneNumber)="{ item }">
        {{ item.phoneNumber || "-" }}
      </template>
      <template #cell(role)="{ item }">
        <StatusBadge :status="item.role" variant="info" />
      </template>
      <template #cell(salary)="{ item }">
        {{ item.salary ? `$${item.salary.toLocaleString()}` : "-" }}
      </template>
      <template #cell(status)="{ item }">
        <StatusBadge :status="item.status" />
      </template>
      <template #cell(actions)="{ item }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="handleViewUser(item)"
            class="p-2 hover:bg-gray-50 rounded-lg transition-all text-gray-600"
            title="មើលព័ត៌មានលម្អិត"
          >
            <EyeIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleViewSalary(item)"
            class="p-2 hover:bg-emerald-50 rounded-lg transition-all text-emerald-600"
            title="កែប្រែប្រាក់បៀវត្ស"
          >
            <DollarSignIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleEdit(item)"
            class="p-2 hover:bg-blue-50 rounded-lg transition-all text-blue-600"
            title="កែប្រែអ្នកប្រើប្រាស់"
          >
            <EditIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleToggleStatus(item)"
            class="p-2 hover:bg-amber-50 rounded-lg transition-all text-amber-600 disabled:opacity-50"
            :title="
              item.status === 'ACTIVATED'
                ? 'បិទដំណើរការអ្នកប្រើប្រាស់'
                : 'បើកដំណើរការអ្នកប្រើប្រាស់'
            "
            :disabled="isUpdatingStatus"
          >
            <PowerIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleDelete(item)"
            class="p-2 hover:bg-red-50 rounded-lg transition-all text-red-600"
            title="លុបអ្នកប្រើប្រាស់"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <div
      v-else
      class="bg-white border border-gray-100 rounded-xl p-12 shadow-sm"
    >
      <EmptyState
        :icon="UsersIcon"
        :title="
          isLoadingUsers
            ? 'កំពុងទាញយកអ្នកប្រើប្រាស់...'
            : 'រកមិនឃើញអ្នកប្រើប្រាស់'
        "
        :description="
          isLoadingUsers
            ? 'សូមរង់ចាំបន្តិច'
            : searchTerm
              ? `មិនមានអ្នកប្រើប្រាស់ដែលត្រូវនឹង '${searchTerm}' ទេ`
              : 'ចាប់ផ្តើមដោយបន្ថែមអ្នកប្រើប្រាស់ដំបូងរបស់អ្នក!'
        "
      />
    </div>

    <!-- Create/Edit Modal -->
    <UserFormModal
      :is-open="showCreateModal || showEditModal"
      :is-edit="showEditModal"
      :loading="isCreatingUser || isUpdatingUser"
      :initial-data="formData"
      :errors="formErrors"
      :fields="showEditModal ? editFields : createFields"
      @close="closeModals"
      @submit="handleFormSubmit"
    />

    <!-- Salary Modal -->
    <SalaryFormModal
      :is-open="showSalaryModal"
      :loading="isUpdatingSalary"
      :initial-data="salaryFormData"
      @close="showSalaryModal = false"
      @submit="handleSubmitSalary"
    />

    <!-- Delete Confirm -->
    <ConfirmDialog
      :is-open="showDeleteDialog"
      title="លុបអ្នកប្រើប្រាស់"
      :message="
        selectedUser
          ? `តើអ្នកប្រាកដជាចង់លុប ${selectedUser.fullName} មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។`
          : ''
      "
      confirm-text="លុបអ្នកប្រើប្រាស់"
      variant="danger"
      @close="showDeleteDialog = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Eye as EyeIcon,
  Trash2 as Trash2Icon,
  DollarSign as DollarSignIcon,
  Power as PowerIcon,
  Users as UsersIcon,
} from "lucide-vue-next";
import DataTable from "@/components/common/DataTable.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import UserFormModal from "@/components/ui/base/UserFormModal.vue";
import SalaryFormModal from "@/components/ui/base/SalaryFormModal.vue";
import { useToastStore } from "@/stores/toast";
import { usersApi } from "@/api/api";

const toastStore = useToastStore();
const router = useRouter();

const users = ref([]);
const managers = ref([]);
const searchTerm = ref("");
const currentPage = ref(1);
const totalUsers = ref(0);
const hiddenAdminCount = ref(0);
const filterStatus = ref("");
const isLoadingUsers = ref(false);
const isCreatingUser = ref(false);
const isUpdatingUser = ref(false);
const isUpdatingSalary = ref(false);
const isUpdatingStatus = ref(false);
const isDeletingUser = ref(false);
const itemsPerPage = 10;
const sortBy = "createdAt";
const sortDir = "DESC";
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteDialog = ref(false);
const showSalaryModal = ref(false);
const selectedUser = ref(null);

const formData = reactive({
  fullName: "",
  email: "",
  phoneNumber: "",
  gender: "",
  birthday: "",
  hireDate: "",
  salary: "",
  role: "STAFF",
  roleId: 3,
  managerId: "",
  status: "ACTIVE",
  password: "",
});

const salaryFormData = reactive({
  salary: "",
  effectiveDate: "",
  changeReason: "",
});

const formErrors = reactive({
  fullName: "",
  email: "",
  phoneNumber: "",
  gender: "",
  birthday: "",
  hireDate: "",
  salary: "",
  roleId: "",
  managerId: "",
  password: "",
});

const columns = [
  { key: "fullName", label: "ឈ្មោះពេញ" },
  { key: "email", label: "អ៊ីមែល" },
  { key: "phoneNumber", label: "លេខទូរស័ព្ទ" },
  { key: "role", label: "តួនាទី" },
  { key: "salary", label: "ប្រាក់បៀវត្ស" },
  { key: "status", label: "ស្ថានភាព" },
  { key: "actions", label: "សកម្មភាព" },
];

const createFields = computed(() => [
  {
    key: "fullName",
    label: "ឈ្មោះពេញ",
    type: "text",
    placeholder: "បញ្ចូលឈ្មោះពេញ",
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  {
    key: "email",
    label: "អ៊ីមែល",
    type: "email",
    placeholder: "example@email.com",
    required: true,
  },
  {
    key: "password",
    label: "ពាក្យសម្ងាត់",
    type: "password",
    placeholder: "ឧ. Password@123",
    required: true,
    minLength: 8,
  },
  {
    key: "phoneNumber",
    label: "លេខទូរស័ព្ទ",
    type: "tel",
    placeholder: "បញ្ចូលលេខទូរស័ព្ទ",
    required: true,
  },
  {
    key: "gender",
    label: "ភេទ",
    type: "select",
    required: true,
    options: [
      { label: "ប្រុស", value: "MALE" },
      { label: "ស្រី", value: "FEMALE" },
    ],
  },
  {
    key: "birthday",
    label: "ថ្ងៃខែឆ្នាំកំណើត",
    type: "date",
    required: true,
  },
  {
    key: "hireDate",
    label: "ថ្ងៃចូលធ្វើការ",
    type: "date",
    required: true,
  },
  {
    key: "salary",
    label: "ប្រាក់បៀវត្សដំបូង",
    type: "number",
    placeholder: "បញ្ចូលប្រាក់បៀវត្ស",
    required: true,
    min: 1,
  },
  {
    key: "roleId",
    label: "តួនាទី",
    type: "select",
    required: true,
    options: [
      { label: "MANAGER", value: 2 },
      { label: "STAFF", value: 3 },
    ],
  },
  {
    key: "managerId",
    label: "អ្នកគ្រប់គ្រង (សម្រាប់ STAFF)",
    type: "select",
    disabled: (data) => Number(data.roleId) !== 3,
    required: true,
    options: [
      { label: "ជ្រើសរើសអ្នកគ្រប់គ្រង", value: "" },
      ...managers.value.map((manager) => ({
        label: manager.fullName || manager.email,
        value: manager.id,
      })),
    ],
  },
]);

const editFields = computed(() => [
  { key: "fullName", label: "ឈ្មោះពេញ", type: "text", required: true },
  { key: "phoneNumber", label: "លេខទូរស័ព្ទ", type: "tel" },
  {
    key: "gender",
    label: "ភេទ",
    type: "select",
    options: [
      { label: "ប្រុស", value: "MALE" },
      { label: "ស្រី", value: "FEMALE" },
    ],
  },
  { key: "birthday", label: "ថ្ងៃខែឆ្នាំកំណើត", type: "date" },
  { key: "hireDate", label: "ថ្ងៃចូលធ្វើការ", type: "date" },
  {
    key: "managerId",
    label: "អ្នកគ្រប់គ្រង",
    type: "select",
    disabled: (data) => Number(data.roleId) !== 3,
    options: [
      { label: "ជ្រើសរើសអ្នកគ្រប់គ្រង", value: "" },
      ...managers.value.map((manager) => ({
        label: manager.fullName || manager.email,
        value: manager.id,
      })),
    ],
  },
  {
    key: "roleId",
    label: "តួនាទី",
    type: "select",
    options: [
      { label: "MANAGER", value: 2 },
      { label: "STAFF", value: 3 },
    ],
  },
]);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalUsers.value / itemsPerPage)),
);

const getOptionValue = (option) =>
  typeof option === "object" ? option.value : option;

const getOptionLabel = (option) =>
  typeof option === "object" ? option.label : option;

const getResponseData = (response) => response.data?.data || response.data;

const getUsersList = (data) =>
  data.users ||
  data.items ||
  data.results ||
  data.records ||
  data.data ||
  (Array.isArray(data) ? data : []);

const getUsersTotal = (data, list) =>
  Number(
    data.total ||
      data.totalItems ||
      data.totalUsers ||
      data.totalRecords ||
      data.meta?.total ||
      data.pagination?.total ||
      list.length,
  );

const hasUsersTotal = (data) =>
  [
    data?.total,
    data?.totalItems,
    data?.totalUsers,
    data?.totalRecords,
    data?.meta?.total,
    data?.pagination?.total,
  ].some((value) => value !== undefined && value !== null);

const normalizeStatus = (status) => {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "ACTIVE") return "ACTIVATED";
  if (normalized === "INACTIVE" || normalized === "DISABLED") {
    return "DEACTIVATED";
  }

  return normalized;
};

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

const isAdminUser = (user) => {
  const role =
    normalizeRole(
      user.role ||
        user.userRole ||
        user.type ||
        user.roleName ||
        user.role_name ||
        user.roleCode ||
        user.role_code,
    ) ||
    getRoleName(
      user.roleId || user.role_id || user.role?.id || user.userRole?.id,
    );
  const roleId = Number(
    user.roleId || user.role_id || user.role?.id || user.userRole?.id,
  );

  return role.includes("ADMIN") || roleId === 1;
};

const toApiDate = (date) => {
  if (!date) return "";

  return String(date).slice(0, 10);
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const toNumber = (value) => {
  const numberValue = Number(value || 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const cleanPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

const normalizeUser = (user) => ({
  ...user,
  id: user.id || user._id || user.uuid,
  fullName:
    user.fullName ||
    user.fullname ||
    user.full_name ||
    user.name ||
    user.username ||
    user.displayName ||
    user.display_name ||
    [user.firstName || user.first_name, user.lastName || user.last_name]
      .filter(Boolean)
      .join(" ") ||
    "",
  phoneNumber:
    user.phoneNumber ||
    user.phone_number ||
    user.phone ||
    user.mobile ||
    user.mobileNumber ||
    "",
  role:
    normalizeRole(user.role || user.userRole || user.type) ||
    getRoleName(user.roleId),
  roleId:
    user.roleId || user.role_id || user.role?.id || user.userRole?.id || "",
  managerId:
    user.managerId ||
    user.manager_id ||
    user.manager?.id ||
    user.manager?.userId ||
    "",
  status: normalizeStatus(user.status || user.accountStatus),
  salary: Number(user.salary || user.currentSalary || 0),
});

let latestUsersRequestId = 0;

const fetchUsers = async () => {
  const requestId = ++latestUsersRequestId;
  isLoadingUsers.value = true;

  try {
    const response = await usersApi.getUsers(null, {
      params: cleanPayload({
        _page: currentPage.value,
        _per_page: itemsPerPage,
        search: searchTerm.value.trim(),
        status: filterStatus.value,
        sortBy,
        sortDir,
      }),
    });

    if (requestId !== latestUsersRequestId) {
      return;
    }

    const data = getResponseData(response);
    const list = getUsersList(data);
    const hasTotal = hasUsersTotal(data);
    const normalizedUsers = list.map(normalizeUser);
    const visibleUsers = normalizedUsers.filter((user) => !isAdminUser(user));
    const hiddenOnPage = normalizedUsers.length - visibleUsers.length;
    const resolvedTotal = hasTotal
      ? getUsersTotal(data, list)
      : (currentPage.value - 1) * itemsPerPage +
        list.length +
        (list.length === itemsPerPage ? 1 : 0);

    hiddenAdminCount.value = hiddenOnPage;
    users.value = visibleUsers;
    totalUsers.value = Math.max(0, resolvedTotal - hiddenOnPage);
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យអ្នកប្រើប្រាស់បានទេ",
    );
    users.value = [];
    totalUsers.value = 0;
    hiddenAdminCount.value = 0;
  } finally {
    if (requestId === latestUsersRequestId) {
      isLoadingUsers.value = false;
    }
  }
};

const fetchManagers = async () => {
  try {
    const response = await usersApi.getUsers(null, {
      params: {
        _page: 1,
        _per_page: 100,
        search: "",
        status: "ACTIVATED",
        sortBy,
        sortDir,
      },
    });
    const data = getResponseData(response);
    const list = getUsersList(data);

    managers.value = list
      .map(normalizeUser)
      .filter((user) => user.role === "MANAGER" || Number(user.roleId) === 2)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យអ្នកគ្រប់គ្រងបានទេ",
    );
    managers.value = [];
  }
};

const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) {
    return;
  }

  currentPage.value = page;
  fetchUsers();
};

const handleViewUser = (user) => {
  if (!user?.id) {
    toastStore.error(
      "មិនអាចបើកព័ត៌មានលម្អិតបានទេ៖ ខ្វះលេខសម្គាល់អ្នកប្រើប្រាស់",
    );
    return;
  }

  router.push({ name: "AdminUserDetail", params: { id: user.id } });
};

let searchTimer;

watch([searchTerm, filterStatus], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 300);
});

const handleCreate = () => {
  Object.keys(formData).forEach(
    (k) =>
      (formData[k] =
        k === "role"
          ? "STAFF"
          : k === "roleId"
            ? 3
            : k === "managerId"
              ? ""
              : k === "status"
                ? "ACTIVE"
                : k === "gender"
                  ? "MALE"
                  : ""),
  );
  Object.keys(formErrors).forEach((k) => (formErrors[k] = ""));
  if (!managers.value.length) {
    fetchManagers();
  }
  showCreateModal.value = true;
};

const handleEdit = (user) => {
  selectedUser.value = user;
  Object.keys(formData).forEach((k) => {
    formData[k] =
      k === "roleId"
        ? user.roleId ||
          (user.role === "ADMIN" ? 1 : user.role === "MANAGER" ? 2 : 3)
        : k === "birthday" || k === "hireDate"
          ? toApiDate(user[k])
          : user[k] || "";
  });
  if (!managers.value.length) {
    fetchManagers();
  }
  showEditModal.value = true;
};

const handleViewSalary = (user) => {
  selectedUser.value = user;
  salaryFormData.salary = user.salary || "";
  salaryFormData.effectiveDate = new Date().toISOString().slice(0, 10);
  salaryFormData.changeReason = "";
  showSalaryModal.value = true;
};

const handleDelete = (user) => {
  selectedUser.value = user;
  showDeleteDialog.value = true;
};

const handleToggleStatus = async (user) => {
  if (!user?.id) {
    toastStore.error(
      "មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពបានទេ៖ ខ្វះលេខសម្គាល់អ្នកប្រើប្រាស់",
    );
    return;
  }

  const nextStatus = user.status === "ACTIVATED" ? "DEACTIVATED" : "ACTIVATED";

  isUpdatingStatus.value = true;

  try {
    await usersApi.updateStatus(user.id, { status: nextStatus });
    toastStore.success("បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកប្រើប្រាស់ដោយជោគជ័យ");
    await fetchUsers();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពបានទេ",
    );
  } finally {
    isUpdatingStatus.value = false;
  }
};

const getCreateUserPayload = () =>
  cleanPayload({
    fullname: formData.fullName,
    email: formData.email,
    password: formData.password,
    roleId: toOptionalNumber(formData.roleId),
    phone: formData.phoneNumber,
    gender: formData.gender,
    birthday: toApiDate(formData.birthday),
    hireDate: toApiDate(formData.hireDate),
    salary: toOptionalNumber(formData.salary),
    managerId:
      Number(formData.roleId) === 3
        ? toOptionalNumber(formData.managerId)
        : null,
  });

const handleSubmitCreate = async () => {
  if (Number(formData.roleId) === 3 && !formData.managerId) {
    toastStore.error("សូមជ្រើសរើសអ្នកគ្រប់គ្រងសម្រាប់បុគ្គលិក");
    return;
  }

  isCreatingUser.value = true;

  try {
    await usersApi.createUser(getCreateUserPayload());
    toastStore.success("បានបង្កើតអ្នកប្រើប្រាស់ដោយជោគជ័យ");
    showCreateModal.value = false;
    await fetchUsers();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចបង្កើតអ្នកប្រើប្រាស់បានទេ",
    );
  } finally {
    isCreatingUser.value = false;
  }
};

const getUpdateUserPayload = () =>
  cleanPayload({
    fullname: formData.fullName,
    phone: formData.phoneNumber,
    gender: formData.gender,
    birthday: toApiDate(formData.birthday),
    hireDate: toApiDate(formData.hireDate),
    managerId: toOptionalNumber(formData.managerId),
    roleId: toOptionalNumber(formData.roleId),
  });

const handleSubmitEdit = async () => {
  if (!selectedUser.value?.id) {
    toastStore.error(
      "មិនអាចធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់បានទេ៖ ខ្វះលេខសម្គាល់អ្នកប្រើប្រាស់",
    );
    return;
  }

  if (Number(formData.roleId) === 3 && !formData.managerId) {
    toastStore.error("សូមជ្រើសរើសអ្នកគ្រប់គ្រង");
    return;
  }

  if (![2, 3].includes(Number(formData.roleId))) {
    toastStore.error("សូមជ្រើសរើសតួនាទី Manager ឬ Staff");
    return;
  }

  isUpdatingUser.value = true;

  try {
    await usersApi.updateUser(selectedUser.value.id, getUpdateUserPayload());
    toastStore.success("បានធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់ដោយជោគជ័យ");
    showEditModal.value = false;
    await fetchUsers();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message ||
        "មិនអាចធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់បានទេ",
    );
  } finally {
    isUpdatingUser.value = false;
  }
};

watch(
  () => formData.roleId,
  (roleId) => {
    if ([1, 2].includes(Number(roleId))) {
      formData.managerId = "";
    }
  },
);

const getSalaryPayload = () =>
  cleanPayload({
    salary: toOptionalNumber(salaryFormData.salary),
    effectiveDate: toApiDate(salaryFormData.effectiveDate),
    changeReason: salaryFormData.changeReason,
  });

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
};

const handleFormSubmit = (data) => {
  Object.assign(formData, data);
  if (showEditModal.value) {
    handleSubmitEdit();
  } else {
    handleSubmitCreate();
  }
};

const handleSubmitSalary = async (data) => {
  if (!selectedUser.value?.id) {
    toastStore.error(
      "មិនអាចធ្វើបច្ចុប្បន្នភាពប្រាក់បៀវត្សបានទេ៖ ខ្វះលេខសម្គាល់អ្នកប្រើប្រាស់",
    );
    return;
  }

  Object.assign(salaryFormData, data);
  isUpdatingSalary.value = true;

  try {
    await usersApi.updateSalary(selectedUser.value.id, getSalaryPayload());
    toastStore.success("បានធ្វើបច្ចុប្បន្នភាពប្រាក់បៀវត្សដោយជោគជ័យ");
    showSalaryModal.value = false;
    await fetchUsers();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message ||
        "មិនអាចធ្វើបច្ចុប្បន្នភាពប្រាក់បៀវត្សបានទេ",
    );
  } finally {
    isUpdatingSalary.value = false;
  }
};

const confirmDelete = async () => {
  if (!selectedUser.value?.id) {
    toastStore.error(
      "មិនអាចលុបអ្នកប្រើប្រាស់បានទេ៖ ខ្វះលេខសម្គាល់អ្នកប្រើប្រាស់",
    );
    return;
  }

  isDeletingUser.value = true;

  try {
    await usersApi.deleteUser(selectedUser.value.id);
    toastStore.success("បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ");
    showDeleteDialog.value = false;
    await fetchUsers();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចលុបអ្នកប្រើប្រាស់បានទេ",
    );
  } finally {
    isDeletingUser.value = false;
  }
};

onMounted(() => {
  fetchUsers();
  fetchManagers();
});
</script>
