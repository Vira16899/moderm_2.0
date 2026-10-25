<template>
  <div class="space-y-6">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">ប្រវត្តិប្រាក់បៀវត្ស</h1>
        <p class="text-gray-500 font-medium">
          មើលប្រាក់បៀវត្សបច្ចុប្បន្ន និងប្រវត្តិការផ្លាស់ប្តូររបស់អ្នក
        </p>
      </div>

      <button
        type="button"
        :disabled="isLoadingSalaryHistory"
        @click="fetchSalaryHistory"
        class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCwIcon
          class="h-4 w-4"
          :class="{ 'animate-spin': isLoadingSalaryHistory }"
        />
        ធ្វើបច្ចុប្បន្នភាព
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        v-for="stat in salaryStats"
        :key="stat.label"
        class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm transition-all hover:shadow-md"
      >
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-bold text-gray-400 uppercase tracking-wider">
            {{ stat.label }}
          </p>
          <component :is="stat.icon" class="w-5 h-5" :class="stat.iconColor" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ stat.value }}</h2>
        <p class="text-xs text-gray-400 font-medium">{{ stat.subtext }}</p>
      </div>
    </div>

    <div
      v-if="isLoadingSalaryHistory"
      class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
    >
      <SkeletonLoader type="detail" />
    </div>

    <div
      v-else-if="salaryHistory.length === 0"
      class="bg-white border border-gray-100 rounded-xl p-12 shadow-sm"
    >
      <EmptyState
        :icon="DollarSignIcon"
        title="រកមិនឃើញប្រវត្តិប្រាក់បៀវត្ស"
        description="ការផ្លាស់ប្តូរប្រាក់បៀវត្សរបស់អ្នកនឹងបង្ហាញនៅទីនេះ នៅពេលមានទិន្នន័យ។"
      />
    </div>

    <template v-else>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-3">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900">និន្នាការប្រាក់បៀវត្ស</h3>
              <p class="text-sm text-gray-400">
                ការរីកចម្រើនផ្អែកលើកំណត់ត្រាប្រាក់បៀវត្សដែលមានប្រសិទ្ធភាព។
              </p>
            </div>
            <span
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="salaryIncrease >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
            >
              {{ salaryIncrease >= 0 ? "+" : "" }}{{ salaryIncreasePercent }}%
            </span>
          </div>

          <div class="relative h-72 rounded-2xl bg-gray-50 p-5">
            <div class="absolute inset-x-5 top-5 bottom-12 flex flex-col justify-between">
              <span v-for="line in 4" :key="line" class="border-t border-white"></span>
            </div>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              class="absolute inset-x-5 top-5 bottom-12 h-[calc(100%-68px)] w-[calc(100%-40px)] overflow-visible"
            >
              <polyline
                :points="salaryTrendPoints"
                fill="none"
                stroke="#84A98C"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
              <circle
                v-for="point in salaryTrend"
                :key="point.id"
                :cx="point.x"
                :cy="point.y"
                r="2.4"
                fill="#52796F"
                stroke="white"
                stroke-width="1.5"
                vector-effect="non-scaling-stroke"
              />
            </svg>

            <div class="absolute inset-x-5 bottom-5 grid gap-2" :style="{ gridTemplateColumns: `repeat(${salaryTrend.length}, minmax(0, 1fr))` }">
              <div
                v-for="point in salaryTrend"
                :key="`${point.id}-label`"
                class="min-w-0 text-center"
              >
                <p class="truncate text-xs font-semibold text-gray-700">{{ point.label }}</p>
                <p class="truncate text-[11px] text-gray-400">{{ point.amount }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 class="text-xl font-bold text-gray-900">ពេលវេលាផ្លាស់ប្តូរ</h3>
          <p class="mb-6 text-sm text-gray-400">បង្ហាញការផ្លាស់ប្តូរថ្មីបំផុតមុន</p>
          <div class="space-y-4">
            <div
              v-for="record in salaryHistory.slice(0, 4)"
              :key="`${record.id}-timeline`"
              class="flex gap-3"
            >
              <div class="flex flex-col items-center">
                <span class="h-3 w-3 rounded-full bg-[#84A98C]"></span>
                <span class="mt-1 h-full min-h-10 w-px bg-gray-100"></span>
              </div>
              <div class="min-w-0 flex-1 pb-4">
                <div class="flex items-start justify-between gap-3">
                  <p class="font-semibold text-gray-900">{{ formatCurrency(record.newSalary) }}</p>
                  <span class="text-xs font-semibold" :class="getChangeClass(record)">
                    {{ formatSalaryChange(record) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500">{{ record.changeReason || "ការកែសម្រួលប្រាក់បៀវត្ស" }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ formatDate(record.effectiveDate) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm relative overflow-hidden"
        >
          <div
            class="absolute top-0 right-0 px-4 py-1 bg-[#84A98C] text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-lg"
          >
            បច្ចុប្បន្ន
          </div>
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm"
            >
              <DollarSignIcon class="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">ប្រាក់បៀវត្សបច្ចុប្បន្ន</h3>
              <p class="text-sm text-gray-400 font-medium">
                កំណត់ត្រាប្រាក់បៀវត្សចុងក្រោយ
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="item in currentDetails"
              :key="item.label"
              class="flex justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
            >
              <span class="text-sm text-gray-400 font-medium">{{ item.label }}</span>
              <span
                class="text-right text-gray-900 font-bold"
                :class="item.highlight ? 'text-lg text-emerald-600' : ''"
              >
                {{ item.value }}
              </span>
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm relative opacity-90"
        >
          <div
            class="absolute top-0 right-0 px-4 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-bl-lg"
          >
            មុន
          </div>
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center"
            >
              <DollarSignIcon class="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-500">ប្រាក់បៀវត្សចាស់</h3>
              <p class="text-sm text-gray-300 font-medium">
                ចំនួនទឹកប្រាក់មុនការផ្លាស់ប្តូរចុងក្រោយ
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="item in oldDetails"
              :key="item.label"
              class="flex justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
            >
              <span class="text-sm text-gray-300 font-medium">{{ item.label }}</span>
              <span class="text-right text-gray-400 font-bold">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-900">កំណត់ត្រាផ្លាស់ប្តូរ</h3>
          <p class="text-sm text-gray-400">
            តម្រៀបតាមថ្ងៃបង្កើតថ្មីបំផុតពីប្រវត្តិប្រាក់បៀវត្សរបស់អ្នក។
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-for="record in salaryHistory" :key="record.id">
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                  {{ formatCurrency(record.previousSalary) }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-emerald-600">
                  {{ formatCurrency(record.newSalary) }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold" :class="getChangeClass(record)">
                  {{ formatSalaryChange(record) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ record.changeReason || "-" }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ formatDate(record.effectiveDate) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-400">
                  {{ formatDateTime(record.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import {
  DollarSign as DollarSignIcon,
  RefreshCw as RefreshCwIcon,
  TrendingUp as TrendingUpIcon,
} from "lucide-vue-next";
import EmptyState from "@/components/common/EmptyState.vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import { salaryHistoryApi } from "@/api/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const authStore = useAuthStore();
const toastStore = useToastStore();

const salaryHistory = ref([]);
const isLoadingSalaryHistory = ref(false);

const columns = [
  { key: "previousSalary", label: "ប្រាក់បៀវត្សមុន" },
  { key: "newSalary", label: "ប្រាក់បៀវត្សថ្មី" },
  { key: "change", label: "ការផ្លាស់ប្តូរ" },
  { key: "changeReason", label: "មូលហេតុ" },
  { key: "effectiveDate", label: "កាលបរិច្ឆេទមានប្រសិទ្ធភាព" },
  { key: "createdAt", label: "ថ្ងៃបង្កើត" },
];

const getResponseData = (response) => response.data?.data || response.data;

const getSalaryHistoryList = (data) =>
  data?.salaryHistory ||
  data?.history ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

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

const normalizeSalaryRecord = (record) => ({
  ...record,
  id: record.id || record._id || `${record.createdAt}-${record.effectiveDate}`,
  previousSalary: toNumber(record.previousSalary || record.oldSalary),
  newSalary: toNumber(record.newSalary || record.currentSalary || record.salary),
  changeReason: record.changeReason || record.reason || "",
  effectiveDate: record.effectiveDate || record.effective_date || "",
  createdAt: record.createdAt || record.created_at || "",
  updatedAt: record.updatedAt || record.updated_at || "",
});

const sortedSalaryHistory = (records) =>
  [...records].sort((first, second) => {
    const firstDate = new Date(first.createdAt || first.effectiveDate).getTime();
    const secondDate = new Date(second.createdAt || second.effectiveDate).getTime();

    return (secondDate || 0) - (firstDate || 0);
  });

const user = computed(() => authStore.user);
const latestRecord = computed(() => salaryHistory.value[0] || null);
const previousRecord = computed(() => salaryHistory.value[1] || null);

const currentSalary = computed(
  () => latestRecord.value?.newSalary || toNumber(user.value?.salary),
);
const previousSalary = computed(
  () => previousRecord.value?.newSalary || latestRecord.value?.previousSalary || 0,
);

const salaryIncrease = computed(() => currentSalary.value - previousSalary.value);
const salaryIncreasePercent = computed(() => {
  if (!previousSalary.value) return "0.0";

  return ((salaryIncrease.value / previousSalary.value) * 100).toFixed(1);
});

const salaryTrend = computed(() => {
  const records = [...salaryHistory.value].reverse();
  if (!records.length) return [];

  const salaries = records.map((record) => record.newSalary);
  const minSalary = Math.min(...salaries);
  const maxSalary = Math.max(...salaries);
  const range = Math.max(maxSalary - minSalary, 1);
  const divisor = Math.max(records.length - 1, 1);

  return records.map((record, index) => {
    const x = records.length === 1 ? 50 : (index / divisor) * 100;
    const y = 92 - ((record.newSalary - minSalary) / range) * 78;

    return {
      id: record.id || index,
      x,
      y,
      label: formatDate(record.effectiveDate),
      amount: formatCurrency(record.newSalary),
    };
  });
});

const salaryTrendPoints = computed(() =>
  salaryTrend.value.map((point) => `${point.x},${point.y}`).join(" "),
);

const salaryStats = computed(() => [
  {
    label: "ប្រាក់បៀវត្សបច្ចុប្បន្ន",
    value: formatCurrency(currentSalary.value),
    icon: DollarSignIcon,
    iconColor: "text-blue-400",
    subtext: "កំណត់ត្រាប្រាក់បៀវត្សចុងក្រោយ",
  },
  {
    label: "ការកើនឡើង",
    value: `${salaryIncrease.value >= 0 ? "+" : ""}${formatCurrency(salaryIncrease.value)}`,
    icon: TrendingUpIcon,
    iconColor: salaryIncrease.value >= 0 ? "text-emerald-400" : "text-red-400",
    subtext: `${salaryIncrease.value >= 0 ? "+" : ""}${salaryIncreasePercent.value}% បើប្រៀបធៀបនឹងប្រាក់បៀវត្សមុន`,
  },
]);

const currentDetails = computed(() => [
  {
    label: "ចំនួនប្រាក់បៀវត្ស",
    value: formatCurrency(currentSalary.value),
    highlight: true,
  },
  {
    label: "កាលបរិច្ឆេទមានប្រសិទ្ធភាព",
    value: formatDate(latestRecord.value?.effectiveDate),
  },
  {
    label: "ថ្ងៃបង្កើត",
    value: formatDateTime(latestRecord.value?.createdAt),
  },
  {
    label: "មូលហេតុកែប្រែ",
    value: latestRecord.value?.changeReason || "-",
  },
]);

const oldDetails = computed(() => [
  { label: "ចំនួនប្រាក់បៀវត្ស", value: formatCurrency(previousSalary.value) },
  {
    label: "កាលបរិច្ឆេទមានប្រសិទ្ធភាព",
    value: formatDate(previousRecord.value?.effectiveDate || latestRecord.value?.effectiveDate),
  },
  {
    label: "ថ្ងៃបង្កើត",
    value: formatDateTime(previousRecord.value?.createdAt || latestRecord.value?.createdAt),
  },
  {
    label: "មូលហេតុកែប្រែ",
    value: previousRecord.value?.changeReason || latestRecord.value?.changeReason || "-",
  },
]);

const formatSalaryChange = (record) => {
  const change = toNumber(record.newSalary) - toNumber(record.previousSalary);

  return `${change >= 0 ? "+" : ""}${formatCurrency(change)}`;
};

const getChangeClass = (record) => {
  const change = toNumber(record.newSalary) - toNumber(record.previousSalary);

  return change >= 0 ? "text-emerald-600" : "text-red-500";
};

const fetchSalaryHistory = async () => {
  isLoadingSalaryHistory.value = true;

  try {
    const response = await salaryHistoryApi.getMySalaryHistory(null, {
      params: { sortBy: "createdAt" },
    });
    const data = getResponseData(response);
    const list = getSalaryHistoryList(data);

    salaryHistory.value = sortedSalaryHistory(list.map(normalizeSalaryRecord));
  } catch (err) {
    salaryHistory.value = [];
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកប្រវត្តិប្រាក់បៀវត្សបានទេ",
    );
  } finally {
    isLoadingSalaryHistory.value = false;
  }
};

onMounted(fetchSalaryHistory);
</script>
