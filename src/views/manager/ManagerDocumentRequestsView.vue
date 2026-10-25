<script lang="jsx">
import { defineComponent, Teleport } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import {
  FileText,
  Search,
  Eye,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  History,
  FileCheck,
} from "lucide-vue-next";
const ManagerDocumentRequestsView = ({
  documentRequests,
  onApproveDocument,
  onRejectDocument,
}) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingDoc, setViewingDoc] = useState(null);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const pendingList = documentRequests.filter((d) => d.status === "pending");
  const generatedList = documentRequests.filter(
    (d) => d.status === "approved" || d.status === "completed",
  );
  const historyList = documentRequests.filter((d) => d.status !== "pending");
  const currentList =
    activeTab === "pending"
      ? pendingList
      : activeTab === "generated"
        ? generatedList
        : historyList;
  const filtered = currentList.filter((d) => {
    const nameKh = d.userNameKh || d.employeeNameKh || "";
    const nameEn = d.userNameEn || d.employeeNameEn || "";
    const docType = d.documentType || d.type || "";
    const id = d.id || "";
    const term = searchTerm.toLowerCase();
    return (
      nameKh.toLowerCase().includes(term) ||
      nameEn.toLowerCase().includes(term) ||
      docType.toLowerCase().includes(term) ||
      id.toLowerCase().includes(term)
    );
  });
  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (rejectingDocId) {
      onRejectDocument(rejectingDocId, rejectReason);
      setRejectingDocId(null);
      setRejectReason("");
      if (viewingDoc && viewingDoc.id === rejectingDocId) {
        setViewingDoc(null);
      }
    }
  };
  const getDocTypeName = (type) => {
    switch (type) {
      case "employment_letter":
        return "លិខិតបញ្ជាក់ការងារ";
      case "salary_certificate":
        return "លិខិតបញ្ជាក់ប្រាក់បៀវត្ស";
      case "confirmation_letter":
        return "លិខិតបញ្ជាក់ទូទៅ";
      default:
        return type ? type.replace(/_/g, " ") : "លិខិតរដ្ឋបាល";
    }
  };
  return (
    <div class="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white ">
            {"សំណើសុំឯកសារ"}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {
              "ពិនិត្យសំណើ មើលព័ត៌មានលម្អិត អនុម័ត បដិសេធ ចេញលិខិត និងប្រវត្តិស្នើសុំ"
            }
          </p>
        </div>

        {/* Tab Toggle: Pending, Generated Documents, Request History */}
        <select
          class="filter-select"
          aria-label="ជ្រើសរើសប្រភេទ"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="pending">
            {"សំណើរង់ចាំ"} ({pendingList.length})
          </option>
          <option value="generated">{"លិខិតបានចេញ"}</option>
          <option value="history">{"ប្រវត្តិ"}</option>
        </select>
      </div>

      {/* Search Bar */}
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div class="relative max-w-md">
          <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={"ស្វែងរកតាមឈ្មោះបុគ្គលិក ប្រភេទលិខិត..."}
            class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003049]"
          />
        </div>
      </div>

      {/* Document Requests Table */}
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th class="py-3.5 px-4">{"បុគ្គលិកស្នើសុំ"}</th>
                <th class="py-3.5 px-4">{"ប្រភេទឯកសារ"}</th>
                <th class="py-3.5 px-4">{"គោលបំណង"}</th>
                <th class="py-3.5 px-4">{"កាលបរិច្ឆេទស្នើសុំ"}</th>
                <th class="py-3.5 px-4">{"ស្ថានភាព"}</th>
                <th class="py-3.5 px-4 text-right">{"សកម្មភាព"}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} class="py-8 text-center text-slate-400">
                    {"មិនមានទិន្នន័យសំណើសុំឯកសារទេ"}
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900 dark:text-white ">
                        {doc.userNameKh || doc.employeeNameKh || "បុគ្គលិក"}
                      </div>
                      <div class="text-xs text-slate-400 font-mono">
                        {doc.userId || doc.employeeId}
                      </div>
                    </td>

                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200/50">
                        {getDocTypeName(doc.documentType || doc.type)}
                      </span>
                    </td>

                    <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {doc.purpose}
                    </td>

                    <td class="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {doc.requestDate}
                    </td>

                    <td class="py-3.5 px-4">
                      <span
                        class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${doc.status === "approved" || doc.status === "completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : doc.status === "rejected" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
                      >
                        {doc.status === "approved" ||
                        doc.status === "completed" ? (
                          <>
                            <CheckCircle2 class="w-3 h-3" />
                            <span>{"បានចេញរួចរាល់"}</span>
                          </>
                        ) : doc.status === "rejected" ? (
                          <>
                            <XCircle class="w-3 h-3" />
                            <span>{"បានបដិសេធ"}</span>
                          </>
                        ) : (
                          <>
                            <Clock class="w-3 h-3" />
                            <span>{"រង់ចាំពិនិត្យ"}</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions: View Details, Approve, Reject, Download */}
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        {/* View Details / Preview Document */}
                        <button
                          onClick={() => setViewingDoc(doc)}
                          title={"មើលព័ត៌មានលម្អិត"}
                          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                        >
                          <Eye class="w-3.5 h-3.5" />
                        </button>

                        {doc.status === "pending" && (
                          <>
                            {/* Approve */}
                            <button
                              onClick={() => onApproveDocument(doc.id)}
                              title={"អនុម័ត និងចេញលិខិត"}
                              class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Check class="w-3 h-3" />
                              <span>{"អនុម័ត"}</span>
                            </button>

                            {/* Reject */}
                            <button
                              onClick={() => setRejectingDocId(doc.id)}
                              title={"បដិសេធ"}
                              class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                            >
                              <X class="w-3 h-3" />
                              <span>{"បដិសេធ"}</span>
                            </button>
                          </>
                        )}

                        {(doc.status === "approved" ||
                          doc.status === "completed") && (
                          <button
                            onClick={() => setViewingDoc(doc)}
                            title={"ទាញយក / បោះពុម្ព"}
                            class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Printer class="w-3 h-3" />
                            <span>{"បោះពុម្ព"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DOCUMENT DETAILS & OFFICIAL LETTER PREVIEW (Generated Documents) */}
      {viewingDoc && (
        <Teleport to="body">
          <div class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div class="modal-surface relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setViewingDoc(null)}
                class="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X class="w-5 h-5" />
              </button>

              <div class="flex items-center gap-2 mb-2">
                <span class="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {viewingDoc.id}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {getDocTypeName(viewingDoc.documentType || viewingDoc.type)}
                </span>
              </div>

              <h3 class="text-xl font-bold text-slate-800 dark:text-white  mb-4">
                {getDocTypeName(viewingDoc.documentType || viewingDoc.type)} —{" "}
                {viewingDoc.userNameKh ||
                  viewingDoc.employeeNameKh ||
                  "បុគ្គលិក"}
              </h3>

              {/* Official Letter Document Canvas (Simulated Official Certificate) */}
              <div class="p-6 sm:p-8 bg-amber-50/20 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl mb-6 relative">
                {/* Header Letterhead */}
                <div class="text-center border-b pb-4 mb-4 border-slate-300 dark:border-slate-700">
                  <div class="text-xs font-bold tracking-widest text-slate-800 dark:text-blue-300 uppercase">
                    ព្រះរាជាណាចក្រកម្ពុជា • ជាតិ សាសនា ព្រះមហាក្សត្រ
                  </div>
                  <div class="text-sm font-semibold text-slate-900 dark:text-white mt-1 ">
                    រោងចក្រ ម៉ូឌើន ហ្គាម៉ិន (ខេមបូឌា) ឯ.ក
                  </div>
                  <div class="text-xs text-slate-400">
                    ក្រុមហ៊ុន រោងចក្រកាត់ដេរទំនើប (កម្ពុជា)
                  </div>
                </div>

                {/* Title of Document */}
                <div class="text-center my-4">
                  <h4 class="text-base font-bold text-slate-900 dark:text-white underline decoration-[#003049] underline-offset-4 ">
                    {getDocTypeName(
                      viewingDoc.documentType || viewingDoc.type,
                    ).toUpperCase()}
                  </h4>
                  <p class="text-xs text-slate-400 mt-1 font-mono">
                    លេខយោង៖ {viewingDoc.id}/2026
                  </p>
                </div>

                {/* Content Body */}
                <div class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2 mb-6">
                  <p>
                    {`រដ្ឋបាលរោងចក្រ សូមបញ្ជាក់ថា លោក/លោកស្រី ${viewingDoc.userNameKh || viewingDoc.employeeNameKh || ""} (លេខសម្គាល់៖ ${viewingDoc.userId || viewingDoc.employeeId || ""}) បច្ចុប្បន្នកំពុងបំពេញការងារជាបុគ្គលិកពេញសិទ្ធិ ក្នុងក្រុមហ៊ុនរបស់យើងខ្ញុំពិតប្រាកដមែន។`}
                  </p>
                  <p>
                    <strong>{"គោលបំណងនៃការប្រើប្រាស់៖"}</strong>{" "}
                    {viewingDoc.purpose}
                  </p>
                  <p>
                    <strong>{"កាលបរិច្ឆេទស្នើសុំ៖"}</strong>{" "}
                    {viewingDoc.requestDate}
                  </p>
                </div>

                {/* Official Stamp & Signature */}
                <div class="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span class="text-xs text-slate-400 block">
                      {"ទីតាំងរោងចក្រ"}
                    </span>
                    <span class="font-semibold text-slate-700 dark:text-slate-300">
                      តំបន់សេដ្ឋកិច្ចពិសេសភ្នំពេញ
                    </span>
                  </div>
                  <div class="text-center">
                    <div class="w-20 h-20 rounded-full border-2 border-dashed border-rose-400 flex items-center justify-center text-xs text-rose-500 font-bold rotate-[-12deg] mb-1 mx-auto bg-rose-50/50">
                      ត្រាផ្លូវការ
                    </div>
                    <span class="font-bold text-slate-900 dark:text-white block ">
                      ហេង ពិសិដ្ឋ / ប្រធានផ្នែក
                    </span>
                    <span class="text-xs text-slate-400">
                      ហត្ថលេខាអ្នកទទួលបន្ទុកធនធានមនុស្ស
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  {viewingDoc.status === "pending" ? (
                    <>
                      <button
                        onClick={() => {
                          onApproveDocument(viewingDoc.id);
                          setViewingDoc({ ...viewingDoc, status: "approved" });
                        }}
                        class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <Check class="w-4 h-4" />
                        <span>{"អនុម័ត និងចេញលិខិត"}</span>
                      </button>
                      <button
                        onClick={() => setRejectingDocId(viewingDoc.id)}
                        class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <X class="w-4 h-4" />
                        <span>{"បដិសេធ"}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => alert("កំពុងទាញយកឯកសារជាទម្រង់ PDF...")}
                      class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-[#002235] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Download class="w-4 h-4" />
                      <span>{"ទាញយកឯកសារ"}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setViewingDoc(null)}
                  class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {"បិទ"}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      )}

      {/* REJECT REASON MODAL */}
      {rejectingDocId && (
        <Teleport to="body">
          <div class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div class="modal-surface relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-slate-800 dark:text-slate-100">
              <h3 class="text-lg font-bold text-rose-600  mb-2">
                {"បញ្ជាក់ការបដិសេធសំណើសុំឯកសារ"}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {"សូមបញ្ជាក់ពីមូលហេតុនៃការមិនចេញលិខិតផ្លូវការនេះ"}
              </p>

              <form onSubmit={handleConfirmReject} class="space-y-4">
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder={"ឧ. ពុំទាន់បំពេញគ្រប់លក្ខខណ្ឌការងារសាកល្បង..."}
                  class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingDocId(null)}
                    class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600"
                  >
                    {"បោះបង់"}
                  </button>
                  <button
                    type="submit"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                  >
                    {"បញ្ជាក់ការបដិសេធ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Teleport>
      )}
    </div>
  );
};
export default defineComponent({
  name: "ManagerDocumentRequestsView",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(ManagerDocumentRequestsView, () => attrs);
  },
});
</script>
