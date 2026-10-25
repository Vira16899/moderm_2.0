<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-normal text-gray-900 mb-2">
          របាយការណ៍របស់ខ្ញុំ
        </h1>
        <p class="text-gray-500 font-normal">
          បង្កើត និងគ្រប់គ្រងរបាយការណ៍លទ្ធផលការងារសម្រាប់បុគ្គលិករបស់អ្នក
        </p>
      </div>
      <button
        @click="handleCreate"
        class="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
      >
        <PlusIcon class="w-5 h-5" />
        បង្កើតរបាយការណ៍ថ្មី
      </button>
    </div>

    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div class="relative max-w-md">
        <SearchIcon
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="ស្វែងរករបាយការណ៍តាមចំណងជើង..."
          class="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
        />
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
      <template #cell(actions)="{ item }">
        <div class="flex items-center gap-2">
          <template v-if="item.status === 'DRAFT'">
            <button
              @click.stop="handleEdit(item)"
              class="p-2 hover:bg-gray-100 rounded-lg transition-all text-blue-500"
              title="កែសម្រួលរបាយការណ៍"
            >
              <EditIcon class="w-5 h-5" />
            </button>
            <button
              @click.stop="handleSubmitRequest(item)"
              class="p-2 hover:bg-gray-100 rounded-lg transition-all text-emerald-500"
              title="ដាក់ស្នើរបាយការណ៍"
            >
              <SendIcon class="w-5 h-5" />
            </button>
          </template>
          <button
            @click.stop="handleView(item)"
            class="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400"
            title="មើលរបាយការណ៍"
          >
            <EyeIcon class="w-5 h-5" />
          </button>
          <button
            v-if="item.status === 'DRAFT'"
            @click.stop="handleDeleteRequest(item)"
            class="p-2 hover:bg-red-50 rounded-lg transition-all text-red-500"
            title="លុបរបាយការណ៍"
          >
            <Trash2Icon class="w-5 h-5" />
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
            : searchTerm
              ? `មិនមានរបាយការណ៍ដែលត្រូវនឹង '${searchTerm}'`
              : 'ចាប់ផ្តើមដោយបង្កើតរបាយការណ៍លទ្ធផលការងារដំបូងរបស់អ្នក!'
        "
      />
    </div>

    <ReportFormModal
      :is-open="showCreateModal || showEditModal"
      :is-edit="showEditModal"
      :loading="isSavingReport"
      :staff-members="staffMembers"
      :initial-data="formData"
      @close="closeModals"
      @submit="handleSubmitForm"
    />

    <MyReportDetailsModal
      :is-open="showViewModal"
      :report="selectedReport"
      @close="showViewModal = false"
    />

    <ConfirmDialog
      :is-open="showSubmitDialog"
      title="ដាក់ស្នើរបាយការណ៍"
      :message="
        selectedReport
          ? `តើអ្នកប្រាកដជាចង់ដាក់ស្នើរបាយការណ៍សម្រាប់ ${selectedReport.staffName} មែនទេ? នៅពេលដាក់ស្នើហើយ អ្នកនឹងមិនអាចកែសម្រួលវាបានទៀតទេ។`
          : ''
      "
      confirm-text="ដាក់ស្នើរបាយការណ៍"
      @close="showSubmitDialog = false"
      @confirm="confirmSubmit"
    />

    <ConfirmDialog
      :is-open="showDeleteDialog"
      title="លុបរបាយការណ៍"
      :message="
        selectedReport
          ? `តើអ្នកប្រាកដជាចង់លុប '${selectedReport.title}' មែនទេ?`
          : ''
      "
      confirm-text="លុបរបាយការណ៍"
      variant="danger"
      @close="showDeleteDialog = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Eye as EyeIcon,
  Trash2 as Trash2Icon,
  FileText as FileTextIcon,
} from "lucide-vue-next";
import DataTable from "@/components/common/DataTable.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ReportFormModal from "@/components/ui/base/ReportFormModal.vue";
import MyReportDetailsModal from "@/components/ui/base/MyReportDetailsModal.vue";
import { useToastStore } from "@/stores/toast";
import { performanceReportsApi, usersApi } from "@/api/api";

const toastStore = useToastStore();

const reports = ref([]);
const staffMembers = ref([]);
const searchTerm = ref("");
const currentPage = ref(1);
const totalReports = ref(0);
const itemsPerPage = 10;
const isLoadingReports = ref(false);
const isSavingReport = ref(false);
const isSubmittingReport = ref(false);
const isDeletingReport = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showSubmitDialog = ref(false);
const showDeleteDialog = ref(false);
const showViewModal = ref(false);
const selectedReport = ref(null);

const formData = reactive({
  title: "",
  staffId: "",
  reportPeriodStart: "",
  reportPeriodEnd: "",
  performanceSummary: "",
  achievement: "",
  areaForImprove: "",
  comment: "",
  rating: 3,
});

const columns = [
  { key: "title", label: "ចំណងជើង" },
  { key: "staffName", label: "បុគ្គលិក" },
  { key: "period", label: "រយៈពេល" },
  { key: "status", label: "ស្ថានភាព" },
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
  if (!term) return reports.value;
  return reports.value.filter((report) =>
    [report.title, report.staffName, report.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)),
  );
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

const getUsersList = (data) =>
  data?.users ||
  data?.staff ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getId = (value) => String(value || "");

const toApiId = (id) => {
  const numericId = Number(id);
  return Number.isInteger(numericId) ? numericId : id;
};

const cleanPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== ""),
  );

const formatDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const formatDateDisplay = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
};

const normalizeStaff = (staff) => {
  const source = {
    ...staff,
    ...(staff.user || staff.profile || {}),
  };

  return {
    ...source,
    id: getId(
      source.id ||
        source.staffId ||
        source.staff_id ||
        source.employeeId ||
        source.employee_id ||
        source.userId ||
        source.user_id ||
        source._id ||
        source.uuid,
    ),
    fullName:
      source.fullName ||
      source.fullname ||
      source.full_name ||
      source.name ||
      source.username ||
      source.displayName ||
      source.display_name ||
      [
        source.firstName || source.first_name,
        source.lastName || source.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      source.email ||
      "Unknown",
    email: source.email || "",
  };
};

const getStaffName = (report) => {
  const staff =
    report.staff ||
    report.user ||
    report.employee ||
    report.staffMember ||
    report.staff_member ||
    {};

  return (
    report.staffName ||
    report.staff_name ||
    staff.fullName ||
    staff.fullname ||
    staff.full_name ||
    staff.name ||
    staff.email ||
    "-"
  );
};

const getReportStaffSource = (report) => {
  const staff =
    report.staff ||
    report.user ||
    report.employee ||
    report.staffMember ||
    report.staff_member ||
    {};

  return {
    ...staff,
    ...(staff.user || staff.profile || staff.employee || {}),
  };
};

const normalizeReport = (report) => {
  const staff = getReportStaffSource(report);
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
    staffId: getId(
      report.staffId ||
        report.staff_id ||
        report.employeeId ||
        report.employee_id ||
        report.userId ||
        report.user_id ||
        staff.id ||
        staff.staffId ||
        staff.staff_id ||
        staff.employeeId ||
        staff.employee_id ||
        staff.userId ||
        staff.user_id,
    ),
    staffName: getStaffName(report),
    status: String(report.status || "DRAFT").toUpperCase(),
    reportPeriodStart: formatDateInput(reportPeriodStart),
    reportPeriodEnd: formatDateInput(reportPeriodEnd),
    period: [
      formatDateDisplay(reportPeriodStart),
      formatDateDisplay(reportPeriodEnd),
    ]
      .filter(Boolean)
      .join(" - "),
    title: report.title || "",
    performanceSummary:
      report.performanceSummary || report.performance_summary || "",
    achievement: report.achievement || "",
    areaForImprove: report.areaForImprove || report.area_for_improve || "",
    comment: report.comment || "",
    rating: Number(report.rating || 3),
  };
};

const getReportPayload = () =>
  cleanPayload({
    title: formData.title,
    performanceSummary: formData.performanceSummary,
    achievement: formData.achievement,
    areaForImprove: formData.areaForImprove,
    comment: formData.comment,
    rating: Number(formData.rating),
    staffId: toApiId(formData.staffId),
    reportPeriodStart: formData.reportPeriodStart,
    reportPeriodEnd: formData.reportPeriodEnd,
  });

const getReportUpdatePayload = () => {
  const { staffId, ...payload } = getReportPayload();

  return payload;
};

const validateReportPayload = (payload) => {
  if (!payload.title) return "សូមបញ្ចូលចំណងជើង";
  if (!payload.staffId) return "សូមជ្រើសរើសបុគ្គលិក";
  if (!payload.reportPeriodStart) return "សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម";
  if (!payload.reportPeriodEnd) return "សូមជ្រើសរើសថ្ងៃបញ្ចប់";
  if (payload.reportPeriodStart > payload.reportPeriodEnd) {
    return "ថ្ងៃចាប់ផ្តើមត្រូវតែមុនថ្ងៃបញ្ចប់";
  }
  if (
    !Number.isInteger(Number(payload.rating)) ||
    Number(payload.rating) < 1 ||
    Number(payload.rating) > 5
  ) {
    return "ការវាយតម្លៃត្រូវតែនៅចន្លោះពី ១ ដល់ ៥";
  }
  return "";
};

const isInvalidInputError = (err) =>
  err.response?.status === 400 ||
  String(err.response?.data?.message || "")
    .toLowerCase()
    .includes("invalid input");

const fetchReports = async () => {
  isLoadingReports.value = true;

  try {
    const response = await performanceReportsApi.getMyReports({
      params: {
        _page: 1,
        _per_page: 1000,
        sortBy: "status",
        sortDir: "DESC",
        periodStart: undefined,
        periodEnd: undefined,
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

const fetchStaff = async () => {
  try {
    const response = await usersApi.getMyStaff();
    const data = getResponseData(response);
    staffMembers.value = getUsersList(data).map(normalizeStaff);
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យបុគ្គលិកបានទេ",
    );
    staffMembers.value = [];
  }
};

const resetForm = () => {
  Object.assign(formData, {
    title: "",
    staffId: "",
    reportPeriodStart: "",
    reportPeriodEnd: "",
    performanceSummary: "",
    achievement: "",
    areaForImprove: "",
    comment: "",
    rating: 3,
  });
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

watch(searchTerm, () => {
  currentPage.value = 1;
});

const handleCreate = () => {
  resetForm();
  showCreateModal.value = true;
};

const handleEdit = (report) => {
  selectedReport.value = report;
  Object.assign(formData, {
    title: report.title,
    staffId: report.staffId,
    reportPeriodStart: report.reportPeriodStart,
    reportPeriodEnd: report.reportPeriodEnd,
    performanceSummary: report.performanceSummary,
    achievement: report.achievement,
    areaForImprove: report.areaForImprove,
    comment: report.comment,
    rating: report.rating,
  });
  showEditModal.value = true;
};

const handleView = (report) => {
  selectedReport.value = report;
  showViewModal.value = true;
};

const handleSubmitRequest = (report) => {
  selectedReport.value = report;
  showSubmitDialog.value = true;
};

const handleDeleteRequest = (report) => {
  if (report.status !== "DRAFT") {
    toastStore.error("មានតែរបាយការណ៍ដែលនៅជាសេចក្តីព្រាងប៉ុណ្ណោះដែលត្រូវបានលុប");
    return;
  }

  selectedReport.value = report;
  showDeleteDialog.value = true;
};

const confirmSubmit = async () => {
  if (!selectedReport.value?.id) return;

  isSubmittingReport.value = true;

  try {
    await performanceReportsApi.submitReport(selectedReport.value.id);
    toastStore.success("របាយការណ៍ត្រូវបានដាក់ស្នើដោយជោគជ័យ");
    showSubmitDialog.value = false;
    await fetchReports();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចដាក់ស្នើរបាយការណ៍បានទេ",
    );
  } finally {
    isSubmittingReport.value = false;
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

const handleSubmitForm = async (data) => {
  Object.assign(formData, data);
  const payload = getReportPayload();
  const validationError = validateReportPayload(payload);

  if (validationError) {
    toastStore.error(validationError);
    return;
  }

  isSavingReport.value = true;

  try {
    if (showEditModal.value) {
      if (!selectedReport.value?.id) {
        toastStore.error("ខ្វះលេខសម្គាល់របាយការណ៍");
        return;
      }

      try {
        await performanceReportsApi.updateReport(
          selectedReport.value.id,
          getReportUpdatePayload(),
        );
      } catch (err) {
        if (!isInvalidInputError(err)) throw err;

        await performanceReportsApi.updateReport(
          selectedReport.value.id,
          payload,
        );
      }
      toastStore.success("សេចក្តីព្រាងត្រូវបានធ្វើបច្ចុប្បន្នភាព");
    } else {
      await performanceReportsApi.createReport(payload);
      toastStore.success("សេចក្តីព្រាងត្រូវបានបង្កើត");
    }
    closeModals();
    await fetchReports();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចរក្សាទុករបាយការណ៍បានទេ",
    );
  } finally {
    isSavingReport.value = false;
  }
};

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedReport.value = null;
};

onMounted(() => {
  fetchReports();
  fetchStaff();
});
</script>
