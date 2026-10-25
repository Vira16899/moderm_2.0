<script setup>
import { ref } from 'vue';

const props = defineProps({ modelValue: { type: String, default: '' }, id: { type: String, required: true }, disabled: Boolean, error: String });
const emit = defineEmits(['update:modelValue']);
const inputs = ref([]);
function digits(value) {
  return value.replace(/[០-៩]/g, digit => String(digit.charCodeAt(0) - 0x17e0)).replace(/\D/g, '');
}
function update(index, value) {
  const incoming = digits(value);
  if (!incoming) { inputs.value[index].value = props.modelValue[index] || ''; return; }
  const start = Math.min(index, props.modelValue.length);
  const next = (props.modelValue.slice(0, start) + incoming + props.modelValue.slice(start + incoming.length)).slice(0, 6);
  emit('update:modelValue', next);
  inputs.value[index].value = next[index] || '';
  inputs.value[Math.min(start + incoming.length, 5)]?.focus();
}
function keydown(event, index) {
  if (event.key === 'Backspace') {
    event.preventDefault();
    const target = props.modelValue[index] ? index : Math.max(0, index - 1);
    emit('update:modelValue', props.modelValue.slice(0, target) + props.modelValue.slice(target + 1));
    inputs.value[target]?.focus();
  } else if (event.key === 'Delete') {
    event.preventDefault();
    emit('update:modelValue', props.modelValue.slice(0, index) + props.modelValue.slice(index + 1));
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    inputs.value[Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)))]?.focus();
  }
}
</script>

<template>
  <div class="otp-fields" role="group" :aria-labelledby="`${id}-label`" :aria-describedby="error ? `${id}-error` : undefined">
    <input v-for="index in 6" :id="index === 1 ? id : `${id}-${index}`" :key="index" :ref="element => inputs[index - 1] = element"
      :value="modelValue[index - 1] || ''" type="text" inputmode="numeric" :autocomplete="index === 1 ? 'one-time-code' : 'off'"
      :aria-label="`ខ្ទង់ទី ${index} នៃលេខកូដ ៦ ខ្ទង់`" :aria-invalid="Boolean(error)" :aria-describedby="error ? `${id}-error` : undefined"
      :disabled="disabled" @focus="$event.target.select()" @input="update(index - 1, $event.target.value)"
      @paste.prevent="update(index - 1, $event.clipboardData.getData('text'))" @keydown="keydown($event, index - 1)" />
  </div>
  <p v-if="error" :id="`${id}-error`" class="field-error" role="alert">{{ error }}</p>
</template>
