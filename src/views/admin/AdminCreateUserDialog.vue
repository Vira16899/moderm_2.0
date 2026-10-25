<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Eye, EyeOff, LoaderCircle, Save, X } from 'lucide-vue-next';
import BaseModal from '../../components/base/BaseModal.vue';
import { validateCreateUser } from '../../api/adminUsers.js';
import { adminApi } from '../../api/admin.api.js';
import { positionList } from '../../api/adminPositions.js';
import { defaultUserDepartment, mergePositionOptions, positionsForDepartment } from '../../data/positionOptions.js';

const props = defineProps({ departments: { type: Array, default: () => [] }, departmentsLoading: Boolean, departmentsError: String, onRetry: Function, onCreate: Function });
const emit = defineEmits(['close']);
const today = new Date().toLocaleDateString('en-CA');
const form = ref({ nameKh: '', nameEn: '', positionId: '', email: '', role: 'EMPLOYEE', departmentId: '', password: '', gender: '', phone: '', dob: '', joinedDate: today, salary: '', idCardNumber: '', nationality: 'ខ្មែរ' });
const errors = ref({});
const error = ref('');
const saving = ref(false);
const showPassword = ref(false);
const departments = computed(() => props.departments);
const positions = ref([]);
const allPositions = computed(() => mergePositionOptions(positions.value, departments.value));
const availablePositions = computed(() => positionsForDepartment(allPositions.value, form.value.departmentId));
const positionsLoading = ref(true);
const positionsError = ref('');
let initializedDepartment = false;
watch([departments, allPositions, positionsLoading, () => props.departmentsLoading], () => {
  if (positionsLoading.value || props.departmentsLoading || positionsError.value || props.departmentsError) return;
  if (!initializedDepartment || !departments.value.some(item => String(item.id) === String(form.value.departmentId))) {
    form.value.departmentId = defaultUserDepartment(departments.value, allPositions.value, form.value.role);
    if (form.value.departmentId) initializedDepartment = true;
  }
}, { immediate: true });
let positionsRequest = 0;
async function loadPositions() {
  const request = ++positionsRequest;
  positionsLoading.value = true;
  positionsError.value = '';
  positions.value = [];
  form.value.positionId = '';
  try {
    const options = positionList(await adminApi.getPositions());
    if (request === positionsRequest) positions.value = options;
  } catch {
    if (request === positionsRequest) positionsError.value = 'មិនអាចទាញយកបញ្ជីមុខតំណែងបានទេ។';
  } finally {
    if (request === positionsRequest) positionsLoading.value = false;
  }
}
onMounted(loadPositions);
onBeforeUnmount(() => { positionsRequest += 1; });
watch(() => form.value.role, () => {
  form.value.positionId = '';
  if (!departments.value.some(item => String(item.id) === String(form.value.departmentId)) || (form.value.role === 'EMPLOYEE' && !availablePositions.value.length)) form.value.departmentId = defaultUserDepartment(departments.value, allPositions.value, form.value.role);
  errors.value = {};
});
watch(() => form.value.departmentId, () => {
  form.value.positionId = '';
  errors.value = {};
});
const fields = computed(() => [
  { key: 'nameKh', label: 'ឈ្មោះជាខ្មែរ', placeholder: 'ឧ. សុខ វាសនា', autocomplete: 'off' },
  { key: 'nameEn', label: 'ឈ្មោះជាអង់គ្លេស', placeholder: 'ឧ. Sok Veasna', autocomplete: 'off' },
  { key: 'email', label: 'អ៊ីមែល', type: 'email', wide: true, placeholder: 'name@factory.kh', autocomplete: 'off' },
  { key: 'password', label: 'ពាក្យសម្ងាត់', type: 'password', wide: true, autocomplete: 'new-password' },
  { key: 'role', label: 'តួនាទី', options: [{ value: 'EMPLOYEE', label: 'បុគ្គលិក' }, { value: 'MANAGER', label: 'អ្នកគ្រប់គ្រង' }] },
  { key: 'departmentId', label: 'នាយកដ្ឋាន', options: departments.value.map(item => ({ value: String(item.id), label: item.nameKh || item.nameEn })), placeholder: 'ជ្រើសរើសនាយកដ្ឋាន', hint: departments.value.length ? '' : 'មិនមាននាយកដ្ឋានសម្រាប់ជ្រើសរើស។' },
  ...(form.value.role === 'MANAGER' ? [] : [{ key: 'positionId', label: 'មុខតំណែង', options: availablePositions.value.map(item => ({ value: item.id, label: item.nameKh || item.nameEn })), placeholder: !form.value.departmentId ? 'សូមជ្រើសរើសនាយកដ្ឋានជាមុន' : positionsLoading.value ? 'កំពុងទាញយកមុខតំណែង…' : positionsError.value ? 'មិនអាចទាញយកមុខតំណែងបានទេ' : availablePositions.value.length ? 'ជ្រើសរើសមុខតំណែង' : 'មិនមានមុខតំណែងក្នុងនាយកដ្ឋាននេះ', disabled: positionsLoading.value || !!positionsError.value || !form.value.departmentId, hint: positionsLoading.value || positionsError.value || availablePositions.value.length ? '' : 'សូមជ្រើសនាយកដ្ឋានដែលមានមុខតំណែង។' }]),
  { key: 'salary', label: 'ប្រាក់ខែគោល ($)', type: 'number', wide: form.value.role === 'MANAGER', min: 0, step: '0.01' },
  { key: 'gender', label: 'ភេទ', options: [{ value: 'male', label: 'ប្រុស' }, { value: 'female', label: 'ស្រី' }], placeholder: 'ជ្រើសរើសភេទ' },
  { key: 'phone', label: 'លេខទូរស័ព្ទ', type: 'tel', autocomplete: 'off' },
  { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត', type: 'date', max: today },
  { key: 'idCardNumber', label: 'លេខអត្តសញ្ញាណបណ្ណ', autocomplete: 'off' },
  { key: 'nationality', label: 'សញ្ជាតិ', autocomplete: 'off' },
  { key: 'joinedDate', label: 'កាលបរិច្ឆេទចូលធ្វើការ', type: 'date' },
]);
async function submit() {
  if (saving.value || props.departmentsLoading || props.departmentsError || (form.value.role === 'EMPLOYEE' && (positionsLoading.value || positionsError.value))) return;
  error.value = '';
  errors.value = validateCreateUser(form.value, departments.value, allPositions.value);
  if (Object.keys(errors.value).length) {
    await nextTick();
    document.getElementById(`create-user-${Object.keys(errors.value)[0]}`)?.focus();
    return;
  }
  saving.value = true;
  try {
    if (!props.onCreate) throw new Error('មិនអាចបង្កើតគណនីបានទេ។');
    const result = await props.onCreate({ ...form.value });
    if (result?.ok === false) throw new Error(result.error || 'មិនអាចបង្កើតគណនីបានទេ។');
    form.value.password = '';
    emit('close');
  } catch (cause) { error.value = cause.message || 'មិនអាចបង្កើតគណនីបានទេ។'; }
  finally { saving.value = false; }
}
</script>

<template>
  <BaseModal model-value title="បន្ថែមអ្នកប្រើប្រាស់ថ្មី" class="user-create-dialog" :close-on-backdrop="!saving" :close-on-escape="!saving" @close="emit('close')">
    <header class="flex items-center justify-between gap-4 mb-6">
      <h2 class="text-xl font-bold">បន្ថែមអ្នកប្រើប្រាស់ថ្មី</h2>
      <button type="button" class="icon-button" aria-label="បិទ" :disabled="saving" @click="emit('close')"><X :size="22" /></button>
    </header>
    <form novalidate :aria-busy="saving" @submit.prevent="submit">
      <div v-if="departmentsError" role="alert" class="form-error mb-5">{{ departmentsError }} <button type="button" class="text-button" @click="onRetry?.()">ព្យាយាមទាញយកនាយកដ្ឋានម្ដងទៀត</button></div>
      <p v-else-if="departmentsLoading" role="status" class="mb-5 text-sm text-slate-500">កំពុងទាញយកនាយកដ្ឋាន…</p>
      <p v-if="error" role="alert" class="form-error mb-5">{{ error }}</p>
      <fieldset :disabled="saving" class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 border-0 p-0 m-0 min-w-0">
        <div v-for="field in fields" :key="field.key" :class="{ 'sm:col-span-2': field.wide }" class="min-w-0">
          <label :for="`create-user-${field.key}`" class="block text-sm font-semibold mb-2">{{ field.label }}</label>
          <select v-if="field.options" :id="`create-user-${field.key}`" v-model="form[field.key]" :name="field.key" required :disabled="field.disabled || !field.options.length" :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] || field.hint ? `create-user-${field.key}-error` : undefined">
            <option v-if="field.placeholder" value="" disabled>{{ field.placeholder }}</option>
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <div v-else class="relative">
            <input :id="`create-user-${field.key}`" v-model="form[field.key]" :name="field.key" :type="field.key === 'password' && showPassword ? 'text' : field.type || 'text'" :class="{ 'password-input': field.key === 'password' }" :placeholder="field.placeholder" :autocomplete="field.autocomplete" :min="field.min" :max="field.max" :step="field.step" required :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `create-user-${field.key}-error` : undefined" />
            <button v-if="field.key === 'password'" type="button" class="icon-button password-toggle" :aria-label="showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'" :title="showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'" :aria-pressed="showPassword" aria-controls="create-user-password" @click="showPassword = !showPassword">
              <EyeOff v-if="showPassword" :size="19" aria-hidden="true" />
              <Eye v-else :size="19" aria-hidden="true" />
            </button>
          </div>
          <p v-if="errors[field.key] || field.hint" :id="`create-user-${field.key}-error`" class="mt-2 text-xs" :class="errors[field.key] ? 'text-rose-600' : 'text-amber-700 dark:text-amber-300'">{{ errors[field.key] || field.hint }}</p>
          <div v-if="field.key === 'positionId' && positionsError" role="alert" class="mt-2 text-xs text-rose-600">
            <p>{{ positionsError }}</p>
            <button type="button" class="text-button" @click="loadPositions">ព្យាយាមម្ដងទៀត</button>
          </div>
        </div>
      </fieldset>
      <footer class="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-5 mt-7">
        <button type="button" class="text-button" :disabled="saving" @click="emit('close')">បោះបង់</button>
        <button type="submit" class="flex items-center gap-2 rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50" :disabled="saving || departmentsLoading || !!departmentsError || !departments.length || (form.role === 'EMPLOYEE' && (positionsLoading || !!positionsError || !availablePositions.length))"><LoaderCircle v-if="saving" :size="17" class="animate-spin" /><Save v-else :size="17" />{{ saving ? 'កំពុងបង្កើត…' : 'រក្សាទុក' }}</button>
      </footer>
    </form>
  </BaseModal>
</template>

<style>
dialog.base-modal.user-create-dialog { max-width: 560px; border-radius: 24px; padding: 24px; color: var(--ink); }
.user-create-dialog :is(input, select) { width: 100%; min-width: 0; height: 44px; padding: 8px 14px; border: 1px solid #dce5f0; border-radius: 15px; background: #f7f9fb; color: #0b2942; font-size: 14px; }
.user-create-dialog input::placeholder { color: #8c9eb4; }
.user-create-dialog input.password-input { padding-right: 48px; }
.user-create-dialog .password-toggle { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); }
.user-create-dialog :is(input, select)[aria-invalid="true"] { border-color: #e11d48; }
.user-create-dialog :is(h2, label) { color: var(--ink); }
.dark .user-create-dialog :is(input, select) { background: #142030; border-color: #334155; color: #edf3fc; }
@media (max-width: 480px) { dialog.base-modal.user-create-dialog { padding: 22px 18px; border-radius: 22px; } }
</style>
