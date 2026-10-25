<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowLeft, Building2, Edit2, MapPin, Trash2, UserCheck, Users } from 'lucide-vue-next';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseModal from '../../components/base/BaseModal.vue';
import { notify } from '../../stores/toasts.js';
import { adminErrorMessage } from '../../utils/adminMessages.js';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import BaseTable from '../../components/base/BaseTable.vue';
import UserAvatar from '../../components/common/UserAvatar.vue';
import { adminApi } from '../../api/admin.api';
import { departmentDetail, departmentId } from '../../api/departmentEditor';

const props = defineProps({ department: { type: Object, required: true }, users: { type: Array, default: () => [] }, version: Number, onGetDepartment: Function, positionsApi: { type: Object, default: () => adminApi }, onBack: Function, onEdit: Function, onAssign: Function, onDelete: Function });
const emit = defineEmits(['changed']);
const employeeToRemove = ref(null), removing = ref(false), removeError = ref('');
const loaded = ref(null), loading = ref(false), error = ref(''), retry = ref(0), heading = ref(null);
watch([() => departmentId(props.department), () => props.version, retry], async (_next, _old, onCleanup) => {
  let active = true;
  onCleanup(() => { active = false; });
  loading.value = true; error.value = ''; loaded.value = null;
  try {
    const selectedId = departmentId(props.department);
    const payload = props.onGetDepartment ? await props.onGetDepartment(selectedId) : props.department;
    const result = departmentDetail(payload, props.department);
    if (active) {
      if (!result) throw new Error('រកមិនឃើញនាយកដ្ឋាននេះទេ។');
      loaded.value = result;
    }
  } catch (cause) { if (active) error.value = cause.message || 'មិនអាចទាញយកព័ត៌មាននាយកដ្ឋានបានទេ។'; }
  finally { if (active) loading.value = false; }
}, { immediate: true });
const department = computed(() => loaded.value || props.department);
const manager = computed(() => props.users.find(user => String(user.id) === String(department.value.managerId)));
const employees = computed(() => {
  const apiEmployees = department.value.employees;
  const list = Array.isArray(apiEmployees) && (department.value.employeesProvided || apiEmployees.length) ? apiEmployees : props.users.filter(user => user.role === 'EMPLOYEE' && String(user.departmentId) === String(department.value.id));
  return list.filter(user => user && typeof user === 'object').map(user => ({
    ...user, id: user.id ?? user.user_id,
    name: user.nameKh || user.khmer_name || user.nameEn || user.Eng_name || user.name || '—',
    latinName: user.nameEn || user.Eng_name || '',
    position: user.positionKh || user.position_name || user.positionEn || '—',
    avatar: user.avatar || user.profile_image || '',
  }));
});
const columns = [{ key: 'name', label: 'បុគ្គលិក', sortable: true }, { key: 'position', label: 'មុខតំណែង', sortable: true }, { key: 'email', label: 'អ៊ីមែល' }, { key: 'actions', label: 'សកម្មភាព', align: 'right' }];
function requestRemove(employee) { if(removing.value)return; employeeToRemove.value=employee; removeError.value=''; }
async function removeEmployee() {
  if(!employeeToRemove.value || removing.value)return;
  removing.value=true;removeError.value='';
  try {
    const userId=employeeToRemove.value.id;
    const result=await props.positionsApi.removeEmployeeFromDepartment(department.value.id,userId);
    if(result?.result!==true && result?.ok!==true)throw new Error(result?.message || result?.msg || result?.error || 'មិនអាចដកបុគ្គលិកចេញបានទេ។');
    const remaining=employees.value.filter(user=>String(user.id)!==String(userId));
    loaded.value={...department.value,employees:remaining,employeesProvided:true,employeeCount:remaining.length};
    employeeToRemove.value=null;
    notify('បុគ្គលិកត្រូវបានដកចេញពីនាយកដ្ឋានដោយជោគជ័យ។');
    emit('changed');
  } catch(cause) { removeError.value=adminErrorMessage(cause);notify(removeError.value,'error'); }
  finally { removing.value=false; }
}
onMounted(() => { document.getElementById('main-content-scrollable')?.scrollTo({ top: 0 }); heading.value?.focus({ preventScroll: true }); });
</script>
<template>
  <div class="dashboard department-details-page" :aria-busy="loading">
    <div class="detail-page-heading"><BaseButton variant="ghost" size="sm" @click="onBack?.()"><ArrowLeft :size="17"/>ត្រឡប់ទៅបញ្ជីនាយកដ្ឋាន</BaseButton><h1 ref="heading" tabindex="-1">ព័ត៌មាននាយកដ្ឋាន</h1></div>
    <BaseSkeleton v-if="loading" :lines="6" label="កំពុងទាញយកព័ត៌មាននាយកដ្ឋាន…"/>
    <div v-else-if="error" class="profile-load-error" role="alert"><p>{{ error }}</p><BaseButton variant="outline" @click="retry++">ព្យាយាមម្ដងទៀត</BaseButton></div>
    <template v-else>
      <section class="dashboard-panel department-detail-hero"><span class="department-detail-icon"><Building2 :size="29"/></span><div class="department-detail-title"><span class="department-code">#{{ department.code || department.id }}</span><h2>{{ department.nameKh || department.nameEn }}</h2><p v-if="department.nameEn && department.nameEn !== department.nameKh">{{ department.nameEn }}</p></div><div class="department-detail-actions"><BaseButton v-if="onEdit" variant="outline" size="sm" @click="onEdit(department)"><Edit2 :size="16"/>កែប្រែ</BaseButton><button v-if="onDelete" type="button" class="icon-button danger-link" aria-label="លុបនាយកដ្ឋាន" @click="onDelete(department)"><Trash2 :size="17"/></button></div></section>
      <div class="department-detail-columns">
        <section class="dashboard-panel department-info-section" aria-labelledby="department-overview-title"><h2 id="department-overview-title"><Building2 :size="18"/>ព័ត៌មានទូទៅ</h2><p class="department-full-description">{{ department.descriptionKh || department.description || department.descriptionEn || 'មិនទាន់មានការពិពណ៌នា។' }}</p><dl class="department-summary-grid"><div><dt><Users :size="16"/>ចំនួនបុគ្គលិក</dt><dd>{{ department.employeeCount ?? employees.length }}</dd></div><div><dt><MapPin :size="16"/>ទីតាំង</dt><dd>{{ department.location || '—' }}</dd></div></dl></section>
        <section class="dashboard-panel department-info-section" aria-labelledby="department-manager-title"><h2 id="department-manager-title"><UserCheck :size="18"/>ប្រធានគ្រប់គ្រងផ្នែក</h2><div class="department-detail-manager"><UserAvatar :src="manager?.avatar || department.managerAvatar" :name="manager?.nameEn || department.managerNameEn" :size="48"/><div><strong>{{ manager?.nameKh || department.managerNameKh || 'មិនទាន់ចាត់តាំង' }}</strong><p>{{ manager?.email || manager?.nameEn || department.managerNameEn || '—' }}</p><p v-if="manager?.phone">{{ manager.phone }}</p></div></div><BaseButton v-if="onAssign" variant="outline" size="sm" @click="onAssign(department)"><UserCheck :size="16"/>ចាត់តាំងប្រធានផ្នែក</BaseButton></section>
      </div>
      <section aria-labelledby="department-employees-title"><div class="salary-section-heading"><h2 id="department-employees-title"><Users :size="18"/>បុគ្គលិកក្នុងនាយកដ្ឋាន</h2></div><BaseTable :columns="columns" :rows="employees" caption="បុគ្គលិកក្នុងនាយកដ្ឋាន" empty-text="មិនទាន់មានបុគ្គលិកក្នុងនាយកដ្ឋាននេះទេ។"><template #cell-name="{ row }"><div class="department-employee-name"><UserAvatar :src="row.avatar" :name="row.latinName || row.name" :size="32"/><strong>{{ row.name }}</strong></div></template><template #cell-actions="{row}"><button type="button" class="icon-button danger-link" :disabled="removing || !row.id" :aria-label="'ដក ' + row.name + ' ចេញពីនាយកដ្ឋាន'" title="ដកចេញពីនាយកដ្ឋាន" @click="requestRemove(row)"><Trash2 :size="17"/></button></template></BaseTable></section>
    </template>
    <BaseModal v-if="employeeToRemove" model-value title="ដកបុគ្គលិកចេញពីនាយកដ្ឋាន?" show-header size="sm" :busy="removing" :error="removeError" @close="employeeToRemove=null"><p class="text-sm leading-7">តើអ្នកចង់ដក «{{ employeeToRemove.name }}» ចេញពី «{{ department.nameKh || department.nameEn }}» មែនទេ? គណនីបុគ្គលិកនៅតែរក្សាទុកក្នុងប្រព័ន្ធ។</p><template #footer><BaseButton variant="outline" :disabled="removing" @click="employeeToRemove=null">បោះបង់</BaseButton><BaseButton variant="danger" :loading="removing" @click="removeEmployee"><Trash2 :size="16"/>ដកចេញពីនាយកដ្ឋាន</BaseButton></template></BaseModal>
  </div>
</template>
