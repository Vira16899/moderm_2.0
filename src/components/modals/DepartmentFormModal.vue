<script setup>
import { computed, onBeforeUnmount, reactive, ref, useId, watch } from 'vue';
import { Building2, Plus, Save, Trash2 } from 'lucide-vue-next';
import BaseModal from '../base/BaseModal.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseSkeleton from '../base/BaseSkeleton.vue';
import { adminApi } from '../../api/admin.api';
import { departmentBody, editorPositions, positionsForEditor, unwrapDepartment, validateDepartmentDraft, deletePositionAndVerify, positionFingerprint, savePositionRows } from '../../api/departmentEditor';
import { managerAssignmentError } from '../../api/managerAssignments.js';
import { notify } from '../../stores/toasts';

const props = defineProps({ department: Object, users: { type: Array, default: () => [] }, departments: { type: Array, default: () => [] }, onCreate: Function, onUpdate: Function, onGetDepartment: Function, positionsApi: { type: Object, default: () => adminApi } });
const emit = defineEmits(['close', 'saved', 'changed']);
const editing = computed(() => !!props.department);
const fields = useId();
let sequence = 0, loadVersion = 0, disposed = false;
const newRow = (row = {}) => ({ key: ++sequence, ...row, name: row.name || '', description: row.description || '' });
const draft = ref({ departmentId: props.department?.departmentId ?? props.department?.id, name: props.department?.nameKh || props.department?.name || '', description: props.department?.descriptionKh || props.department?.description || '', user_id: props.department?.managerId || props.department?.user_id || null, positions: editing.value ? [] : [newRow()] });
const managers = computed(() => props.users.filter(user => user?.role === 'MANAGER'));
const managerError = id => managerAssignmentError(id,draft.value.departmentId,props.departments,props.users);
const selectedManagerMissing = computed(() => draft.value.user_id != null && draft.value.user_id !== '' && !managers.value.some(user => String(user.id) === String(draft.value.user_id)));
let savedMetadataFingerprint = '';
const loading = ref(false), saving = ref(false), error = ref(''), errors = ref({});
const loadError = ref(''), removeTarget = ref(null), removing = ref(false), removeError = ref('');
const acknowledgedDeletes = reactive(new Set());
watch(draft, () => { if (Object.keys(errors.value).length) errors.value = validateDepartmentDraft(draft.value); }, { deep: true });
const busy = computed(() => saving.value || removing.value || loading.value);
const readDepartment = id => props.onGetDepartment ? props.onGetDepartment(id) : props.positionsApi.getDepartment(id);
async function load() {
  const version = ++loadVersion;
  loading.value = true; loadError.value = '';
  try {
    const [departmentPayload, positionPayload] = await Promise.all([readDepartment(draft.value.departmentId), props.positionsApi.getPositions()]);
    const department = unwrapDepartment(departmentPayload, draft.value.departmentId);
    const positions = positionsForEditor({ ...department, id: draft.value.departmentId }, editorPositions(positionPayload));
    const hydrated = await Promise.all(positions.map(async position => {
      if (position.description !== undefined) return position;
      const payload = await props.positionsApi.getPosition(position.positionId);
      const data = payload?.data?.data ?? payload?.data ?? payload;
      const full = editorPositions([data?.position ?? data])[0];
      if (!full || String(full.positionId) !== String(position.positionId)) throw new Error('មិនអាចផ្ទៀងផ្ទាត់ព័ត៌មានមុខតំណែងបានទេ។');
      return { ...position, description: full.description || '' };
    }));
    if (disposed || version !== loadVersion) return;
    draft.value = { departmentId: draft.value.departmentId, name: department.nameKh || department.name || '', description: department.descriptionKh || department.description || '', user_id: department.managerId || department.user_id || null, positions: hydrated.map(position => newRow({ ...position, savedFingerprint: positionFingerprint(position) })) };
    savedMetadataFingerprint = '';
  } catch (cause) { if (!disposed && version === loadVersion) loadError.value = cause.message || 'មិនអាចទាញយកមុខតំណែងបានទេ។'; }
  finally { if (!disposed && version === loadVersion) loading.value = false; }
}
if (editing.value) load();
onBeforeUnmount(() => { disposed = true; loadVersion++; });
async function save() {
  if (busy.value || loadError.value || removeTarget.value || acknowledgedDeletes.size) return;
  errors.value = validateDepartmentDraft(draft.value); error.value = '';
  const assignmentError = managerError(draft.value.user_id);
  if (assignmentError) { errors.value.manager = assignmentError; notify(assignmentError,'error'); }
  if (Object.keys(errors.value).length) return;
  saving.value = true;
  try {
    const body = departmentBody(draft.value, editing.value);
    const action = editing.value ? props.onUpdate : props.onCreate;
    if (!action) throw new Error('មិនមានមុខងាររក្សាទុកនាយកដ្ឋានទេ។');
    const metadataFingerprint = JSON.stringify([body.name, body.description, body.user_id]);
    if (!editing.value || savedMetadataFingerprint !== metadataFingerprint) {
      const { positions, deletedPositionIds, ...metadata } = body;
      const result = await action({ ...(editing.value ? metadata : body), id: draft.value.departmentId, nameKh: body.name, descriptionKh: body.description });
      if (result?.ok === false || result?.result === false) throw new Error(result.error || result.message || result.msg || 'API មិនបានរក្សាទុកនាយកដ្ឋានទេ។');
      if (result?.ok !== true && result?.result !== true) throw new Error('API មិនបានបញ្ជាក់ការរក្សាទុកនាយកដ្ឋានទេ។');
      if (editing.value) savedMetadataFingerprint = metadataFingerprint;
    }
    if (editing.value) await savePositionRows(props.positionsApi, draft.value.positions, draft.value.departmentId);
    notify(editing.value ? 'ព័ត៌មាននាយកដ្ឋាន និងមុខតំណែងត្រូវបានរក្សាទុក។' : 'នាយកដ្ឋាន និងមុខតំណែងត្រូវបានបង្កើត។');
    emit('saved'); emit('close');
  } catch (cause) {
    error.value = (editing.value && savedMetadataFingerprint ? 'ព័ត៌មាននាយកដ្ឋានត្រូវបានរក្សាទុក ប៉ុន្តែមុខតំណែងមួយចំនួនមិនទាន់បានរក្សាទុក។ ' : '') + (cause.message || 'មិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្តងទៀត។');
    if (editing.value && savedMetadataFingerprint) emit('changed');
  }
  finally { saving.value = false; }
}
function requestRemove(row) {
  if (busy.value) return;
  if (row.creationAcknowledged && row.positionId == null) { error.value = 'មុខតំណែងនេះត្រូវបានបង្កើតរួចហើយ។ សូមផ្ទៀងផ្ទាត់លេខសម្គាល់ដោយរក្សាទុកម្តងទៀត មុនពេលលុប។'; return; }
  removeTarget.value = row; removeError.value = '';
}
async function confirmRemove() {
  if (!removeTarget.value || removing.value) return;
  const row = removeTarget.value;
  removing.value = true; removeError.value = '';
  try {
    if (row.positionId != null) {
      await deletePositionAndVerify({ ...props.positionsApi, getDepartment: readDepartment }, row.positionId, draft.value.departmentId, acknowledgedDeletes.has(String(row.positionId)));
      acknowledgedDeletes.delete(String(row.positionId));
    }
    draft.value.positions = draft.value.positions.filter(item => item.key !== row.key);
    errors.value = {};
    removeTarget.value = null;
    if (row.positionId != null) { notify('មុខតំណែង និងទំនាក់ទំនងក្នុងនាយកដ្ឋានត្រូវបានលុប។'); emit('changed'); }
  } catch (cause) {
    if (cause.deletionAcknowledged) acknowledgedDeletes.add(String(row.positionId));
    removeError.value = cause.message || 'មិនអាចលុបមុខតំណែងបានទេ។';
    if (cause.deletionAcknowledged) emit('changed');
  } finally { removing.value = false; }
}
</script>
<template>
  <BaseModal :model-value="true" :title="editing ? 'កែប្រែនាយកដ្ឋាន' : 'បន្ថែមនាយកដ្ឋានថ្មី'" show-header size="lg" :busy="busy" class="account-action-modal department-form-modal" @close="emit('close')" v-slot="{ close }">
    <BaseSkeleton v-if="loading" :lines="5" label="កំពុងទាញយកព័ត៌មាន និងមុខតំណែង…"/>
    <div v-else-if="loadError" class="profile-load-error" role="alert"><p>{{ loadError }}</p><BaseButton variant="outline" @click="load">ព្យាយាមម្ដងទៀត</BaseButton></div>
    <form v-else novalidate :aria-busy="saving" @submit.prevent="save">
      <fieldset :disabled="busy" class="department-editor-fields">
        <section class="department-editor-section"><h3><Building2 :size="18"/>ព័ត៌មាននាយកដ្ឋាន</h3><label :for="fields + '-name'">ឈ្មោះនាយកដ្ឋាន<input :id="fields + '-name'" v-model="draft.name" required :aria-invalid="!!errors.name" :aria-describedby="errors.name ? fields + '-name-error' : undefined"/></label><p v-if="errors.name" :id="fields + '-name-error'" class="profile-form-error" role="alert">{{ errors.name }}</p><label :for="fields + '-description'">ការពិពណ៌នា<textarea :id="fields + '-description'" v-model="draft.description" rows="2" required :aria-invalid="!!errors.description" :aria-describedby="errors.description ? fields + '-description-error' : undefined"/></label><p v-if="errors.description" :id="fields + '-description-error'" class="profile-form-error" role="alert">{{ errors.description }}</p><label :for="fields + '-manager'">ប្រធានគ្រប់គ្រង<select :id="fields + '-manager'" v-model="draft.user_id" :aria-invalid="!!errors.manager"><option :value="null">មិនទាន់ចាត់តាំង</option><option v-if="selectedManagerMissing" :value="draft.user_id">{{ department?.managerNameKh || draft.user_id }}</option><option v-for="manager in managers"  :key="manager.id" :value="manager.id" :disabled="!!managerError(manager.id)">{{ manager.nameKh || manager.nameEn }}<template v-if="manager.nameKh && manager.nameEn"> ({{ manager.nameEn }})</template><template v-if="managerError(manager.id)"> — មាននាយកដ្ឋានរួចហើយ</template></option></select></label><p v-if="errors.manager" class="profile-form-error" role="alert">{{ errors.manager }}</p></section>
        <section class="department-editor-section"><div class="department-positions-heading"><h3>មុខតំណែង <span>{{ draft.positions.length }}</span></h3><BaseButton variant="outline" size="sm" @click="draft.positions.push(newRow())"><Plus :size="16"/>បន្ថែមមុខតំណែង</BaseButton></div><p class="department-editor-hint">ឈ្មោះមុខតំណែងនីមួយៗត្រូវតែខុសគ្នា។</p><div v-for="(position, index) in draft.positions" :key="position.key" class="department-position-editor"><label :for="fields + '-position-' + position.key">មុខតំណែង {{ index + 1 }}<input :id="fields + '-position-' + position.key" v-model="position.name" required :aria-invalid="!!errors['position-' + index]" :aria-describedby="errors['position-' + index] ? fields + '-position-error-' + position.key : undefined"/></label><button type="button" class="icon-button danger-link" :aria-label="'លុបមុខតំណែង ' + (position.name || index + 1)" @click="requestRemove(position)"><Trash2 :size="17"/></button><p v-if="errors['position-' + index]" :id="fields + '-position-error-' + position.key" class="profile-form-error" role="alert">{{ errors['position-' + index] }}</p><label class="position-description-field" :for="fields + '-position-description-' + position.key">ការពិពណ៌នាមុខតំណែង {{ index + 1 }}<textarea :id="fields + '-position-description-' + position.key" v-model="position.description" rows="2" required :aria-invalid="!!errors['position-description-' + index]"/></label><p v-if="errors['position-description-' + index]" class="profile-form-error" role="alert">{{ errors['position-description-' + index] }}</p></div><p v-if="!draft.positions.length" class="department-editor-hint">មិនទាន់មានមុខតំណែងទេ។ សូមចុចបន្ថែមមុខតំណែង។</p></section>
      </fieldset>
      <p v-if="error" class="profile-form-error" role="alert">{{ error }}</p>
      <p v-if="acknowledgedDeletes.size" class="profile-form-error" role="alert">មានការលុបដែលមិនទាន់ផ្ទៀងផ្ទាត់ទំនាក់ទំនង។ សូមពិនិត្យការលុបម្តងទៀត មុនរក្សាទុក។</p>
      <div class="profile-form-actions"><BaseButton variant="outline" :disabled="busy" @click="close">បោះបង់</BaseButton><BaseButton type="submit" :loading="saving" :disabled="loading || removing || !!acknowledgedDeletes.size"><Save :size="16"/>{{ editing ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតនាយកដ្ឋាន' }}</BaseButton></div>
    </form>
  </BaseModal>
  <BaseModal v-if="removeTarget" :model-value="true" title="លុបមុខតំណែង" show-header size="sm" :busy="removing" class="account-action-modal" @close="removeTarget = null">
    <p class="department-delete-copy">{{ removeTarget.positionId != null ? 'តើអ្នកចង់លុបមុខតំណែងនេះ និងទំនាក់ទំនងរបស់វាពីនាយកដ្ឋានមែនទេ?' : 'តើអ្នកចង់ដកជួរមុខតំណែងនេះចេញមែនទេ?' }}</p><strong>{{ removeTarget.name || 'មុខតំណែងថ្មី' }}</strong><p v-if="removeError" class="profile-form-error" role="alert">{{ removeError }}</p><div class="profile-form-actions"><BaseButton variant="outline" :disabled="removing" @click="removeTarget = null">បោះបង់</BaseButton><BaseButton variant="danger" :loading="removing" @click="confirmRemove">{{ acknowledgedDeletes.has(String(removeTarget.positionId)) ? 'ផ្ទៀងផ្ទាត់ការលុបម្តងទៀត' : 'បញ្ជាក់ការលុប' }}</BaseButton></div>
  </BaseModal>
</template>
