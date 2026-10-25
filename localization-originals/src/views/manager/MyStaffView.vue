﻿﻿﻿<template>
  <div class="space-y-6">
    <div class="mb-8">
      <h1 class="text-3xl font-normal text-gray-900 mb-2">បុគ្គលិករបស់ខ្ញុំ</h1>
      <p class="text-gray-500 font-normal">
        មើល និងគ្រប់គ្រងសមាជិកក្រុមរបស់អ្នក
      </p>
    </div>

    <!-- Search -->
    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div class="relative max-w-md">
        <SearchIcon
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="ស្វែងរកបុគ្គលិកតាមឈ្មោះ ឬអ៊ីមែល..."
          class="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
        />
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      v-if="isLoadingStaff || displayStaff.length > 0"
      :columns="columns"
      :data="displayStaff"
      :key-extractor="(user) => user.id"
      :loading="isLoadingStaff"
      :on-row-click="handleViewDetails"
      :pagination="{
        currentPage,
        totalPages,
        onPageChange: handlePageChange,
      }"
    >
      <template #cell(salary)="{ item }">
        {{ item.salary ? `$${item.salary.toLocaleString()}` : "-" }}
      </template>
      <template #cell(status)="{ item }">
        <StatusBadge :status="item.status" />
      </template>
      <template #cell(actions)="{ item }">
        <button
          @click.stop="handleViewDetails(item)"
          class="p-2 hover:bg-gray-100 rounded-lg transition-all text-blue-500"
          title="មើលលម្អិត"
        >
          <EyeIcon class="w-5 h-5" />
        </button>
      </template>
    </DataTable>

    <div
      v-else
      class="bg-white border border-gray-100 rounded-xl p-12 shadow-sm"
    >
      <EmptyState
        :icon="UsersIcon"
        :title="isLoadingStaff ? 'កំពុងទាញយកបុគ្គលិក...' : 'រកមិនឃើញបុគ្គលិក'"
        :description="
          isLoadingStaff
            ? 'សូមរង់ចាំបន្តិច'
            : searchTerm
              ? `មិនមានបុគ្គលិកដែលត្រូវនឹង '${searchTerm}' ទេ`
              : 'អ្នកមិនទាន់មានបុគ្គលិកក្រោមបង្គាប់នៅឡើយទេ។'
        "
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Search as SearchIcon,
  Eye as EyeIcon,
  Users as UsersIcon,
} from "lucide-vue-next";
import DataTable from "@/components/common/DataTable.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { useToastStore } from "@/stores/toast";
import { usersApi } from "@/api/api";

const toastStore = useToastStore();
const router = useRouter();

const staff = ref([]);
const searchTerm = ref("");
const currentPage = ref(1);
const isLoadingStaff = ref(false);

const columns = [
  { key: "fullName", label: "ឈ្មោះពេញ" },
  { key: "email", label: "អ៊ីមែល" },
  { key: "phoneNumber", label: "លេខទូរស័ព្ទ" },
  { key: "salary", label: "ប្រាក់បៀវត្ស" },
  { key: "status", label: "ស្ថានភាព" },
  { key: "actions", label: "សកម្មភាព" },
];

const itemsPerPage = 10;

const getResponseData = (response) => response.data?.data || response.data;

const getUsersList = (data) =>
  data?.users ||
  data?.staff ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const toNumber = (value) => {
  const numberValue = Number(value || 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeUser = (user) => {
  const fullName =
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
    "";

  return {
    ...user,
    id: user.id || user._id || user.uuid,
    fullName,
    email: user.email || "",
    phoneNumber:
      user.phoneNumber ||
      user.phone_number ||
      user.phone ||
      user.mobile ||
      user.mobileNumber ||
      "",
    status: user.status || user.accountStatus || "",
    salary: toNumber(user.salary || user.currentSalary),
    hireDate:
      user.hireDate || user.hire_date || user.startedAt || user.createdAt || "",
  };
};

const filteredStaff = computed(() => {
  const search = searchTerm.value.trim().toLowerCase();

  if (!search) return staff.value;

  return staff.value.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search),
  );
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredStaff.value.length / itemsPerPage)),
);

const displayStaff = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredStaff.value.slice(start, start + itemsPerPage);
});

const handlePageChange = (page) => {
  currentPage.value = page;
};

watch(searchTerm, () => {
  currentPage.value = 1;
});

const fetchMyStaff = async () => {
  isLoadingStaff.value = true;

  try {
    const response = await usersApi.getMyStaff();
    const data = getResponseData(response);
    const list = getUsersList(data);

    staff.value = list.map(normalizeUser);
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Unable to load staff");
    staff.value = [];
  } finally {
    isLoadingStaff.value = false;
  }
};

const handleViewDetails = (member) => {
  if (!member?.id) {
    toastStore.error("Unable to open staff details: missing user ID");
    return;
  }

  router.push({ name: "ManagerStaffDetail", params: { id: member.id } });
};

onMounted(fetchMyStaff);
</script>
