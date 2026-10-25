<template>
  <div class="space-y-6">
    <div class="mb-8">
      <h1 class="text-3xl font-normal text-gray-900 mb-2">
        របាយការណ៍លទ្ធផលការងារ
      </h1>
      <p class="text-gray-500 font-normal">
        ពិនិត្យ និងគ្រប់គ្រងរបាយការណ៍លទ្ធផលការងារទាំងអស់ក្នុងអង្គភាព
      </p>
    </div>

    <div class="flex flex-col md:flex-row gap-4 mb-6">
      <div class="flex-1 relative">
        <SearchIcon
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="ស្វែងរកតាមចំណងជើង ឬឈ្មោះបុគ្គលិក..."
          class="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
        />
      </div>
      <select
        v-model="filterStatus"
        class="px-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C] min-w-[150px] font-normal"
      >
        <option value="ALL">ស្ថានភាពទាំងអស់</option>
        <option value="SUBMITTED">បានដាក់ស្នើ</option>
        <option value="REVIEWED">បានពិនិត្យ</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        v-for="stat in reportStats"
        :key="stat.label"
        class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
      >
        <p
          class="text-sm font-normal text-gray-400 mb-1 uppercase tracking-wider"
        >
          {{ stat.label }}
        </p>
        <h2 class="text-2xl font-normal" :class="stat.color">
          {{ stat.value }}
        </h2>
      </div>
    </div>

    <DataTable
      v-if="isLoadingReports || paginatedReports.length > 0"
      :columns="columns"
      :data="paginatedReports"
      :key-extractor="(report) => report.id"
      :loading="isLoadingReports"
      :pagination="pagination"
      :on-row-click="handleView"
    >
      <template #cell(status)="{ item }">
        <StatusBadge :status="item.status" />
      </template>
      <template #cell(submittedAt)="{ item }">
        {{
          item.submittedAt
            ? new Date(item.submittedAt).toLocaleDateString()
            : "-"
        }}
      </template>
      <template #cell(actions)="{ item }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="handleView(item)"
            class="p-2 hover:bg-blue-50 rounded-lg transition-all text-blue-600"
            title="មើលលម្អិត"
          >
            <EyeIcon class="w-4 h-4" />
          </button>
          <button
            v-if="item.status === 'SUBMITTED'"
            @click.stop="handleReview(item)"
            class="p-2 hover:bg-emerald-50 rounded-lg transition-all text-emerald-600"
            title="សម្គាល់ថាបានពិនិត្យ"
          >
            <CheckCircleIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleDelete(item)"
            class="p-2 hover:bg-red-50 rounded-lg transition-all text-red-600"
            title="លុបរបាយការណ៍"
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
        :icon="FileTextIcon"
        :title="
          isLoadingReports ? 'កំពុងទាញយករបាយការណ៍...' : 'រកមិនឃើញរបាយការណ៍'
        "
        :description="
          isLoadingReports
            ? 'សូមរង់ចាំបន្តិច'
            : 'មិនមានរបាយការណ៍សម្រាប់បង្ហាញទេ'
        "
      />
    </div>

    <ReportDetailsModal
      :is-open="showViewModal"
      :report="selectedReport"
      :can-review="selectedReport?.status === 'SUBMITTED'"
      :review-loading="isReviewingReport"
      @close="showViewModal = false"
      @review="handleReviewFromView"
    />

    <ConfirmDialog
      :is-open="showReviewDialog"
      title="បញ្ចប់ការពិនិត្យ"
      :message="`តើអ្នកប្រាកដជាចង់សម្គាល់ '${selectedReport?.title}' ថាបានពិនិត្យមែនទេ? វានឹងបញ្ចប់ស្ថានភាពរបាយការណ៍។`"
      confirm-text="បញ្ជាក់ការពិនិត្យ"
      @close="showReviewDialog = false"
      @confirm="confirmReview"
    />

    <ConfirmDialog
      :is-open="showDeleteDialog"
      title="លុបរបាយការណ៍"
      :message="`តើអ្នកប្រាកដជាចង់លុប '${selectedReport?.title}' មែនទេ?`"
      confirm-text="លុបរបាយការណ៍"
      variant="danger"
      @close="showDeleteDialog = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  Search as SearchIcon,
  Eye as EyeIcon,
  CheckCircle as CheckCircleIcon,
  Trash2 as Trash2Icon,
  FileText as FileTextIcon,
} from "lucide-vue-next";
import DataTable from "@/components/common/DataTable.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ReportDetailsModal from "@/components/ui/base/ReportDetailsModal.vue";
import { useToastStore } from "@/stores/toast";
import { performanceReportsApi } from "@/api/api";

const toastStore = useToastStore();

const reports = ref([]);
const searchTerm = ref("");
const filterStatus = ref("ALL");
const currentPage = ref(1);
const totalReports = ref(0);
const itemsPerPage = 10;
const isLoadingReports = ref(false);
const isReviewingReport = ref(false);
const isDeletingReport = ref(false);
const showViewModal = ref(false);
const showReviewDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedReport = ref(null);

const reportStats = computed(() => [
  {
    label: "រង់ចាំពិនិត្យ",
    value: reports.value.filter((report) => report.status === "SUBMITTED")
      .length,
    color: "text-amber-500",
  },
  {
    label: "បានពិនិត្យ",
    value: reports.value.filter((report) => report.status === "REVIEWED")
      .length,
    color: "text-emerald-600",
  },
  {
    label: "របាយការណ៍សរុប",
    value: totalReports.value || reports.value.length,
    color: "text-gray-900",
  },
]);

const columns = [
  { key: "title", label: "ចំណងជើង" },
  { key: "staffName", label: "បុគ្គលិក" },
  { key: "managerName", label: "អ្នកគ្រប់គ្រង" },
  { key: "period", label: "រយៈពេល" },
  { key: "status", label: "ស្ថានភាព" },
  { key: "submittedAt", label: "កាលបរិច្ឆេទដាក់ស្នើ" },
  { key: "actions", label: "សកម្មភាព" },
];

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredReports.value.length / itemsPerPage)),
);

const pagination = computed(() => ({
  currentPage: currentPage.value,
  totalPages: totalPages.value,
  onPageChange: handlePageChange,
}));

const filteredReports = computed(() => {
  const term = searchTerm.value.toLowerCase().trim();

  return reports.value.filter((report) => {
    const matchesSearch =
      !term ||
      [report.title, report.staffName, report.managerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    const matchesStatus =
      filterStatus.value === "ALL" || report.status === filterStatus.value;

    return matchesSearch && matchesStatus;
  });
});

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredReports.value.slice(start, start + itemsPerPage);
});

const getResponseData = (response) => response.data?.data || response.data;

const getReportsList = (data) =>
  data?.reports ||
  data?.performanceReports ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getReportsTotal = (data, list) =>
  Number(
    data?.total ||
      data?.totalItems ||
      data?.totalReports ||
      data?.totalRecords ||
      data?.meta?.total ||
      data?.pagination?.total ||
      list.length,
  );

const getId = (value) => String(value || "");

const formatDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const formatDateDisplay = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
};

const getPersonName = (source = {}) =>
  source.fullName ||
  source.fullname ||
  source.full_name ||
  source.name ||
  source.username ||
  source.displayName ||
  source.display_name ||
  [source.firstName || source.first_name, source.lastName || source.last_name]
    .filter(Boolean)
    .join(" ") ||
  source.email ||
  "-";

const normalizeReport = (report) => {
  const staff =
    report.staff ||
    report.user ||
    report.employee ||
    report.staffMember ||
    report.staff_member ||
    {};
  const manager =
    report.manager ||
    report.reviewer ||
    report.createdBy ||
    report.created_by ||
    {};
  const reportPeriodStart =
    report.reportPeriodStart ||
    report.report_period_start ||
    report.periodStart ||
    report.period_start ||
    "";
  const reportPeriodEnd =
    report.reportPeriodEnd ||
    report.report_period_end ||
    report.periodEnd ||
    report.period_end ||
    "";

  return {
    ...report,
    id: getId(
      report.id ||
        report.reportId ||
        report.report_id ||
        report.performanceReportId ||
        report.performance_report_id ||
        report._id ||
        report.uuid,
    ),
    title: report.title || "",
    staffName: report.staffName || report.staff_name || getPersonName(staff),
    managerName:
      report.managerName || report.manager_name || getPersonName(manager),
    status: String(report.status || "DRAFT").toUpperCase(),
    submittedAt: report.submittedAt || report.submitted_at || "",
    reviewedAt: report.reviewedAt || report.reviewed_at || "",
    reportPeriodStart: formatDateInput(reportPeriodStart),
    reportPeriodEnd: formatDateInput(reportPeriodEnd),
    period: [
      formatDateDisplay(reportPeriodStart),
      formatDateDisplay(reportPeriodEnd),
    ]
      .filter(Boolean)
      .join(" - "),
    performanceSummary:
      report.performanceSummary || report.performance_summary || "",
    achievement: report.achievement || "",
    areaForImprove: report.areaForImprove || report.area_for_improve || "",
    comment: report.comment || "",
    content:
      report.content ||
      report.performanceSummary ||
      report.performance_summary ||
      report.comment ||
      "",
    rating: Number(report.rating || 0),
  };
};

const fetchReports = async () => {
  isLoadingReports.value = true;

  try {
    const response = await performanceReportsApi.getAllReports({
      params: {
        _page: 1,
        _per_page: 1000,
        sortBy: "status",
        sortDir: "DESC",
      },
    });
    const data = getResponseData(response);
    const list = getReportsList(data);

    reports.value = list.map(normalizeReport);
    totalReports.value = getReportsTotal(data, list);
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យរបាយការណ៍បានទេ",
    );
    reports.value = [];
    totalReports.value = 0;
  } finally {
    isLoadingReports.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

watch([searchTerm, filterStatus], () => {
  currentPage.value = 1;
});

const handleView = (report) => {
  selectedReport.value = report;
  showViewModal.value = true;
};

const handleReview = (report) => {
  selectedReport.value = report;
  showReviewDialog.value = true;
};

const handleReviewFromView = () => {
  if (!selectedReport.value) return;

  showViewModal.value = false;
  showReviewDialog.value = true;
};

const handleDelete = (report) => {
  selectedReport.value = report;
  showDeleteDialog.value = true;
};

const confirmReview = async () => {
  if (!selectedReport.value?.id) return;

  isReviewingReport.value = true;

  try {
    await performanceReportsApi.reviewReport(selectedReport.value.id);
    toastStore.success("របាយការណ៍ត្រូវបានសម្គាល់ថាបានពិនិត្យ");
    showReviewDialog.value = false;
    await fetchReports();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចពិនិត្យរបាយការណ៍បានទេ",
    );
  } finally {
    isReviewingReport.value = false;
  }
};

const confirmDelete = async () => {
  if (!selectedReport.value?.id) return;

  isDeletingReport.value = true;

  try {
    await performanceReportsApi.deleteReport(selectedReport.value.id);
    toastStore.success("របាយការណ៍ត្រូវបានលុបដោយជោគជ័យ");
    showDeleteDialog.value = false;
    await fetchReports();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចលុបរបាយការណ៍បានទេ");
  } finally {
    isDeletingReport.value = false;
  }
};

onMounted(() => {
  fetchReports();
});
</script>
