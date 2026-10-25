<script lang="jsx">
import { defineComponent, Teleport } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import { notify } from '../../stores/toasts';
import {
  FileText,
  Briefcase,
  DollarSign,
  FileCheck,
  Send,
  Clock,
  CheckCircle2,
  Download,
  X
} from "lucide-vue-next";
const EmployeeDocumentRequestView = ({
  currentUser,
  documentRequests,
  onSubmitDocumentRequest,

}) => {
  const [selectedType, setSelectedType] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const myDocRequests = documentRequests.filter(
    (d) => (d.userId || d.employeeId) === currentUser.id
  );
  const handleOpenModal = (type) => {
    setSelectedType(type);
    setPurpose(
      type === "employment_letter" ? "សម្រាប់ដាក់ពាក្យស្នើសុំទិដ្ឋាការ ឬបើកគណនីធនាគារ" : type === "salary_certificate" ? "សម្រាប់ដាក់ពាក្យស្នើសុំកម្ចីទិញម៉ូតូ ឬកម្ចីលំនៅឋាន" : "សម្រាប់បញ្ជាក់កាលបរិច្ឆេទ និងបទពិសោធន៍ការងារទូទៅ"
    );
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedType) return;
    onSubmitDocumentRequest({
      userId: currentUser.id,
      userNameKh: currentUser.nameKh,
      userNameEn: currentUser.nameEn,
      type: selectedType,
      purpose,
      status: "pending",
      requestDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setSelectedType(null);
    setPurpose("");
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 4e3);
  };
  return <div class="space-y-6 animate-in fade-in duration-200">
      {
    /* Header */
  }
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white ">
            {"ស្នើសុំឯកសារផ្លូវការ"}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {"ជ្រើសរើសប្រភេទលិខិតផ្លូវការដែលអ្នកត្រូវការដើម្បីបញ្ជូនទៅផ្នែករដ្ឋបាល"}
          </p>
        </div>
      </div>

      {submittedSuccess && <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p class="font-bold">
              {"សំណើសុំឯកសាររបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ!"}
            </p>
            <p class="text-xs text-emerald-600 dark:text-emerald-400">
              {"ផ្នែកធនធានមនុស្សនឹងពិនិត្យ និងចេញលិខិតផ្លូវការជូនក្នុងរយៈពេល ១-២ ថ្ងៃនៃថ្ងៃធ្វើការ។"}
            </p>
          </div>
        </div>}

      {
    /* 3 Main Document Request Options as requested: Employment Letter, Salary Certificate, Confirmation Letter */
  }
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {
    /* 1. Employment Letter */
  }
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-sky-500 transition-all flex flex-col justify-between group">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase class="w-6 h-6" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white  mb-2">
              {"១. លិខិតបញ្ជាក់ការងារ"}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {"បញ្ជាក់អំពីមុខតំណែង បទពិសោធន៍ការងារ និងស្ថានភាពជាបុគ្គលិកពេញសិទ្ធិរបស់ក្រុមហ៊ុន។"}
            </p>
          </div>

          <button
    onClick={() => handleOpenModal("employment_letter")}
    class="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
  >
            <Send class="w-3.5 h-3.5" />
            <span>{"ស្នើសុំលិខិតនេះ"}</span>
          </button>
        </div>

        {
    /* 2. Salary Certificate */
  }
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between group">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign class="w-6 h-6" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white  mb-2">
              {"២. លិខិតបញ្ជាក់ប្រាក់បៀវត្ស"}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {"បញ្ជាក់អំពីកម្រិតប្រាក់បៀវត្សគោល ប្រាក់ថែមម៉ោង និងចំណូលប្រចាំខែផ្លូវការ សម្រាប់កម្ចីធនាគារ។"}
            </p>
          </div>

          <button
    onClick={() => handleOpenModal("salary_certificate")}
    class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
  >
            <Send class="w-3.5 h-3.5" />
            <span>{"ស្នើសុំលិខិតនេះ"}</span>
          </button>
        </div>

        {
    /* 3. Confirmation Letter */
  }
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-purple-500 transition-all flex flex-col justify-between group">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCheck class="w-6 h-6" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white  mb-2">
              {"៣. លិខិតបញ្ជាក់ទូទៅ"}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {"លិខិតបញ្ជាក់ទូទៅសម្រាប់ស្ថាប័នរដ្ឋ ការបណ្តុះបណ្តាល ឬការបំពេញបែបបទផ្សេងៗ។"}
            </p>
          </div>

          <button
    onClick={() => handleOpenModal("confirmation_letter")}
    class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
  >
            <Send class="w-3.5 h-3.5" />
            <span>{"ស្នើសុំលិខិតនេះ"}</span>
          </button>
        </div>
      </div>

      {
    /* My Requested Documents Status Table */
  }
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-800 dark:text-white ">
            {"ស្ថានភាពឯកសារដែលបានស្នើសុំ"}
          </h2>
          <span class="text-xs text-slate-400 font-mono">សរុប៖ {myDocRequests.length}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th class="py-3.5 px-4">{"លេខកូដ"}</th>
                <th class="py-3.5 px-4">{"ប្រភេទលិខិត"}</th>
                <th class="py-3.5 px-4">{"គោលបំណង"}</th>
                <th class="py-3.5 px-4">{"កាលបរិច្ឆេទ"}</th>
                <th class="py-3.5 px-4">{"ស្ថានភាព"}</th>
                <th class="py-3.5 px-4 text-right">{"ទាញយក"}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {myDocRequests.length === 0 ? <tr>
                  <td colSpan={6} class="py-8 text-center text-slate-400">
                    {"អ្នកមិនទាន់បានស្នើសុំឯកសារណាមួយនៅឡើយទេ"}
                  </td>
                </tr> : myDocRequests.map((doc) => <tr key={doc.id} class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td class="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {doc.id}
                    </td>
                    <td class="py-3.5 px-4 font-semibold text-sky-600">
                      {(doc.documentType || doc.type) === "employment_letter" ? "លិខិតបញ្ជាក់ការងារ" : (doc.documentType || doc.type) === "salary_certificate" ? "លិខិតបញ្ជាក់ប្រាក់បៀវត្ស" : "លិខិតបញ្ជាក់ទូទៅ"}
                    </td>
                    <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {doc.purpose}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-400">{doc.requestDate}</td>
                    <td class="py-3.5 px-4">
                      <span
    class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${doc.status === "approved" || doc.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
  >
                        {doc.status === "approved" || doc.status === "completed" ? <>
                            <CheckCircle2 class="w-3 h-3" />
                            <span>{"បានអនុម័តរួចរាល់"}</span>
                          </> : <>
                            <Clock class="w-3 h-3" />
                            <span>{"រង់ចាំពិនិត្យ"}</span>
                          </>}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      {doc.status === "approved" || doc.status === "completed" ? <button
    onClick={() => notify("កំពុងទាញយកឯកសារ…")}
    class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 text-emerald-600 inline-flex items-center gap-1"
  >
                          <Download class="w-3.5 h-3.5" />
                          <span class="text-xs font-bold">{"ទាញយក"}</span>
                        </button> : <span class="text-xs text-slate-400 italic">
                          {"កំពុងរង់ចាំ"}
                        </span>}
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* SUBMISSION MODAL */
  }
      {selectedType && <Teleport to="body"><div class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div class="modal-surface relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-slate-800 dark:text-slate-100">
            <button
    onClick={() => setSelectedType(null)}
    class="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
  >
              <X class="w-5 h-5" />
            </button>

            <div class="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center mb-3">
              <FileText class="w-6 h-6" />
            </div>

            <h3 class="text-lg font-bold text-slate-800 dark:text-white  mb-1">
              {"បញ្ជាក់សំណើសុំឯកសារ"}
            </h3>
            <p class="text-xs text-sky-600 font-bold mb-4 uppercase">
              {selectedType === "employment_letter" ? "លិខិតបញ្ជាក់ការងារ" : selectedType === "salary_certificate" ? "លិខិតបញ្ជាក់ប្រាក់បៀវត្ស" : "លិខិតបញ្ជាក់ទូទៅ"}
            </p>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-bold mb-1">
                  {"គោលបំណងនៃការស្នើសុំ"}
                </label>
                <textarea
    rows={3}
    required
    value={purpose}
    onChange={(e) => setPurpose(e.target.value)}
    class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
  />
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button
    type="button"
    onClick={() => setSelectedType(null)}
    class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600"
  >
                  {"បោះបង់"}
                </button>
                <button
    type="submit"
    class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
  >
                  <Send class="w-3.5 h-3.5" />
                  <span>{"បញ្ជូនសំណើ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div></Teleport>}
    </div>;
};
export default defineComponent({
  name: "EmployeeDocumentRequestView",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(EmployeeDocumentRequestView, () => attrs);
  }
});
</script>
