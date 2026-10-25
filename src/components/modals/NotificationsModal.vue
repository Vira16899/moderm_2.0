<script lang="jsx">
import { labels } from "../../data/labels";
import { defineComponent, Teleport } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import { Bell, CheckCheck, X, AlertTriangle, Info, CheckCircle, Trash2 } from "lucide-vue-next";
import { translations } from "../../i18n/translations";
const NotificationsModal = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onToggleRead,
  onDeleteNotification,

}) => {
  const [filterCat, setFilterCat] = useState("all");
  const t = translations;
  if (!isOpen) return null;
  const filtered = notifications.filter((n) => {
    if (filterCat === "all") return true;
    return n.category === filterCat;
  });
  const getSeverityIcon = (sev) => {
    switch (sev) {
      case "high":
        return <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0" />;
      case "medium":
        return <Info class="w-4 h-4 text-amber-500 shrink-0" />;
      case "low":
      default:
        return <CheckCircle class="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };
  return <Teleport to="body"><div class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
    id="notification-center-modal"
    class="modal-surface relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
  >
        {
    /* Modal Header */
  }
        <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Bell class="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <h3 class="font-bold text-sm tracking-tight ">
              {t.notifications} ({notifications.length})
            </h3>
          </div>
          <button
    onClick={onClose}
    class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    title={t.cancel}
  >
            <X class="w-4 h-4" />
          </button>
        </div>

        {
    /* Filter bar and quick actions */
  }
        <div class="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <select class="filter-select" aria-label="ប្រភេទការជូនដំណឹង" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            {["all", "system", "esg", "production", "finance", "staff"].map((cat) => <option key={cat} value={cat}>{labels[cat]}</option>)}
          </select>

          <button
    onClick={onMarkAllAsRead}
    class="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
  >
            <CheckCheck class="w-3.5 h-3.5" />
            <span>{t.markAllRead}</span>
          </button>
        </div>

        {
    /* Notifications list */
  }
        <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? <div class="py-12 text-center text-slate-400 dark:text-slate-500">
              <Bell class="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p class="text-xs font-medium">{t.noNotifications}</p>
            </div> : filtered.map((item) => <div
    key={item.id}
    class={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${item.read ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400" : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs"}`}
  >
                <div class="mt-0.5">{getSeverityIcon(item.severity)}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <h4 class="text-xs font-semibold text-slate-900 dark:text-white truncate ">
                      {item.titleKh}
                    </h4>
                    <span class="text-xs text-slate-400 shrink-0 font-mono">{item.timestamp}</span>
                  </div>
                  <p class="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed ">
                    {item.messageKh}
                  </p>
                  <div class="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                    <div class="flex items-center gap-2.5">
                      <button
    onClick={() => onToggleRead(item.id)}
    class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
  >
                        {item.read ? "មិនទាន់អាន" : "បានអាន"}
                      </button>
                      <button
    onClick={() => onDeleteNotification(item.id)}
    class="danger-link transition-colors"
    title="លុប"
  >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>)}
        </div>

        {
    /* Modal Footer */
  }
        <div class="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
    onClick={onClose}
    class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold transition-colors"
  >
            {t.confirm}
          </button>
        </div>
      </div>
    </div></Teleport>;
};
export default defineComponent({
  name: "NotificationsModal",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(NotificationsModal, () => attrs);
  }
});
</script>
