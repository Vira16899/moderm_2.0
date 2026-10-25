<script lang="jsx">
import { labels } from "../../data/labels";
import { defineComponent } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  ArrowRight
} from "lucide-vue-next";
const NotificationsView = ({
  notifications,
  onMarkAllAsRead,
  onToggleRead,
  onDeleteNotification,
  onNavigateSection,

}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const filtered = notifications.filter((n) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (n.titleKh || "").toLowerCase().includes(term) || (n.titleEn || "").toLowerCase().includes(term) || (n.messageKh || "").toLowerCase().includes(term) || (n.messageEn || "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || statusFilter === "unread" && !n.read || statusFilter === "read" && n.read;
    const matchesCategory = categoryFilter === "all" || n.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const unreadCount = notifications.filter((n) => !n.read).length;
  return <div class="space-y-6 animate-in fade-in duration-200">
      {
    /* Header */
  }
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white ">
            {"ការជូនដំណឹង"}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {`អ្នកមានការជូនដំណឹងមិនទាន់អានចំនួន ${unreadCount} ក្នុងចំណោមសរុប ${notifications.length}`}
          </p>
        </div>

        {unreadCount > 0 && <button
    onClick={onMarkAllAsRead}
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white hover:bg-[#002235] text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
  >
            <CheckCheck class="w-4 h-4 text-[#b2e9ff]" />
            <span>{"សម្គាល់ថាបានអានទាំងអស់"}</span>
          </button>}
      </div>

      {
    /* Filters Bar */
  }
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
    type="text"
    placeholder={"ស្វែងរកការជូនដំណឹង..."}
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    class="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#001726] border border-slate-200 dark:border-[#b2e9ff]/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003049]"
  />
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {
    /* Status filter */
  }
          <select class="filter-select" aria-label="ស្ថានភាព" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{"ទាំងអស់"}</option>
            <option value="unread">{`មិនទាន់អាន (${unreadCount})`}</option>
            <option value="read">{"បានអាន"}</option>
          </select>

          {
    /* Category filter */
  }
          <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    class="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#001726] border border-slate-200 dark:border-[#b2e9ff]/30 text-slate-800 dark:text-white font-medium focus:outline-none"
  >
            <option value="all">{"គ្រប់ប្រភេទ"}</option>
            <option value="leave">{"ច្បាប់ឈប់សម្រាក"}</option>
            <option value="document">{"ឯកសារ"}</option>
            <option value="report">{"របាយការណ៍"}</option>
            <option value="salary">{"ប្រាក់ខែ"}</option>
            <option value="system">{"ប្រព័ន្ធ"}</option>
          </select>
        </div>
      </div>

      {
    /* Notifications List */
  }
      <div class="space-y-3">
        {filtered.length === 0 ? <div class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Bell class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 class="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
              {"គ្មានការជូនដំណឹងត្រូវនឹងតម្រងទេ"}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {"សូមសាកល្បងផ្លាស់ប្តូរតម្រង ឬពាក្យស្វែងរក"}
            </p>
          </div> : filtered.map((notif) => {
    const isUnread = !notif.read;
    return <div
      key={notif.id}
      class={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isUnread ? "bg-[#eef9ff] dark:bg-blue-700/40 border-[#b2e9ff]/60 shadow-sm ring-1 ring-[#b2e9ff]/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}
    >
                <div class="flex items-start gap-3.5 flex-1">
                  <div
      class={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.severity === "high" ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : notif.severity === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"}`}
    >
                    {notif.severity === "high" ? <AlertTriangle class="w-4 h-4" /> : notif.severity === "medium" ? <Info class="w-4 h-4" /> : <CheckCircle2 class="w-4 h-4" />}
                  </div>

                  <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4
      class={`text-sm  ${isUnread ? "font-bold text-slate-800 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300"}`}
    >
                        {notif.titleKh}
                      </h4>
                      {isUnread && <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                          NEW
                        </span>}
                      <span class="text-xs uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-black/30 text-slate-500 dark:text-slate-400">
                        {labels[notif.category] || labels.system}
                      </span>
                    </div>

                    <p class="text-xs text-slate-600 dark:text-slate-300 ">
                      {notif.messageKh}
                    </p>

                    <div class="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 pt-0.5">
                      <Calendar class="w-3 h-3" />
                      <span>{notif.timestamp || notif.time || "Recent"}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {notif.linkSection && onNavigateSection && <button
      onClick={() => onNavigateSection(notif.linkSection)}
      class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-blue-300 bg-[#b2e9ff]/20 hover:bg-[#b2e9ff]/30 transition-colors flex items-center gap-1.5"
    >
                      <span>{"ទៅកាន់ទំព័រ"}</span>
                      <ArrowRight class="w-3.5 h-3.5" />
                    </button>}

                  <button
      onClick={() => onToggleRead(notif.id)}
      class="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs"
      title={isUnread ? "សម្គាល់ថាបានអាន" : "សម្គាល់ថាមិនទាន់អាន"}
    >
                    <CheckCircle2 class={`w-4 h-4 ${!isUnread ? "text-emerald-500" : ""}`} />
                  </button>

                  <button
      onClick={() => onDeleteNotification(notif.id)}
      class="danger-link p-2 rounded-lg transition-colors"
      title="លុបការជូនដំណឹង"
    >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>;
  })}
      </div>
    </div>;
};
export default defineComponent({
  name: "NotificationsView",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(NotificationsView, () => attrs);
  }
});
</script>
