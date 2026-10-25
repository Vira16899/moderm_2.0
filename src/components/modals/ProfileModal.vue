<script lang="jsx">
import { labels } from "../../data/labels";
import { defineComponent, Teleport } from "vue";
import { createCompatRender, useState } from "../../utils/vueCompat";
import { User as UserIcon, Settings, KeyRound, LogOut, X, Check, Phone, Calendar, Building, Shield } from "lucide-vue-next";
import { translations } from "../../i18n/translations";
const ProfileModal = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,

  onLogoutClick,
  defaultTab = "view"
}) => {
  const t = translations;
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [nameKh, setNameKh] = useState(currentUser.nameKh);
  const [nameEn, setNameEn] = useState(currentUser.nameEn);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [departmentKh, setDepartmentKh] = useState(currentUser.departmentKh);
  const [departmentEn, setDepartmentEn] = useState(currentUser.departmentEn);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  if (!isOpen) return null;
  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      nameKh,
      nameEn,
      phone,
      departmentKh,
      departmentEn
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwError("");
    if (!currentPw) {
      setPwError("សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន");
      return;
    }
    if (currentPw !== currentUser.password) {
      setPwError("ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ");
      return;
    }
    if (newPw.length < 6) {
      setPwError("ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ");
      return;
    }
    onUpdateUser({ ...currentUser, password: newPw });
    setPwSuccess(true);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 2500);
  };
  return <Teleport to="body"><div class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
    id="profile-manager-modal"
    class="modal-surface relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col"
  >
        {
    /* Header */
  }
        <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserIcon class="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h3 class="font-bold text-sm tracking-tight ">{t.profile}</h3>
              <p class="text-xs text-slate-400 font-mono">{currentUser.email}</p>
            </div>
          </div>
          <button
    onClick={onClose}
    aria-label="បិទ"
    class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  >
            <X class="w-4 h-4" />
          </button>
        </div>

        {
    /* Tab Navigation */
  }
        <select class="filter-select" aria-label="ជ្រើសរើសប្រភេទ" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
            <option value="view">{t.viewProfile}</option>
            <option value="edit">{t.editProfile}</option>
            <option value="password">{t.changePassword}</option>
          </select>

        {
    /* Tab Content */
  }
        <div class="p-5 overflow-y-auto max-h-[65vh]">
          {
    /* TAB 1: VIEW PROFILE */
  }
          {activeTab === "view" && <div class="space-y-4 animate-in fade-in duration-150">
              <div class="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <img
    src={currentUser.avatar}
    alt={currentUser.nameEn}
    class="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
  />
                <div>
                  <h4 class="text-sm font-semibold text-slate-900 dark:text-white ">
                    {currentUser.nameKh}
                  </h4>
                  <p class="text-xs text-slate-400">{currentUser.email}</p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      {labels[currentUser.role]}
                    </span>
                    <span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {t.active}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span class="text-slate-400 flex items-center gap-1.5 mb-1 font-medium text-xs">
                    <Building class="w-3.5 h-3.5 text-slate-400" />
                    {"ផ្នែក / ដេប៉ាតឺម៉ង់"}
                  </span>
                  <p class="font-semibold text-slate-800 dark:text-slate-200 ">
                    {currentUser.departmentKh}
                  </p>
                </div>

                <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span class="text-slate-400 flex items-center gap-1.5 mb-1 font-medium text-xs">
                    <Phone class="w-3.5 h-3.5 text-slate-400" />
                    {"លេខទូរស័ព្ទ"}
                  </span>
                  <p class="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {currentUser.phone || "+855 12 000 000"}
                  </p>
                </div>

                <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span class="text-slate-400 flex items-center gap-1.5 mb-1 font-medium text-xs">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    {"ថ្ងៃចូលបម្រើការងារ"}
                  </span>
                  <p class="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {currentUser.joinedDate}
                  </p>
                </div>

                <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span class="text-slate-400 flex items-center gap-1.5 mb-1 font-medium text-xs">
                    <Shield class="w-3.5 h-3.5 text-slate-400" />
                    {"កម្រិតសុវត្ថិភាព"}
                  </span>
                  <p class="font-semibold text-slate-800 dark:text-slate-200">
                    ព័ត៌មានសុវត្ថិភាពគណនី
                  </p>
                </div>
              </div>

              <div class="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <button
    onClick={() => setActiveTab("edit")}
    class="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition-colors"
  >
                  {t.editProfile}
                </button>
                <button
    onClick={() => {
      onClose();
      onLogoutClick();
    }}
    class="danger-link text-rose-600 dark:text-rose-400 text-xs font-semibold hover:underline flex items-center gap-1.5"
  >
                  <LogOut class="w-3.5 h-3.5" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>}

          {
    /* TAB 2: EDIT PROFILE */
  }
          {activeTab === "edit" && <form onSubmit={handleSaveProfile} class="space-y-3.5 text-xs animate-in fade-in duration-150">
              {saveSuccess && <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                  <Check class="w-4 h-4" />
                  <span class="">{"បានរក្សាទុកព័ត៌មានដោយជោគជ័យ!"}</span>
                </div>}

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1 ">
                  {"ឈ្មោះជាភាសាខ្មែរ"}
                </label>
                <input
    type="text"
    value={nameKh}
    onChange={(e) => setNameKh(e.target.value)}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100"
    required
  />
              </div>

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {"ឈ្មោះជាអក្សរឡាតាំង"}
                </label>
                <input
    type="text"
    value={nameEn}
    onChange={(e) => setNameEn(e.target.value)}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100"
    required
  />
              </div>

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1 ">
                  {"លេខទូរស័ព្ទ"}
                </label>
                <input
    type="text"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100 font-mono"
  />
              </div>

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1 ">
                  {"ផ្នែក/ដេប៉ាតឺម៉ង់ (ភាសាខ្មែរ)"}
                </label>
                <input
    type="text"
    value={departmentKh}
    onChange={(e) => setDepartmentKh(e.target.value)}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100"
  />
              </div>

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {"ផ្នែក/ដេប៉ាតឺម៉ង់"}
                </label>
                <input
    type="text"
    value={departmentEn}
    onChange={(e) => setDepartmentEn(e.target.value)}
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100"
  />
              </div>

              <div class="pt-2 flex justify-end gap-2">
                <button
    type="button"
    onClick={() => setActiveTab("view")}
    class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  >
                  {t.cancel}
                </button>
                <button
    type="submit"
    class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold transition-colors"
  >
                  {t.save}
                </button>
              </div>
            </form>}

          {
    /* TAB 3: CHANGE PASSWORD */
  }
          {activeTab === "password" && <form onSubmit={handleChangePassword} class="space-y-3.5 text-xs animate-in fade-in duration-150">
              {pwSuccess && <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                  <Check class="w-4 h-4" />
                  <span class="">{"បានផ្លាស់ប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ!"}</span>
                </div>}

              {pwError && <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium ">
                  {pwError}
                </div>}

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1 ">
                  {"ពាក្យសម្ងាត់បច្ចុប្បន្ន"}
                </label>
                <input
    type="password"
    value={currentPw}
    onChange={(e) => setCurrentPw(e.target.value)}
    placeholder="••••••••"
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100 font-mono"
    required
  />
              </div>

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1 ">
                  {"ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួអក្សរ)"}
                </label>
                <input
    type="password"
    value={newPw}
    onChange={(e) => setNewPw(e.target.value)}
    placeholder="••••••••"
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100 font-mono"
    required
  />
              </div>

              <div>
                <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1 ">
                  {"ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី"}
                </label>
                <input
    type="password"
    value={confirmPw}
    onChange={(e) => setConfirmPw(e.target.value)}
    placeholder="••••••••"
    class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 dark:text-slate-100 font-mono"
    required
  />
              </div>

              <div class="pt-2 flex justify-end gap-2">
                <button
    type="button"
    onClick={() => setActiveTab("view")}
    class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  >
                  {t.cancel}
                </button>
                <button
    type="submit"
    class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold transition-colors"
  >
                  {t.changePassword}
                </button>
              </div>
            </form>}
        </div>
      </div>
    </div></Teleport>;
};
export default defineComponent({
  name: "ProfileModal",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(ProfileModal, () => attrs);
  }
});
</script>
