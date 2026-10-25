<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { AlertTriangle, Banknote, CheckCircle2, Edit2, Pause, Play, Search, Save, Trash2, UserPlus, Users, X, XCircle } from "lucide-vue-next";
import { labels } from "../../data/labels";
import { mergePositionOptions, positionsForDepartment } from "../../data/positionOptions.js";
import { adminApi } from '../../api/admin.api.js';
import { positionList } from '../../api/adminPositions.js';
import { isProtectedAdminId } from '../../api/adminUsers.js';
import { managerAssignmentError, managerDepartments } from '../../api/managerAssignments.js';
import { notify } from '../../stores/toasts.js';
import UserAvatar from "../../components/common/UserAvatar.vue";
import AdminCreateUserDialog from "./AdminCreateUserDialog.vue";
import AdminUserDetails from "./AdminUserDetails.vue";
import SalaryUpdateModal from '../../components/modals/SalaryUpdateModal.vue';
import { BaseTable, BaseButton, BaseModal } from '../../components/base';

const columns = [
  { key: 'nameKh', label: 'បុគ្គលិក / អ្នកប្រើ', sortable: true },
  { key: 'role', label: 'តួនាទី', sortable: true },
  { key: 'departmentKh', label: 'នាយកដ្ឋាន និងមុខតំណែង', sortable: true },
  { key: 'phone', label: 'ទំនាក់ទំនង' },
  { key: 'status', label: 'ស្ថានភាព', sortable: true },
  { key: 'actions', label: 'សកម្មភាព', align: 'right' },
];

const props = defineProps({
  readOnly: Boolean,
  loading: Boolean,
  loadError: String,
  optionsLoading: Boolean,
  optionsError: String,
  onRetry: Function,
  users: { type: Array, default: () => [] },
  departments: { type: Array, default: () => [] },
  onAddUser: { type: Function, default: null },
  onUpdateUser: { type: Function, default: null },
  onToggleStatus: { type: Function, default: null },
  onDeleteUser: { type: Function, default: null },
  onGetUser: { type: Function, default: null },
  onSalaryHistory: Function,
  onUpdateSalary: Function,
});
const searchTerm = ref("");
const roleFilter = ref("ALL");
const statusFilter = ref("ALL");
const isAddModalOpen = ref(false);
const viewingUser = ref(null);
const salaryUser = ref(null), salaryVersion = ref(0);
function salarySaved() { salaryVersion.value++; }
let listScroll = 0;
function openUser(user) {
  listScroll = document.getElementById('main-content-scrollable')?.scrollTop || 0;
  viewingUser.value = user;
}
async function closeDetails() {
  const id = viewingUser.value?.id;
  viewingUser.value = null;
  await nextTick();
  [...document.querySelectorAll('.user-management [data-row-key]')].find(row => row.dataset.rowKey === String(id))?.focus({ preventScroll: true });
  document.getElementById('main-content-scrollable')?.scrollTo({ top: listScroll });
}
const editingUser = ref(null);
const userToDelete = ref(null);
const password = ref("");
const formError = ref("");
const isSavingUser = ref(false);
const deletingUser = ref(false);
const deleteError = ref('');
const editSnapshot = ref('');
const editDirty = computed(() => !!editingUser.value && JSON.stringify(formData.value) !== editSnapshot.value);
const filteredUsers = computed(() => {
  const term = searchTerm.value.toLowerCase();
  return props.users.filter((user) => {
    const matchesSearch = [user.nameKh, user.nameEn, user.email, user.id].some((value) => String(value ?? "").toLowerCase().includes(term));
    return matchesSearch && (roleFilter.value === "ALL" || user.role === roleFilter.value) && (statusFilter.value === "ALL" || user.status === statusFilter.value);
  });
});
const positionCatalogue = ref([]);
const positionsLoading = ref(false), positionsError = ref('');
let positionRequest = 0;
const availablePositions = computed(() => mergePositionOptions(positionCatalogue.value, props.departments));
const editPositions = computed(() => positionsForDepartment(availablePositions.value, formData.value.departmentId));
async function loadEditPositions() {
  const request = ++positionRequest;
  positionsLoading.value = true;
  positionsError.value = '';
  positionCatalogue.value = [];
  try {
    const positions = positionList(await adminApi.getPositions());
    if (request !== positionRequest) return;
    positionCatalogue.value = positions;
    if (!editPositions.value.some(item => String(item.id) === String(formData.value.positionId))) handleDepartmentChange();
  } catch {
    if (request === positionRequest) positionsError.value = 'មិនអាចទាញយកបញ្ជីមុខតំណែងបានទេ។ សូមព្យាយាមម្ដងទៀត។';
  } finally { if (request === positionRequest) positionsLoading.value = false; }
}
onBeforeUnmount(() => { positionRequest++; });
watch(editingUser, user => { if (!user) positionRequest++; });
const managedDepartments = computed(() => props.departments.filter((department) =>
  props.users.some((user) => String(user.id) === String(department.managerId) && user.role === "MANAGER"),
));
const departmentOptions = computed(() => editingUser.value ? props.departments : managedDepartments.value);
const initialFormData = () => ({ nameKh: "", nameEn: "", email: "", role: "EMPLOYEE", departmentId: managedDepartments.value[0]?.id || "", dob: "", gender: "", address: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "", positionKh: "", positionEn: "", positionId: "", phone: "", salary: 350, status: "active", contractType: "full_time", joinedDate: new Date().toISOString().split("T")[0] });
const formData = ref(initialFormData());
watch(managedDepartments, (departments) => {
  if (!editingUser.value && !departments.some((department) => String(department.id) === String(formData.value.departmentId))) {
    formData.value.departmentId = departments[0]?.id || "";
  }
});
const roleLabel = (role) => role === "ADMIN" ? "អ្នកគ្រប់គ្រងប្រព័ន្ធ" : role === "MANAGER" ? "អ្នកគ្រប់គ្រង" : "បុគ្គលិក";
const roleClass = (role) => role === "ADMIN" ? "bg-blue-700 text-white" : role === "MANAGER" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
function handlePositionChange() {
  const position = editPositions.value.find((item) => item.id === String(formData.value.positionId));
  formData.value.positionKh = position?.nameKh || "";
  formData.value.positionEn = position?.nameEn || "";
}
function checkManagerDepartment() {
  if (formData.value.role !== 'MANAGER') return false;
  const issue = managerAssignmentError(editingUser.value?.id,formData.value.departmentId,props.departments,props.users,{checkOccupied:true,newManager:editingUser.value?.role !== 'MANAGER'});
  if (issue) notify(issue,'error');
  return !!issue;
}
const managerAssignments = user => managerDepartments(user.id,props.departments,props.users);
function handleDepartmentChange(showConflict = false) {
  if (!editPositions.value.some((item) => item.id === String(formData.value.positionId))) {
    formData.value.positionId = "";
    formData.value.positionKh = "";
    formData.value.positionEn = "";
  }
  if (showConflict) checkManagerDepartment();
}
function openAddModal() { password.value = ""; formError.value = ""; isSavingUser.value = false; formData.value = initialFormData(); isAddModalOpen.value = true; }
function openEditModal(user) {
  password.value = "";
  editingUser.value = user;
  const ownedDepartments = user.role === 'MANAGER' ? managerAssignments(user) : [];
  formData.value = { ...initialFormData(), nameKh: user.nameKh, nameEn: user.nameEn, email: user.email, role: user.role, departmentId: (ownedDepartments.length === 1 ? ownedDepartments[0].id : null) || user.departmentId || user.department_id || "", dob: user.dob || "", gender: String(user.gender || "").toLowerCase(), address: user.address || "", emergencyContactName: user.emergencyContactName || "", emergencyContactPhone: user.emergencyContactPhone || "", emergencyContactRelationship: user.emergencyContactRelationship || "", positionKh: user.positionKh || "", positionEn: user.positionEn || "", positionId: user.positionId || user.position_id || "", phone: user.phone || "", salary: user.salary ?? "", status: user.status, contractType: user.contractType || "full_time", joinedDate: user.joinedDate || "" };
  editSnapshot.value = JSON.stringify(formData.value);
  formError.value = "";
  loadEditPositions();
}
function closeUserForm() { if (isSavingUser.value) return; isAddModalOpen.value = false; editingUser.value = null; password.value = ""; formError.value = ""; }
async function handleSaveEdit(event) {
  event.preventDefault();
  if (!editingUser.value || isSavingUser.value || props.optionsLoading || props.optionsError || (formData.value.role === 'EMPLOYEE' && (positionsLoading.value || positionsError.value))) return;
  if (checkManagerDepartment()) return;
  formError.value = "";
  isSavingUser.value = true;
  const department = props.departments.find((item) => String(item.id) === String(formData.value.departmentId));
  try {
    if (!props.onUpdateUser) throw new Error("មិនមានមុខងាររក្សាទុកព័ត៌មានអ្នកប្រើប្រាស់ទេ។");
    if (formData.value.role === 'EMPLOYEE' && !editPositions.value.some((item) => item.id === String(formData.value.positionId))) {
      throw new Error('សូមជ្រើសរើសនាយកដ្ឋាន និងមុខតំណែងដែលត្រូវគ្នា។');
    }
    const chosenPosition = editPositions.value.find((item) => item.id === String(formData.value.positionId));
    const result = await props.onUpdateUser({ ...editingUser.value, nameKh: formData.value.nameKh, nameEn: formData.value.nameEn, email: formData.value.email, role: formData.value.role, positionKh: formData.value.positionKh, positionEn: formData.value.positionEn, positionId: formData.value.positionId, positionDepartmentId: chosenPosition?.departmentId, departmentId: formData.value.departmentId, departmentKh: department?.nameKh || editingUser.value.departmentKh, departmentEn: department?.nameEn || editingUser.value.departmentEn, status: formData.value.status, joinedDate: formData.value.joinedDate, dob: formData.value.dob, gender: formData.value.gender, phone: formData.value.phone, address: formData.value.address, emergencyContactName: formData.value.emergencyContactName, emergencyContactPhone: formData.value.emergencyContactPhone, emergencyContactRelationship: formData.value.emergencyContactRelationship, salary: formData.value.salary === "" ? "" : Number(formData.value.salary), contractType: formData.value.contractType });
    if (result?.ok === false) throw new Error(result.error || "មិនអាចរក្សាទុកព័ត៌មានអ្នកប្រើប្រាស់បានទេ។");
    editingUser.value = null;
  } catch (error) {
    formError.value = error?.message || "មិនអាចរក្សាទុកព័ត៌មានអ្នកប្រើប្រាស់បានទេ។";
  } finally {
    isSavingUser.value = false;
  }
}
async function confirmDelete() {
  if (!userToDelete.value || deletingUser.value || isProtectedAdminId(userToDelete.value.id)) return;
  deletingUser.value = true; deleteError.value = '';
  try {
    const result = await props.onDeleteUser?.(userToDelete.value.id);
    if (result?.ok === false) throw new Error(result.error);
    userToDelete.value = null;
  } catch (error) { deleteError.value = error.message || 'មិនអាចលុបគណនីបានទេ។ សូមព្យាយាមម្តងទៀត។'; }
  finally { deletingUser.value = false; }
}
</script>

<template>
  <SalaryUpdateModal v-if="salaryUser && onUpdateSalary && !readOnly" :model-value="!!salaryUser" :user="salaryUser" :on-update-salary="onUpdateSalary" @update:model-value="value => { if (!value) salaryUser = null; }" @saved="salarySaved"/>
  <AdminUserDetails v-if="viewingUser" :user="users.find((user) => user.id === viewingUser.id) || viewingUser" :on-back="closeDetails" :on-get-user="onGetUser" :on-salary-history="onSalaryHistory" :salary-version="salaryVersion" :on-edit-salary="!readOnly && onUpdateSalary ? user => salaryUser = user : undefined" :employee-view="readOnly" />
    <div v-show="!viewingUser" class="user-management space-y-6 animate-in fade-in duration-200">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 class="text-2xl font-semibold text-slate-800 dark:text-white sm:text-3xl">{{ readOnly ? 'បុគ្គលិកក្រោមឱវាទ' : 'គ្រប់គ្រងអ្នកប្រើប្រាស់' }}</h1><p class="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{{ readOnly ? 'ស្វែងរក និងមើលព័ត៌មានលម្អិតរបស់បុគ្គលិកក្នុងនាយកដ្ឋានរបស់អ្នក' : 'បញ្ជីអ្នកប្រើប្រាស់ បន្ថែម កែសម្រួល មើលព័ត៌មានលម្អិត និងផ្អាក/បើកដំណើរការគណនី' }}</p></div><button v-if="!readOnly" type="button" class="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#002235]" @click="openAddModal"><UserPlus class="h-4 w-4" />បន្ថែមអ្នកប្រើប្រាស់</button></header>
    <p v-if="optionsLoading" role="status" class="text-sm text-slate-500">កំពុងទាញយកនាយកដ្ឋាន…</p>
    <div v-if="optionsError" role="alert" class="form-error">{{ optionsError }} <button type="button" class="text-button" @click="onRetry?.()">ព្យាយាមម្ដងទៀត</button></div>
    <section class="user-list-filters space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex sm:items-center sm:justify-between sm:space-y-0"><div class="relative max-w-md flex-1"><Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="ស្វែងរកអ្នកប្រើប្រាស់" v-model="searchTerm" type="text" placeholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬលេខកូដ..." class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#003049] dark:border-slate-700 dark:bg-slate-900/50 dark:focus:ring-[#b2e9ff]" /></div><div class="flex flex-wrap items-center gap-2"><select v-if="!readOnly" v-model="roleFilter" class="filter-select" aria-label="តួនាទី"><option value="ALL">ទាំងអស់</option><option value="ADMIN">អ្នកគ្រប់គ្រងប្រព័ន្ធ</option><option value="MANAGER">អ្នកគ្រប់គ្រង</option><option value="EMPLOYEE">បុគ្គលិក</option></select><select aria-label="តម្រងតាមស្ថានភាព" v-model="statusFilter" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-900"><option value="ALL">គ្រប់ស្ថានភាព</option><option value="active">សកម្ម</option><option value="inactive">អសកម្ម</option></select></div></section>
    <BaseTable :columns="readOnly ? columns.filter(column => column.key !== 'actions') : columns" :rows="filteredUsers" :loading="loading" :error="loadError" row-clickable :row-label="user => `មើលព័ត៌មាន ${user.nameKh || user.nameEn || user.id}`" :caption="readOnly ? 'បុគ្គលិក' : 'អ្នកប្រើប្រាស់'" @row-click="openUser" @retry="onRetry?.()">
      <template #cell-nameKh="{ row: user }"><div class="flex items-center gap-3"><UserAvatar :src="user.avatar" :name="user.nameEn || user.nameKh" :size="36" /><div><span class="font-bold text-slate-900 dark:text-white">{{ user.nameKh || user.nameEn }}</span><p class="text-xs text-slate-500 break-all">{{ user.email }}</p></div></div></template>
      <template #cell-role="{ row: user }"><span :class="['rounded-full px-2.5 py-1 text-xs font-bold', roleClass(user.role)]">{{ roleLabel(user.role) }}</span></template>
      <template #cell-departmentKh="{ row: user }"><div class="font-semibold text-slate-800 dark:text-slate-200">{{ user.positionKh }}</div><div class="text-xs text-slate-400">{{ user.role === 'MANAGER' ? managerAssignments(user).map(item => item.nameKh || item.name || item.id).join(' · ') || 'មិនទាន់ចាត់តាំង' : user.departmentKh }}</div><p v-if="user.role === 'MANAGER' && managerAssignments(user).length > 1" class="mt-1 text-xs text-amber-700 dark:text-amber-300">ការចាត់តាំងស្ទួន៖ សូមកែប្រែនៅនាយកដ្ឋាន។</p></template>
      <template #cell-phone="{ row: user }">{{ user.phone || '—' }}</template>
      <template #cell-status="{ row: user }"><span :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', user.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300']"><CheckCircle2 v-if="user.status === 'active'" class="h-3 w-3" /><XCircle v-else class="h-3 w-3" />{{ user.status === 'active' ? 'សកម្ម' : 'អសកម្ម' }}</span></template>
      <template #cell-actions="{ row: user }"><div class="flex items-center justify-end gap-1.5"><button v-if="!readOnly && onUpdateSalary" class="icon-button salary-action" title="ធ្វើបច្ចុប្បន្នភាពប្រាក់បៀវត្ស" @click="salaryUser = user"><Banknote :size="17"/></button><button v-if="!readOnly" class="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/10" title="កែប្រែព័ត៌មាន" @click="openEditModal(user)"><Edit2 class="h-4 w-4" /></button><button v-if="!readOnly" :disabled="isProtectedAdminId(user.id)" :class="['rounded-lg border px-2 py-1 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed', user.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/50']" :title="isProtectedAdminId(user.id) ? 'មិនអាចផ្អាកគណនីអ្នកគ្រប់គ្រងប្រព័ន្ធនេះបានទេ។' : user.status === 'active' ? 'ផ្អាកដំណើរការ' : 'បើកដំណើរការ'" @click="onToggleStatus?.(user.id)"><Pause v-if="user.status === 'active'" :size="17"/><Play v-else :size="17"/></button><button v-if="!readOnly && onDeleteUser" :disabled="isProtectedAdminId(user.id)" class="danger-link disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-rose-200 p-1.5 text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-950/50" :title="isProtectedAdminId(user.id) ? 'មិនអាចលុបគណនីអ្នកគ្រប់គ្រងប្រព័ន្ធនេះបានទេ។' : 'លុបគណនី'" @click="deleteError = ''; userToDelete = user"><Trash2 class="h-4 w-4" /></button></div></template>
    </BaseTable>

    <AdminCreateUserDialog v-if="isAddModalOpen && !readOnly" :departments="departments" :departments-loading="optionsLoading" :departments-error="optionsError" :on-retry="onRetry" :on-create="onAddUser" @close="isAddModalOpen = false" />
<BaseModal v-if="userToDelete" :model-value="!!userToDelete" :title="'លុបគណនី'" :busy="deletingUser" :error="deleteError" @update:model-value="value => { if (!value) userToDelete = null; }"><div class="mb-4 flex items-center gap-3 text-rose-600"><div class="rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/50"><AlertTriangle class="h-6 w-6 text-rose-600 dark:text-rose-400" /></div><div><h3 class="text-base font-bold text-slate-900 dark:text-white">តើអ្នកប្រាកដជាចង់លុបគណនីនេះ?</h3><p class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ userToDelete.nameKh }}</p></div></div><p class="mb-6 text-xs text-slate-600 dark:text-slate-300">ការលុបបុគ្គលិក “{{ userToDelete.nameKh }} ({{ userToDelete.nameEn }})” នឹងដកគណនីនេះចេញពីប្រព័ន្ធទាំងស្រុង។ សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។</p><div class="flex justify-end gap-3"><button class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5" :disabled="deletingUser" @click="userToDelete = null">បោះបង់</button><button :disabled="deletingUser" class="danger-button flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700" @click="confirmDelete"><Trash2 class="h-4 w-4" />លុបគណនី</button></div>
</BaseModal>

<BaseModal v-if="editingUser && !readOnly" :model-value="!!editingUser" v-slot="{ close }" :title="'កែប្រែព័ត៌មានអ្នកប្រើប្រាស់'" :busy="isSavingUser" :dirty="editDirty" @update:model-value="value => { if (!value) closeUserForm(); }"><button :disabled="isSavingUser" class="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-white/10" @click="close"><X class="h-5 w-5" /></button><h3 class="mb-4 text-xl font-bold">កែប្រែព័ត៌មានអ្នកប្រើប្រាស់</h3><p v-if="editingUser.role === 'ADMIN'" class="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-6 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">គណនី Admin កែបានតែព័ត៌មានផ្ទាល់ខ្លួនរបស់ Admin ដែលបានចូលប្រព័ន្ធប៉ុណ្ណោះ។</p><p v-if="formError" role="alert" class="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-6 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{{ formError }}</p>
        <form @submit.prevent="handleSaveEdit"><fieldset class="space-y-4" :disabled="isSavingUser">
          <div class="grid grid-cols-2 gap-3"><div><label class="mb-1 block text-xs font-bold">ឈ្មោះជាខ្មែរ</label><input v-model="formData.nameKh" required class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" placeholder="ឧ. សុខ វាសនា" /></div><div><label class="mb-1 block text-xs font-bold">ឈ្មោះជាអង់គ្លេស</label><input v-model="formData.nameEn" required class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" placeholder="ឧ. Sok Veasna" /></div></div>
          <div class="grid grid-cols-2 gap-3"><div><label for="edit-user-role" class="mb-1 block text-xs font-bold">តួនាទី</label><p v-if="editingUser?.role === 'ADMIN'" class="text-sm">អ្នកគ្រប់គ្រងប្រព័ន្ធ</p><select v-else id="edit-user-role" v-model="formData.role" @change="checkManagerDepartment" :required="!editingUser" :disabled="editingUser?.role === 'ADMIN'" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/50"><option value="EMPLOYEE">បុគ្គលិក</option><option value="MANAGER">អ្នកគ្រប់គ្រង</option></select></div><div v-if="editingUser?.role !== 'ADMIN'"><label for="edit-user-department" class="mb-1 block text-xs font-bold">នាយកដ្ឋាន</label><select id="edit-user-department" v-model="formData.departmentId" :required="!editingUser" :disabled="optionsLoading || !!optionsError || !departmentOptions.length" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-60" @change="handleDepartmentChange(true)"><option value="" disabled>ជ្រើសរើសនាយកដ្ឋាន</option><option v-if="!departmentOptions.length" value="">{{ editingUser ? 'មិនទាន់មាននាយកដ្ឋាន' : 'គ្មាននាយកដ្ឋានដែលមាន Manager' }}</option><option v-for="department in departmentOptions" :key="department.id" :value="department.id">{{ department.nameKh }}</option></select><p v-if="!editingUser && !departmentOptions.length" class="mt-1 text-[11px] text-amber-700 dark:text-amber-300">សូមចាត់តាំង Manager ទៅនាយកដ្ឋាននៅផ្នែកគ្រប់គ្រងនាយកដ្ឋានជាមុនសិន។</p></div></div>
          <div v-if="formData.role === 'EMPLOYEE'"><label for="user-position" class="mb-1 block text-xs font-bold">មុខតំណែង</label><select id="user-position" v-model="formData.positionId" required :disabled="positionsLoading || !!positionsError || !formData.departmentId || editPositions.length === 0" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-60" @change="handlePositionChange"><option value="" disabled>{{ positionsLoading ? 'កំពុងទាញយកមុខតំណែង…' : !formData.departmentId ? 'សូមជ្រើសរើសនាយកដ្ឋានជាមុន' : editPositions.length ? 'ជ្រើសរើសមុខតំណែងក្នុងនាយកដ្ឋាននេះ' : 'នាយកដ្ឋាននេះមិនមានមុខតំណែងទេ' }}</option><option v-for="position in editPositions" :key="position.id" :value="position.id">{{ position.nameKh }}<template v-if="position.nameEn"> ({{ position.nameEn }})</template></option></select><div v-if="positionsError" role="alert" class="mt-2 text-xs text-rose-600">{{ positionsError }} <button type="button" class="text-button" @click="loadEditPositions">ព្យាយាមម្ដងទៀត</button></div><p v-else-if="!positionsLoading && editPositions.length === 0" class="mt-1 text-[11px] text-amber-700 dark:text-amber-300">សូមជ្រើសនាយកដ្ឋានដែលមានមុខតំណែងសិន។</p></div>
          <div v-if="!editingUser"><label class="mb-1 block text-xs font-bold">ពាក្យសម្ងាត់</label><input v-model="password" type="password" autocomplete="new-password" required minlength="8" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" /></div>
          <div class="grid grid-cols-2 gap-3"><div><label class="mb-1 block text-xs font-bold">ភេទ</label><select v-model="formData.gender" :required="!editingUser" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50"><option value="">ជ្រើសរើសភេទ</option><option value="male">ប្រុស</option><option value="female">ស្រី</option></select></div><div><label class="mb-1 block text-xs font-bold">លេខទូរស័ព្ទ</label><input v-model="formData.phone" :required="!editingUser" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" /></div></div>
          <template v-if="editingUser?.role === 'ADMIN'"><div class="grid grid-cols-2 gap-3"><div><label class="mb-1 block text-xs font-bold">ថ្ងៃខែឆ្នាំកំណើត</label><input v-model="formData.dob" type="date" :max="new Date().toISOString().slice(0, 10)" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" /></div><div><label class="mb-1 block text-xs font-bold">អាសយដ្ឋាន</label><input v-model="formData.address" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" placeholder="អាសយដ្ឋាន" /></div></div><div class="grid grid-cols-2 gap-3"><div><label class="mb-1 block text-xs font-bold">ឈ្មោះទំនាក់ទំនងបន្ទាន់</label><input v-model="formData.emergencyContactName" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" /></div><div><label class="mb-1 block text-xs font-bold">លេខទូរស័ព្ទទំនាក់ទំនងបន្ទាន់</label><input v-model="formData.emergencyContactPhone" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" /></div></div><div><label class="mb-1 block text-xs font-bold">ទំនាក់ទំនងជា</label><input v-model="formData.emergencyContactRelationship" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/50" placeholder="ឧ. បងប្អូន" /></div></template>
          <div v-if="editingUser?.role !== 'ADMIN'"><label class="mb-1 block text-xs font-bold">ប្រាក់ខែគោល ($)</label><input v-model="formData.salary" type="number" min="0" :required="!editingUser" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900/50" /></div>
          <div class="flex justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800"><button type="button" :disabled="isSavingUser" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300" @click="close">បោះបង់</button><BaseButton type="submit" :loading="isSavingUser" :disabled="optionsLoading || !!optionsError || (formData.role === 'EMPLOYEE' && (positionsLoading || !!positionsError || !editPositions.length || !formData.positionId))"><Save :size="16"/>រក្សាទុក</BaseButton></div>
        </fieldset></form>
    </BaseModal>
  </div>
</template>
