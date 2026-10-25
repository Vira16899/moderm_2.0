<script lang="jsx">
import { defineComponent, onMounted, ref } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import { employeeApi } from "../../api/employeeApi";
import { leaveHistory } from "../../api/employeeData";
import { RouterLink } from "vue-router";
import {
  Ban,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Search,
} from "lucide-vue-next";

// ISO timestamps represent instants. Display in Cambodia's calendar date.
// YYYY-MM-DD values represent calendar dates and should not shift timezone.
function dateOnly(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function displayDate(value) {
  const iso = dateOnly(value);
  if (!iso) return "—";
  return new Intl.DateTimeFormat("km-KH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}
function dayCount(start, end) {
  const a = dateOnly(start),
    b = dateOnly(end);
  if (!a || !b) return null;
  const diff =
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000;
  return Number.isFinite(diff) && diff >= 0 ? Math.round(diff) : null;
}
const leaveTypes = {
  ANNUAL: "ច្បាប់ប្រចាំឆ្នាំ",
  SICK: "ច្បាប់ឈឺ",
  CASUAL: "ច្បាប់ផ្ទាល់ខ្លួន",
  MATERNITY: "ច្បាប់សម្រាលកូន",
  MARRIAGE: "ច្បាប់អាពាហ៍ពិពាហ៍",
};
const documentTypes = {
  employment_letter: "លិខិតបញ្ជាក់ការងារ",
  salary_certificate: "លិខិតបញ្ជាក់ប្រាក់បៀវត្ស",
  confirmation_letter: "លិខិតបញ្ជាក់ទូទៅ",
};
const statusLabels = {
  pending: "កំពុងរង់ចាំ",
  approved: "បានអនុម័ត",
  rejected: "បានបដិសេធ",
  completed: "បានបញ្ចប់",
  cancelled: "បានលុបចោល",
};
const statusColors = {
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  approved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  completed: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  cancelled:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const statuses = [
  "all",
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];
function normalizeLeave(raw) {
  const start = raw.startDate ?? raw.start_date;
  const end = raw.endDate ?? raw.end_date;
  const type = String(raw.leaveType ?? raw.leave_type ?? "")
    .toUpperCase()
    .replace(/ LEAVE$/, "");
  const daysValue =
    raw.totalDays ?? raw.total_days ?? raw.daysCount ?? raw.days_count;
  const days =
    daysValue !== "" && daysValue != null && Number.isFinite(Number(daysValue))
      ? Number(daysValue)
      : dayCount(start, end);
  return {
    id: raw.id ?? raw.leave_id ?? raw.request_id ?? null,
    category: "leave",
    title: leaveTypes[type] || type || "ច្បាប់ឈប់សម្រាក",
    type,
    start,
    end,
    days,
    detail: raw.reason ?? "",
    date:
      raw.appliedDate ??
      raw.applied_date ??
      raw.requestDate ??
      raw.created_at ??
      "",
    status: String(raw.status ?? "unknown")
      .trim()
      .toLowerCase(),
    rejectionReason: raw.rejectionReason ?? raw.rejection_reason ?? "",
  };
}
function normalizeDocument(raw) {
  const type = raw.documentType ?? raw.document_type ?? raw.type ?? "";
  return {
    id: raw.id ?? raw.document_id ?? raw.request_id ?? null,
    category: "document",
    title: documentTypes[type] || type || "ឯកសារផ្លូវការ",
    detail: raw.purpose ?? "",
    date: raw.requestDate ?? raw.request_date ?? raw.created_at ?? "",
    status: String(raw.status ?? "unknown")
      .trim()
      .toLowerCase(),
    rejectionReason: raw.rejectionReason ?? raw.rejection_reason ?? "",
  };
}

const EmployeeMyRequestsView = ({
  leaveRequests = [],
  documentRequests = [],
  loadingLeave = false,
  leaveError = "",
  onRefreshLeave,
}) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const allRequests = [
    ...leaveRequests.map(normalizeLeave),
    ...documentRequests.map(normalizeDocument),
  ];
  const counts = {};
  allRequests.forEach((request) => {
    counts[request.status] = (counts[request.status] ?? 0) + 1;
  });
  const filteredByTab =
    activeTab === "all"
      ? allRequests
      : allRequests.filter((request) => request.status === activeTab);
  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? filteredByTab.filter((request) =>
        [request.id, request.title, request.detail].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term),
        ),
      )
    : filteredByTab;
  return (
    <div class="space-y-6 animate-in fade-in duration-200">
      <RouterLink class="ess-link" to="/employee/leave-request">
        មើលប្រវត្តិ កែប្រែ ឬលុបចោលសំណើសុំច្បាប់
      </RouterLink>
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white ">
            {"សំណើទាំងអស់របស់ខ្ញុំ"}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {"តាមដានដំណើរការសំណើ៖ កំពុងរង់ចាំ បានអនុម័ត បានបដិសេធ និងរួចរាល់"}
          </p>
        </div>
        
      </div>

      {leaveError && (
        <div
          role="alert"
          class="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs"
        >
          មិនអាចផ្ទៀងផ្ទាត់ Leave History ពី API បានទេ៖ {leaveError}។
          ចំនួនសំណើអាចមិនទាន់ពេញលេញ។
        </div>
      )}
      {loadingLeave && (
        <p class="text-xs text-sky-600" role="status">
          កំពុងទាញប្រវត្តិសុំច្បាប់...
        </p>
      )}

      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <select
          class="filter-select w-full sm:w-auto text-xs"
          aria-label="ស្ថានភាពសំណើ"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status] ?? "ទាំងអស់"} (
              {counts[status] ?? allRequests.length})
            </option>
          ))}
        </select>
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកលេខសំណើ ឬមូលហេតុ..."
            class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </div>

      <div class="space-y-2">
        {filtered.length === 0 ? (
          <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-10 text-center">
            <FileText class="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p class="text-sm text-slate-500">
              {loadingLeave
                ? "កំពុងទាញទិន្នន័យ..."
                : leaveError
                  ? "Leave API មិនអាចផ្ទៀងផ្ទាត់បាន"
                  : "មិនមានសំណើសម្រាប់ការស្វែងរកនេះ"}
            </p>
          </div>
        ) : (
          filtered.map((request, index) => {
            const StatusIcon =
              request.status === "pending"
                ? Clock
                : ["approved", "completed"].includes(request.status)
                  ? CheckCircle2
                  : request.status === "rejected"
                    ? XCircle
                    : Ban;
            return (
              <div
                key={`${request.category}-${request.id ?? index}`}
                class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-2 min-w-0">
                    <span
                      class={`w-7 h-7 rounded-lg flex items-center justify-center ${request.category === "leave" ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"}`}
                    >
                      {request.category === "leave" ? (
                        <Calendar class="w-4 h-4" />
                      ) : (
                        <FileText class="w-4 h-4" />
                      )}
                    </span>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                      {request.title || "សំណើ"}
                    </h3>
                    <span class="text-xs text-slate-400 font-mono">
                      #{request.id ?? "—"}
                    </span>
                    <span
                      class={`inline-flex gap-1 items-center rounded-full px-2 py-1 text-[11px] font-semibold ${statusColors[request.status] ?? statusColors.cancelled}`}
                    >
                      <StatusIcon class="w-3 h-3" />{" "}
                      {statusLabels[request.status] ?? request.status}
                    </span>
                  </div>
                  <span class="text-xs text-slate-400">
                    ដាក់សំណើ៖ {displayDate(request.date)}
                  </span>
                </div>
                <div class="mt-2 pl-0 sm:pl-9 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {request.category === "leave" && (
                    <span class="inline-flex items-center gap-1.5">
                      <Calendar class="w-3.5 h-3.5 text-slate-400" />
                      {displayDate(request.start)} → {displayDate(request.end)}
                      {request.days != null && (
                        <span class="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                          {request.days} ថ្ងៃ
                        </span>
                      )}
                    </span>
                  )}
                  <span class="min-w-0 break-words">
                    <strong class="font-semibold">មូលហេតុ៖</strong>{" "}
                    {request.detail || "—"}
                  </span>
                </div>
                {request.rejectionReason && (
                  <div class="mt-2 sm:pl-9 text-xs text-rose-600 dark:text-rose-400">
                    មូលហេតុបដិសេធ៖ {request.rejectionReason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default defineComponent({
  name: "EmployeeMyRequestsView",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    const leavesFromApi = ref([]);
    const hasLoadedLeaves = ref(false);
    const loadingLeave = ref(false);
    const leaveError = ref("");
    async function loadLeaveHistory() {
      loadingLeave.value = true;
      leaveError.value = "";
      try {
        const payload = await employeeApi.getLeaveHistory();
        if (payload?.result === false)
          throw new Error(payload.msg || "API request failed");
        // Only replace parent data when a recognizable array was returned.
        const candidates = [payload, payload?.data, payload?.data?.data];
        const valid = candidates.some(
          (v) =>
            Array.isArray(v) ||
            [
              "leaveRequests",
              "leave_requests",
              "requests",
              "history",
              "leaves",
              "results",
              "items",
            ].some((key) => Array.isArray(v?.[key])),
        );
        if (!valid) throw new Error("Unknown Leave History response shape");
        leavesFromApi.value = leaveHistory(payload);
        hasLoadedLeaves.value = true;
      } catch (error) {
        console.error("My Requests Leave API:", error);
        leaveError.value = error?.message || "Unknown error";
      } finally {
        loadingLeave.value = false;
      }
    }
    onMounted(loadLeaveHistory);
    return createCompatRender(EmployeeMyRequestsView, () => ({
      ...attrs,
      leaveRequests: hasLoadedLeaves.value
        ? leavesFromApi.value
        : (attrs.leaveRequests ?? []),
      documentRequests: attrs.documentRequests ?? [],
      loadingLeave: loadingLeave.value,
      leaveError: leaveError.value,
      onRefreshLeave: loadLeaveHistory,
    }));
  },
});
</script>
