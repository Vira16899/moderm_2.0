<template>
  <BaseModal
    :is-open="isOpen"
    :title="title"
    size="xl"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">
            {{ staff?.email || "Salary adjustment records" }}
          </p>
          <p class="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {{ totalItems }} records
          </p>
        </div>
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          @click="$emit('refresh')"
        >
          <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </div>

      <div
        v-if="loading"
        class="overflow-hidden rounded-xl border border-gray-100 bg-white"
      >
        <SkeletonLoader type="table" :rows="6" :columns="6" />
      </div>

      <div
        v-else-if="records.length === 0"
        class="rounded-xl border border-gray-100 bg-white p-10"
      >
        <EmptyState
          :icon="DollarSignIcon"
          title="No salary history found"
          description="Salary changes for this user will appear here."
        />
      </div>

      <template v-else>
        <div class="overflow-hidden rounded-xl border border-gray-100">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    v-for="column in columns"
                    :key="column.key"
                    class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr v-for="record in records" :key="record.id">
                  <td class="px-5 py-4 text-sm font-semibold text-gray-700">
                    {{ formatCurrency(record.previousSalary) }}
                  </td>
                  <td class="px-5 py-4 text-sm font-semibold text-emerald-600">
                    {{ formatCurrency(record.newSalary) }}
                  </td>
                  <td class="px-5 py-4 text-sm font-semibold" :class="getChangeClass(record)">
                    {{ formatSalaryChange(record) }}
                  </td>
                  <td class="max-w-[220px] px-5 py-4 text-sm text-gray-600">
                    <span class="line-clamp-2">{{ record.changeReason || "-" }}</span>
                  </td>
                  <td class="px-5 py-4 text-sm text-gray-600">
                    {{ formatDate(record.effectiveDate) }}
                  </td>
                  <td class="px-5 py-4 text-right">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-blue-600 transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="loadingDetails"
                      title="View salary history detail"
                      @click="$emit('view-record', record)"
                    >
                      <EyeIcon class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="totalPages > 1"
            class="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3"
          >
            <p class="text-sm font-medium text-gray-500">
              Page <span class="font-bold text-gray-900">{{ currentPage }}</span>
              of <span class="font-bold text-gray-900">{{ totalPages }}</span>
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentPage === 1 || loading"
                @click="$emit('page-change', currentPage - 1)"
              >
                <ChevronLeftIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentPage === totalPages || loading"
                @click="$emit('page-change', currentPage + 1)"
              >
                <ChevronRightIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-100 bg-gray-50 p-5">
          <div class="mb-4 flex items-center gap-2">
            <FileTextIcon class="h-5 w-5 text-[#84A98C]" />
            <h3 class="text-base font-bold text-gray-900">Selected Record</h3>
          </div>

          <div v-if="loadingDetails">
            <SkeletonLoader type="detail" />
          </div>
          <div v-else-if="selectedRecord" class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="item in detailItems"
              :key="item.label"
              class="rounded-lg bg-white p-4"
            >
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400">
                {{ item.label }}
              </p>
              <p class="mt-1 text-sm font-semibold text-gray-900">
                {{ item.value }}
              </p>
            </div>
          </div>
          <p v-else class="py-4 text-sm font-medium text-gray-500">
            Select a record to view its detail.
          </p>
        </div>
      </template>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-[#84A98C] px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
        @click="$emit('close')"
      >
        Close
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from "vue";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DollarSign as DollarSignIcon,
  Eye as EyeIcon,
  FileText as FileTextIcon,
  LoaderCircle as LoaderCircleIcon,
  RefreshCw as RefreshCwIcon,
} from "lucide-vue-next";
import EmptyState from "@/components/common/EmptyState.vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import BaseModal from "@/components/ui/base/BaseModal.vue";

const props = defineProps({
  isOpen: Boolean,
  staff: {
    type: Object,
    default: null,
  },
  records: {
    type: Array,
    default: () => [],
  },
  selectedRecord: {
    type: Object,
    default: null,
  },
  loading: Boolean,
  loadingDetails: Boolean,
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
});

defineEmits(["close", "refresh", "page-change", "view-record"]);

const columns = [
  { key: "previousSalary", label: "Previous" },
  { key: "newSalary", label: "New" },
  { key: "change", label: "Change" },
  { key: "changeReason", label: "Reason" },
  { key: "effectiveDate", label: "Effective Date" },
  { key: "actions", label: "" },
];

const title = computed(() =>
  props.staff?.fullName
    ? `${props.staff.fullName} salary history`
    : "Salary history",
);

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

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const formatSalaryChange = (record) => {
  const change = toNumber(record.newSalary) - toNumber(record.previousSalary);

  return `${change >= 0 ? "+" : ""}${formatCurrency(change)}`;
};

const getChangeClass = (record) => {
  const change = toNumber(record.newSalary) - toNumber(record.previousSalary);

  return change >= 0 ? "text-emerald-600" : "text-red-500";
};

const detailItems = computed(() => {
  const record = props.selectedRecord;
  if (!record) return [];

  return [
    { label: "Previous Salary", value: formatCurrency(record.previousSalary) },
    { label: "New Salary", value: formatCurrency(record.newSalary) },
    { label: "Change", value: formatSalaryChange(record) },
    { label: "Effective Date", value: formatDate(record.effectiveDate) },
    { label: "Created", value: formatDateTime(record.createdAt) },
    { label: "Updated", value: formatDateTime(record.updatedAt) },
    { label: "Reason", value: record.changeReason || "-" },
  ];
});
</script>
