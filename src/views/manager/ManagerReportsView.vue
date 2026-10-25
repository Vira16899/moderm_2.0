<script lang="jsx">
import { labels } from "../../data/labels";
import { defineComponent, Teleport } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import {
  FileText,
  Plus,
  Send,
  Calendar,
  Users,
  Clock,
  History,
  BarChart3,
  X
} from "lucide-vue-next";
const ManagerReportsView = ({
  currentUser,
  reports,
  onCreateReport,

}) => {
  const [activeTab, setActiveTab] = useState("attendance");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "attendance",
    titleKh: "",
    titleEn: "",
    summaryKh: "",
    summaryEn: "",
    presentRate: "98%",
    totalStaff: "35",
    notes: ""
  });
  const myReports = reports.filter(
    (r) => r.managerId === currentUser.id || r.departmentKh === currentUser.departmentKh
  );
  const displayReports = myReports.length > 0 ? myReports : reports;
  const handleSubmitNewReport = (e) => {
    e.preventDefault();
    onCreateReport({
      managerId: currentUser.id,
      managerNameKh: currentUser.nameKh,
      managerNameEn: currentUser.nameEn,
      departmentKh: currentUser.departmentKh,
      departmentEn: currentUser.departmentEn,
      titleKh: formData.titleKh,
      titleEn: formData.titleEn,
      type: formData.type,
      submissionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      status: "submitted",
      summaryKh: formData.summaryKh,
      summaryEn: formData.summaryEn,
      metrics: {
        presentRate: formData.presentRate,
        totalEmployees: formData.totalStaff,
        notes: formData.notes
      }
    });
    setIsCreateModalOpen(false);
    setActiveTab("history");
  };
  return <div class="space-y-6 animate-in fade-in duration-200">
      {
    /* Header */
  }
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white ">
            {"របាយការណ៍គ្រប់គ្រង"}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {"របាយការណ៍វត្តមាន ច្បាប់ បុគ្គលិក បង្កើតរបាយការណ៍ បញ្ជូនទៅកាន់ Admin និងប្រវត្តិ"}
          </p>
        </div>

        <button
    onClick={() => {
      setFormData({
        type: "attendance",
        titleKh: `របាយការណ៍ប្រតិបត្តិការ ${currentUser.departmentKh} ប្រចាំខែថ្មី`,
        titleEn: `Operational Performance Report - ${currentUser.departmentEn}`,
        summaryKh: `សេចក្តីរាយការណ៍អំពីទិន្នផលការងារ អត្រាវត្តមាន ៩៨% និងការសម្រេចគោលដៅផលិតកម្ម។`,
        summaryEn: `Monthly departmental summary report recording 98% attendance and meeting line production targets.`,
        presentRate: "98%",
        totalStaff: "35",
        notes: "No safety incidents recorded."
      });
      setIsCreateModalOpen(true);
    }}
    class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
  >
          <Plus class="w-4 h-4" />
          <span>{"បង្កើត និងបញ្ជូនរបាយការណ៍"}</span>
        </button>
      </div>

      {
    /* Tabs as specified: Attendance Report, Leave Report, Employee Report, Report History */
  }
      <select class="filter-select" aria-label="ជ្រើសរើសប្រភេទ" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
            <option value="attendance">{"របាយការណ៍វត្តមាន"}</option>
            <option value="leave">{"របាយការណ៍ច្បាប់"}</option>
            <option value="employee">{"របាយការណ៍បុគ្គលិក"}</option>
            <option value="history">{"ប្រវត្តិរបាយការណ៍"}</option>
          </select>

      {
    /* 1. ATTENDANCE REPORT TAB */
  }
      {activeTab === "attendance" && <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"អត្រាវត្តមានមធ្យម"}
              </span>
              <div class="text-3xl font-semibold text-emerald-600 font-mono">98.4%</div>
              <span class="text-xs text-emerald-600 font-semibold">+1.2% {"ធៀបខែមុន"}</span>
            </div>
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"ម៉ោងថែមម៉ោងសរុប"}
              </span>
              <div class="text-3xl font-semibold text-amber-600 font-mono">២៤៨ ម៉ោង</div>
              <span class="text-xs text-slate-400">{"ស្របតាមច្បាប់ការងារ"}</span>
            </div>
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"អត្រាមកទាន់ពេល"}
              </span>
              <div class="text-3xl font-semibold text-sky-600 font-mono">96.8%</div>
              <span class="text-xs text-slate-400">{"គិតត្រឹមម៉ោង 7:30 ព្រឹក"}</span>
            </div>
          </div>

          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 class="text-base font-bold text-slate-800 dark:text-white  mb-3">
              {"ស្ថិតិវត្តមានតាមខ្សែសង្វាក់ផលិតកម្ម"}
            </h3>
            <div class="space-y-3">
              {[
    { line: "ខ្សែ A - ដេរល្បឿនលឿន", present: 99, ot: "៤២ ម៉ោង", status: "Optimal" },
    { line: "ខ្សែ B - កអាវ និងដៃអាវ", present: 97, ot: "៣៦ ម៉ោង", status: "Good" },
    { line: "ខ្សែ C - ត្រួតពិនិត្យគុណភាព", present: 100, ot: "២៨ ម៉ោង", status: "Excellent" }
  ].map((item, idx) => <div key={idx} class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-xs text-slate-800 dark:text-white">{item.line}</h4>
                    <span class="text-xs text-slate-400">OT: {item.ot}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-mono font-bold text-emerald-600">{item.present}% វត្តមាន</span>
                    <span class="block text-xs text-slate-400">{labels[item.status] || item.status}</span>
                  </div>
                </div>)}
            </div>
          </div>
        </div>}

      {
    /* 2. LEAVE REPORT TAB */
  }
      {activeTab === "leave" && <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"ច្បាប់ប្រចាំឆ្នាំបានប្រើ"}
              </span>
              <div class="text-3xl font-semibold text-amber-600 font-mono">១៨ ថ្ងៃ</div>
              <span class="text-xs text-slate-400">{"ក្នុងខែនេះ"}</span>
            </div>
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"ច្បាប់ឈឺ"}
              </span>
              <div class="text-3xl font-semibold text-blue-600 font-mono">៥ ថ្ងៃ</div>
              <span class="text-xs text-slate-400">{"មានវេជ្ជបញ្ជាត្រឹមត្រូវ"}</span>
            </div>
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"ច្បាប់មិនមានការអនុញ្ញាត"}
              </span>
              <div class="text-3xl font-semibold text-rose-600 font-mono">0</div>
              <span class="text-xs text-emerald-600 font-semibold">{"វិន័យល្អឥតខ្ចោះ"}</span>
            </div>
          </div>
        </div>}

      {
    /* 3. EMPLOYEE REPORT TAB */
  }
      {activeTab === "employee" && <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"កម្លាំងពលកម្មសរុប"}
              </span>
              <div class="text-3xl font-semibold text-slate-800 dark:text-white font-mono">35</div>
              <span class="text-xs text-slate-400">100% {"កូតាពេញលេញ"}</span>
            </div>
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"បុគ្គលិកសាកល្បង"}
              </span>
              <div class="text-3xl font-semibold text-amber-600 font-mono">3</div>
              <span class="text-xs text-slate-400">{"ត្រូវវាយតម្លៃចុងខែ"}</span>
            </div>
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span class="text-xs text-slate-400 font-bold block mb-1">
                {"អត្រារក្សាបុគ្គលិក"}
              </span>
              <div class="text-3xl font-semibold text-emerald-600 font-mono">99.2%</div>
              <span class="text-xs text-emerald-600 font-semibold">{"ខ្ពស់ជាងស្តង់ដាររោងចក្រ"}</span>
            </div>
          </div>
        </div>}

      {
    /* 4. REPORT HISTORY TAB (Report History) */
  }
      {activeTab === "history" && <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {displayReports.length === 0 ? <div class="p-8 text-center text-slate-400">
              {"មិនទាន់មានប្រវត្តិរបាយការណ៍ទេ"}
            </div> : displayReports.map((report) => <div key={report.id} class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {report.id}
                    </span>
                    <span class="text-xs font-bold uppercase px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {labels[report.type || report.reportType] || labels.report}
                    </span>
                    <span
    class={`text-xs font-bold px-2.5 py-0.5 rounded-full ${report.status === "approved" ? "bg-emerald-100 text-emerald-800" : report.status === "reviewed" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}
  >
                      {labels[report.status]}
                    </span>
                  </div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white ">
                    {report.titleKh}
                  </h4>
                  <p class="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {report.summaryKh}
                  </p>
                </div>

                <div class="text-right shrink-0">
                  <span class="text-xs font-mono text-slate-400 block">{report.submissionDate}</span>
                  <span class="text-xs font-bold text-slate-800 dark:text-blue-300">
                    {report.departmentKh}
                  </span>
                </div>
              </div>)}
        </div>}

      {
    /* CREATE & SUBMIT REPORT MODAL (Create Report & Submit Report) */
  }
      {isCreateModalOpen && <Teleport to="body"><div class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div class="modal-surface relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
    onClick={() => setIsCreateModalOpen(false)}
    class="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
  >
              <X class="w-5 h-5" />
            </button>

            <div class="flex items-center gap-2 mb-2">
              <span class="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                <FileText class="w-5 h-5" />
              </span>
              <div>
                <h3 class="text-lg font-bold text-slate-800 dark:text-white ">
                  {"បង្កើត និងបញ្ជូនរបាយការណ៍ទៅកាន់ Admin"}
                </h3>
                <p class="text-xs text-slate-400">
                  {currentUser.departmentKh}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitNewReport} class="space-y-4 mt-4">
              <div>
                <label class="block text-xs font-bold mb-1">
                  {"ប្រភេទរបាយការណ៍"}
                </label>
                <select
    value={formData.type}
    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
    class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold"
  >
                  <option value="attendance">{"របាយការណ៍វត្តមាន"}</option>
                  <option value="leave">{"របាយការណ៍ច្បាប់"}</option>
                  <option value="weekly">{"របាយការណ៍ប្រចាំសប្តាហ៍"}</option>
                  <option value="monthly">{"របាយការណ៍ប្រចាំខែ"}</option>
                  <option value="incident">{"របាយការណ៍ឧបទ្ទវហេតុ/បច្ចេកទេស"}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold mb-1">
                  {"ចំណងជើងរបាយការណ៍ (ខ្មែរ)"}
                </label>
                <input
    type="text"
    required
    value={formData.titleKh}
    onChange={(e) => setFormData({ ...formData, titleKh: e.target.value })}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs"
  />
              </div>

              <div>
                <label class="block text-xs font-bold mb-1">
                  {"ចំណងជើងរបាយការណ៍"}
                </label>
                <input
    type="text"
    required
    value={formData.titleEn}
    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs"
  />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold mb-1">
                    {"អត្រាវត្តមាន"}
                  </label>
                  <input
    type="text"
    value={formData.presentRate}
    onChange={(e) => setFormData({ ...formData, presentRate: e.target.value })}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs font-mono"
  />
                </div>
                <div>
                  <label class="block text-xs font-bold mb-1">
                    {"ចំនួនបុគ្គលិកសរុប"}
                  </label>
                  <input
    type="text"
    value={formData.totalStaff}
    onChange={(e) => setFormData({ ...formData, totalStaff: e.target.value })}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs font-mono"
  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold mb-1">
                  {"សេចក្តីសង្ខេបរបាយការណ៍ (ខ្មែរ)"}
                </label>
                <textarea
    rows={3}
    required
    value={formData.summaryKh}
    onChange={(e) => setFormData({ ...formData, summaryKh: e.target.value })}
    class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs"
  />
              </div>

              <div>
                <label class="block text-xs font-bold mb-1">
                  {"សេចក្តីសង្ខេបរបាយការណ៍"}
                </label>
                <textarea
    rows={2}
    required
    value={formData.summaryEn}
    onChange={(e) => setFormData({ ...formData, summaryEn: e.target.value })}
    class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs"
  />
              </div>

              <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
    type="button"
    onClick={() => setIsCreateModalOpen(false)}
    class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600"
  >
                  {"បោះបង់"}
                </button>
                <button
    type="submit"
    class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
  >
                  <Send class="w-3.5 h-3.5" />
                  <span>{"បញ្ជូនរបាយការណ៍"}</span>
                </button>
              </div>
            </form>
          </div>
        </div></Teleport>}
    </div>;
};
export default defineComponent({
  name: "ManagerReportsView",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(ManagerReportsView, () => attrs);
  }
});
</script>
