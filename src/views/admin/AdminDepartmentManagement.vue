<script setup>
import { computed, nextTick, ref, useId } from 'vue';
import { Teleport } from 'vue';
import { AlertTriangle, Building2, Edit2, MapPin, Plus, Save, Trash2, UserCheck, Users, X } from 'lucide-vue-next';
import UserAvatar from '../../components/common/UserAvatar.vue';
import AdminDepartmentDetails from './AdminDepartmentDetails.vue';
import DepartmentFormModal from '../../components/modals/DepartmentFormModal.vue';
import { managerAssignmentError, managerDepartments, managerIdOf } from '../../api/managerAssignments.js';
import { notify } from '../../stores/toasts';
const props = defineProps({ departments: { type: Array, default: () => [] }, users: { type: Array, default: () => [] }, loading: Boolean, error: String, onRetry: Function, onAddDepartment: Function, onUpdateDepartment: Function, onAssignManager: Function, onDeleteDepartment: Function, onGetDepartment: Function, positionsApi: Object });
const isAddModalOpen = ref(false), editingDept = ref(null), assigningDept = ref(null), deptToDelete = ref(null), viewingDepartment = ref(null);
const detailVersion = ref(0), selectedManagerId = ref(''), actionError = ref(''), actionBusy = ref(false);
const cardId = useId(); let listScroll = 0;
const managerFor = department => props.users.find(user => String(user.id) === String(department.managerId));
const availableManagers = computed(() => props.users.filter(user => user?.role === 'MANAGER'));
const managerError = id => managerAssignmentError(id,assigningDept.value?.id,props.departments,props.users);
const conflictedDepartment = department => managerIdOf(department) && managerDepartments(managerIdOf(department),props.departments,props.users).length > 1;
function viewDepartment(department) { listScroll = document.getElementById('main-content-scrollable')?.scrollTop || 0; viewingDepartment.value = department; }
async function backToDepartments() {
  const id = viewingDepartment.value?.id; viewingDepartment.value = null; await nextTick();
  [...document.querySelectorAll('.department-card-open')].find(button => button.dataset.departmentId === String(id))?.focus({ preventScroll: true });
  document.getElementById('main-content-scrollable')?.scrollTo({ top: listScroll });
}
function openAddModal() { actionError.value = ''; isAddModalOpen.value = true; }
function openEditModal(department) { actionError.value = ''; editingDept.value = department; }
function openAssignModal(department) { actionError.value = ''; assigningDept.value = department; selectedManagerId.value = department.managerId || ''; }
function closeDepartmentForm() { isAddModalOpen.value = false; editingDept.value = null; }
function refreshDepartmentData() { detailVersion.value++; props.onRetry?.(); }
async function runDepartmentAction(action) {
  if (actionBusy.value) return false;
  actionError.value = ''; actionBusy.value = true;
  try { const result = await action(); if (result?.ok !== true && result?.result !== true) throw new Error(result?.error || result?.message || 'API មិនបានបញ្ជាក់សកម្មភាពទេ។'); return true; }
  catch (cause) { actionError.value = cause.message || 'សំណើបរាជ័យ។ សូមព្យាយាមម្តងទៀត។'; return false; }
  finally { actionBusy.value = false; }
}
async function handleSaveAssignManager(event) {
  event.preventDefault(); if (!assigningDept.value) return;
  const issue = managerError(selectedManagerId.value);
  if (issue) { actionError.value = issue; notify(issue,'error'); return; }
  const clearing = !selectedManagerId.value;
  if (await runDepartmentAction(() => props.onAssignManager?.(assigningDept.value.id, selectedManagerId.value))) { assigningDept.value = null; refreshDepartmentData(); notify(clearing ? 'ការចាត់តាំងប្រធានផ្នែកត្រូវបានដកចេញ។' : 'ប្រធានផ្នែកត្រូវបានចាត់តាំង។'); }
}
async function deleteDepartment() {
  if (!deptToDelete.value) return;
  const id = deptToDelete.value.id;
  if (await runDepartmentAction(() => props.onDeleteDepartment?.(id))) { deptToDelete.value = null; if (String(viewingDepartment.value?.id) === String(id)) backToDepartments(); refreshDepartmentData(); notify('នាយកដ្ឋានត្រូវបានលុបដោយជោគជ័យ។'); }
}
</script>

<template>
  <DepartmentFormModal v-if="isAddModalOpen || editingDept" :department="editingDept" :users="users" :departments="departments" :on-create="onAddDepartment" :on-update="onUpdateDepartment" :on-get-department="onGetDepartment" :positions-api="positionsApi" @close="closeDepartmentForm" @saved="refreshDepartmentData" @changed="refreshDepartmentData"/>
  <AdminDepartmentDetails v-if="viewingDepartment" :department="departments.find(item => String(item.id) === String(viewingDepartment.id)) || viewingDepartment" :users="users" :version="detailVersion" @changed="refreshDepartmentData" :positions-api="positionsApi" :on-get-department="onGetDepartment" :on-back="backToDepartments" :on-edit="onUpdateDepartment ? openEditModal : undefined" :on-assign="onAssignManager ? openAssignModal : undefined" :on-delete="onDeleteDepartment ? department => deptToDelete = department : undefined"/>
  <div v-show="!viewingDepartment" class="department-management space-y-6 animate-in fade-in duration-200">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 class="text-2xl font-semibold text-slate-800 dark:text-white sm:text-3xl">គ្រប់គ្រងនាយកដ្ឋាន</h1><p class="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">បញ្ជីនាយកដ្ឋាន បន្ថែម កែសម្រួល និងចាត់តាំងប្រធានគ្រប់គ្រងផ្នែកនីមួយៗ</p></div>
      <div class="flex items-center gap-2"><button class="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#002235]" @click="openAddModal"><Plus class="h-4 w-4" />បន្ថែមនាយកដ្ឋាន</button></div>
    </header>

    <div v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" role="alert">{{ error }}</div>
    <div v-if="actionError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" role="alert">{{ actionError }}</div>
    <div v-if="loading && !departments.length" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900" role="status">កំពុងទាញយកនាយកដ្ឋាន…</div>

    <section class="department-grid" aria-label="បញ្ជីនាយកដ្ឋាន">
      <article v-for="department in departments" :key="department.id" class="department-card">
        <button type="button" class="department-card-open" :data-department-id="department.id" :aria-label="'មើលព័ត៌មាននាយកដ្ឋាន ' + (department.nameKh || department.nameEn)" @click="viewDepartment(department)"><span class="sr-only">មើលព័ត៌មាននាយកដ្ឋាន</span></button>
        <div class="department-card-top"><span class="department-card-icon"><Building2 :size="21" aria-hidden="true"/></span><h2 :id="cardId + '-' + department.id" class="department-name">{{ department.nameKh || department.nameEn }}</h2><div class="department-card-actions"><button v-if="onUpdateDepartment" type="button" class="icon-button" aria-label="កែប្រែនាយកដ្ឋាន" title="កែប្រែនាយកដ្ឋាន" @click="openEditModal(department)"><Edit2 :size="17"/></button><button v-if="onDeleteDepartment" type="button" class="icon-button danger-link" aria-label="លុបនាយកដ្ឋាន" title="លុបនាយកដ្ឋាន" @click="actionError = ''; deptToDelete = department"><Trash2 :size="17"/></button></div></div>
        <p class="department-description">{{ department.descriptionKh || department.descriptionEn || 'មិនទាន់មានការពិពណ៌នា។' }}</p>
        <p v-if="conflictedDepartment(department)" class="text-xs text-amber-700 dark:text-amber-300" role="status">អ្នកគ្រប់គ្រងនេះមាននាយកដ្ឋានច្រើន។ សូមដកការចាត់តាំងដែលមិនត្រឹមត្រូវ។</p><div class="department-card-meta"><span><Users :size="16" aria-hidden="true"/><strong>{{ department.employeeCount ?? '—' }}</strong> បុគ្គលិក</span><span v-if="department.location"><MapPin :size="15" aria-hidden="true"/>{{ department.location }}</span></div>
        <footer class="department-card-footer"><UserAvatar :src="managerFor(department)?.avatar || department.managerAvatar" :name="managerFor(department)?.nameEn || department.managerNameEn" :size="36"/><div class="department-manager"><small>ប្រធានផ្នែក</small><strong>{{ managerFor(department)?.nameKh || department.managerNameKh || 'មិនទាន់ចាត់តាំង' }}</strong></div><button v-if="onAssignManager" type="button" class="department-assign" aria-label="ចាត់តាំងប្រធានផ្នែក" title="ចាត់តាំងប្រធានផ្នែក" @click="openAssignModal(department)"><UserCheck :size="17"/></button></footer>
      </article>
    </section>
    <div v-if="!loading && !error && !departments.length" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">មិនទាន់មាននាយកដ្ឋានទេ។</div>

    <Teleport to="body">
      <div v-if="assigningDept" class="modal-overlay fixed inset-0 z-[100] flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in"><div class="modal-surface relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><button class="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:text-slate-600" @click="assigningDept = null"><X class="h-5 w-5" /></button><div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950"><UserCheck class="h-6 w-6" /></div><h3 class="mb-1 text-lg font-bold">ចាត់តាំងប្រធានគ្រប់គ្រងផ្នែក</h3><p class="mb-4 text-xs text-slate-500 dark:text-slate-400">{{ assigningDept.nameKh }}</p><form class="space-y-4" @submit="handleSaveAssignManager"><div><label class="mb-1.5 block text-xs font-bold">ជ្រើសរើសប្រធានផ្នែកថ្មី</label><select v-model="selectedManagerId" class="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900/50"><option value="">មិនទាន់ចាត់តាំង / ដកប្រធានផ្នែក</option><option v-for="manager in availableManagers" :key="manager.id" :value="manager.id" :disabled="!!managerError(manager.id)">{{ manager.nameKh || manager.nameEn }}{{ managerError(manager.id) ? ' — មាននាយកដ្ឋានរួចហើយ' : '' }}</option></select><p v-if="!availableManagers.length" class="mt-1 text-xs text-rose-600">មិនមានគណនី Manager ទេ។ សូមបង្កើតគណនី Manager ជាមុនសិន។</p></div><p v-if="actionError" class="rounded-lg bg-rose-50 p-2 text-xs text-rose-700" role="alert">{{ actionError }}</p><div class="flex justify-end gap-2 pt-2"><button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300" @click="assigningDept = null">បោះបង់</button><button type="submit" :disabled="actionBusy" class="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 disabled:opacity-50"><Save class="h-3.5 w-3.5" />{{ actionBusy ? 'កំពុងរក្សាទុក…' : 'ចាត់តាំង' }}</button></div></form></div></div>

      <div v-if="deptToDelete" class="modal-overlay fixed inset-0 z-[100] flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in"><div class="modal-surface w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><div class="mb-4 flex items-center gap-3 text-rose-600"><div class="rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/50"><AlertTriangle class="h-6 w-6 text-rose-600 dark:text-rose-400" /></div><div><h3 class="text-base font-bold text-slate-900 dark:text-white">តើអ្នកប្រាកដជាចង់លុបនាយកដ្ឋាននេះ?</h3><p class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ deptToDelete.code }} • {{ deptToDelete.nameEn }}</p></div></div><p class="mb-6 text-xs text-slate-600 dark:text-slate-300">ការលុបនាយកដ្ឋាន “{{ deptToDelete.nameKh }} ({{ deptToDelete.nameEn }})” នឹងដកនាយកដ្ឋាននេះចេញពីប្រព័ន្ធ។</p><p v-if="actionError" class="mb-4 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" role="alert">{{ actionError }}</p><div class="flex items-center justify-end gap-3"><button :disabled="actionBusy" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5" @click="deptToDelete = null">បោះបង់</button><button :disabled="actionBusy" class="danger-button flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-rose-700 disabled:opacity-50" @click="deleteDepartment"><Trash2 class="h-3.5 w-3.5" />{{ actionBusy ? 'កំពុងលុប…' : 'លុបនាយកដ្ឋាន' }}</button></div></div></div>
    </Teleport>
  </div>
</template>

<style scoped>
.department-card-top .department-name { flex:1; min-width:0; margin:0; }
.department-card-top .department-card-icon,.department-card-top .department-card-actions { flex-shrink:0; }
</style>
