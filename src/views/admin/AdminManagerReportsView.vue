<script setup>
import { computed, ref } from "vue";
import { Building2, Calendar, Check, Eye, Search, User, X } from "lucide-vue-next";
import { Teleport } from "vue";
import { labels } from "../../data/labels";

const props = defineProps({
  reports: { type: Array, default: () => [] },
  onUpdateReportStatus: { type: Function, default: null },
});
const activeTab = ref("list");
const selectedType = ref("ALL");
const selectedStatus = ref("ALL");
const searchTerm = ref("");
const viewingReport = ref(null);
const filteredReports = computed(() => props.reports.filter((report) => {
  const term = searchTerm.value.toLowerCase();
  const matchesSearch = [report.titleKh, report.titleEn, report.managerNameKh, report.managerNameEn, report.departmentKh]
    .some((value) => (value || "").toLowerCase().includes(term));
  const matchesType = selectedType.value === "ALL" || report.type === selectedType.value;
  const matchesStatus = activeTab.value === "history" && selectedStatus.value === "ALL"
    ? report.status !== "submitted"
    : selectedStatus.value === "ALL" || report.status === selectedStatus.value;
  return matchesSearch && matchesType && matchesStatus;
}));
const statusClass = (status) => status === "approved"
  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
  : status === "reviewed"
    ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
function updateStatus(reportId, status) {
  props.onUpdateReportStatus?.(reportId, status);
  if (viewingReport.value?.id === reportId) viewingReport.value = { ...viewingReport.value, status };
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-200">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold text-slate-800 dark:text-white sm:text-3xl">របាយការណ៍ពីប្រធានផ្នែក</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">បញ្ជីរបាយការណ៍ មើលខ្លឹមសារលម្អិត និងប្រវត្តិរបាយការណ៍ប្រតិបត្តិការពីប្រធានផ្នែកទាំងអស់</p>
      </div>
      <select v-model="activeTab" class="filter-select" aria-label="ជ្រើសរើសប្រភេទ"><option value="list">បញ្ជីរបាយការណ៍</option><option value="history">ប្រវត្តិរបាយការណ៍</option></select>
    </header>

    <section class="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
      <div class="relative w-full sm:w-80"><Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input v-model="searchTerm" type="text" placeholder="ស្វែងរករបាយការណ៍ ឬប្រធានផ្នែក..." class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#003049] dark:border-slate-700 dark:bg-slate-900/50" /></div>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <select v-model="selectedType" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"><option value="ALL">គ្រប់ប្រភេទរបាយការណ៍</option><option value="attendance">វត្តមាន</option><option value="leave">ការសុំច្បាប់</option><option value="weekly">ប្រចាំសប្តាហ៍</option><option value="monthly">ប្រចាំខែ</option><option value="incident">ឧបទ្ទវហេតុ/បច្ចេកទេស</option></select>
        <select v-model="selectedStatus" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"><option value="ALL">គ្រប់ស្ថានភាព</option><option value="submitted">បានបញ្ជូន</option><option value="reviewed">បានពិនិត្យ</option><option value="approved">បានអនុម័ត</option></select>
      </div>
    </section>

    <section class="space-y-3">
      <div v-if="!filteredReports.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-900">រកមិនឃើញរបាយការណ៍ដែលត្រូវនឹងការស្វែងរកទេ</div>
      <article v-for="report in filteredReports" :key="report.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#003049] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-[#b2e9ff]">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div class="flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ report.id }}</span>
              <span class="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold uppercase text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">{{ labels[report.type || report.reportType] || labels.report }}</span>
              <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold', statusClass(report.status)]">{{ report.status === 'approved' ? 'បានអនុម័ត' : report.status === 'reviewed' ? 'បានពិនិត្យ' : 'រង់ចាំពិនិត្យ' }}</span>
            </div>
            <h3 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ report.titleKh }}</h3>
            <p class="mb-3 text-xs text-slate-500 dark:text-slate-400">{{ report.summaryKh }}</p>
            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span class="flex items-center gap-1"><User class="h-3.5 w-3.5" /><strong class="text-slate-700 dark:text-slate-200">{{ report.managerNameKh }}</strong></span>
              <span class="flex items-center gap-1"><Building2 class="h-3.5 w-3.5" />{{ report.departmentKh }}</span>
              <span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{{ report.submissionDate }}</span>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button class="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#002235]" @click="viewingReport = report"><Eye class="h-3.5 w-3.5" />មើលរបាយការណ៍</button>
            <button v-if="report.status !== 'approved'" class="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700" title="អនុម័តរបាយការណ៍" @click="updateStatus(report.id, 'approved')"><Check class="h-3.5 w-3.5" />អនុម័ត</button>
          </div>
        </div>
      </article>
    </section>

    <Teleport to="body">
      <div v-if="viewingReport" class="modal-overlay fixed inset-0 z-[100] flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
        <div class="modal-surface relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-8">
          <button class="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:text-slate-600" @click="viewingReport = null"><X class="h-5 w-5" /></button>
          <div class="mb-2 flex items-center gap-2"><span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500 dark:bg-slate-800">{{ viewingReport.id }}</span><span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">{{ labels[viewingReport.type || viewingReport.reportType] || labels.report }}</span></div>
          <h2 class="mb-2 text-xl font-bold text-slate-800 dark:text-white sm:text-2xl">{{ viewingReport.titleKh }}</h2>
          <div class="mb-4 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div><span class="block text-slate-400">អ្នករាយការណ៍</span><span class="font-bold text-slate-800 dark:text-white">{{ viewingReport.managerNameKh }}</span></div>
            <div><span class="block text-slate-400">នាយកដ្ឋាន</span><span class="font-bold text-slate-800 dark:text-white">{{ viewingReport.departmentKh }}</span></div>
            <div><span class="block text-slate-400">កាលបរិច្ឆេទ</span><span class="font-mono text-slate-800 dark:text-white">{{ viewingReport.submissionDate }}</span></div>
            <div><span class="block text-slate-400">ស្ថានភាពបច្ចុប្បន្ន</span><span class="font-bold uppercase text-emerald-600">{{ labels[viewingReport.status] || viewingReport.status }}</span></div>
          </div>
          <div class="mb-4"><h4 class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">សេចក្តីសង្ខេបរបាយការណ៍</h4><p class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">{{ viewingReport.summaryKh }}</p></div>
          <div v-if="viewingReport.metrics && Object.keys(viewingReport.metrics).length" class="mb-6"><h4 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">សូចនាករប្រតិបត្តិការគន្លឹះ</h4><div class="grid grid-cols-2 gap-2 sm:grid-cols-4"><div v-for="([key, value]) in Object.entries(viewingReport.metrics)" :key="key" class="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-white/5"><span class="block truncate text-xs font-bold uppercase text-slate-400">{{ key.replace(/([A-Z])/g, ' $1') }}</span><span class="font-mono text-lg font-semibold text-slate-800 dark:text-blue-300">{{ value }}</span></div></div></div>
          <div class="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row">
            <div class="flex items-center gap-2"><button :disabled="['reviewed', 'approved'].includes(viewingReport.status)" class="rounded-xl border border-sky-300 px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-950/50" @click="updateStatus(viewingReport.id, 'reviewed')">កត់សម្គាល់បានពិនិត្យ</button><button :disabled="viewingReport.status === 'approved'" class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50" @click="updateStatus(viewingReport.id, 'approved')"><Check class="h-4 w-4" />អនុម័តរបាយការណ៍</button></div>
            <button class="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300" @click="viewingReport = null">បិទផ្ទាំង</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
