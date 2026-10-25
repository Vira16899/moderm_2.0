<script setup>
import { nextTick, ref, useId, watch } from 'vue';
import { Banknote, Save } from 'lucide-vue-next';
import BaseModal from '../base/BaseModal.vue';
import BaseButton from '../base/BaseButton.vue';
import UserAvatar from '../common/UserAvatar.vue';
import { money } from '../../api/employeeData';
import { notify } from '../../stores/toasts';
import { validateSalary, salaryError } from '../../utils/salaryMessages';

const props = defineProps({ modelValue: Boolean, user: { type: Object, required: true }, onUpdateSalary: { type: Function, required: true } });
const emit = defineEmits(['update:modelValue', 'saved']);
const amount = ref(''), description = ref(''), saving = ref(false), error = ref('');
const fieldErrors = ref({});
const fieldId = useId();
watch(() => props.modelValue, open => {
  if (!open) return;
  amount.value = props.user.salary == null ? '' : String(props.user.salary);
  description.value = ''; error.value = ''; fieldErrors.value = {};
}, { immediate: true });
watch(amount, () => { if (fieldErrors.value.amount) fieldErrors.value.amount = validateSalary(amount.value, description.value).amount; });
watch(description, () => { if (fieldErrors.value.description) fieldErrors.value.description = validateSalary(amount.value, description.value).description; });
async function focusError() {
  await nextTick();
  document.getElementById(`${fieldId}-${fieldErrors.value.amount ? 'amount' : 'description'}`)?.focus();
}
async function save() {
  if (saving.value) return;
  const salary = Number(amount.value);
  fieldErrors.value = validateSalary(amount.value, description.value);
  error.value = '';
  if (Object.keys(fieldErrors.value).length) { await focusError(); return; }
  saving.value = true; error.value = '';
  try {
    const result = await props.onUpdateSalary(props.user.id, salary, description.value.trim());
    if (result?.ok === false || result?.result === false) throw new Error(result.error || result.message || result.msg);
    emit('saved', { id: props.user.id, salary });
    emit('update:modelValue', false);
    notify('ប្រាក់បៀវត្សត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ។');
  } catch (cause) {
    const translated = salaryError(cause);
    error.value = translated.general || '';
    fieldErrors.value = { amount: translated.amount, description: translated.description };
  }
  finally {
    saving.value = false;
    if (fieldErrors.value.amount || fieldErrors.value.description) await focusError();
  }
}
</script>
<template>
  <BaseModal :model-value="modelValue" title="ធ្វើបច្ចុប្បន្នភាពប្រាក់បៀវត្ស" show-header class="account-action-modal salary-update-modal" :busy="saving" @update:model-value="emit('update:modelValue', $event)" v-slot="{ close }">
    <div class="salary-modal-person"><UserAvatar :src="user.avatar" :name="user.nameEn || user.nameKh" :size="42"/><div><strong>{{ user.nameKh || user.nameEn }}</strong><small>{{ user.email || `#${user.id}` }}</small></div><span>{{ money(user.salary) }}<small>ប្រាក់ខែបច្ចុប្បន្ន</small></span></div>
    <form :aria-busy="saving" novalidate @submit.prevent="save">
      <fieldset class="salary-modal-fields" :disabled="saving">
        <div><label :for="`${fieldId}-amount`">ប្រាក់បៀវត្សថ្មី (USD)<span class="salary-input-wrap" :class="{ 'has-error': fieldErrors.amount }"><Banknote :size="18" aria-hidden="true"/><input :id="`${fieldId}-amount`" v-model="amount" type="number" min="0" step="0.01" required inputmode="decimal" autofocus :aria-invalid="!!fieldErrors.amount" :aria-describedby="fieldErrors.amount ? `${fieldId}-amount-error` : undefined"/></span></label><p v-if="fieldErrors.amount" :id="`${fieldId}-amount-error`" role="alert" class="profile-form-error">{{ fieldErrors.amount }}</p></div>
        <div><label :for="`${fieldId}-description`"><span>មូលហេតុ / ការពិពណ៌នា <small class="salary-required-hint">(ចាំបាច់)</small></span><textarea :id="`${fieldId}-description`" v-model="description" rows="3" maxlength="1000" required :aria-invalid="!!fieldErrors.description" :aria-describedby="fieldErrors.description ? `${fieldId}-description-error` : undefined" placeholder="ឧ. ការកែប្រែប្រាក់បៀវត្សប្រចាំឆ្នាំ"/></label><p v-if="fieldErrors.description" :id="`${fieldId}-description-error`" role="alert" class="profile-form-error">{{ fieldErrors.description }}</p></div>
      </fieldset>
      <p v-if="error" role="alert" class="profile-form-error">{{ error }}</p>
      <div class="profile-form-actions"><BaseButton variant="outline" :disabled="saving" @click="close">បោះបង់</BaseButton><BaseButton type="submit" :loading="saving"><Save :size="16"/>រក្សាទុកប្រាក់បៀវត្ស</BaseButton></div>
    </form>
  </BaseModal>
</template>
