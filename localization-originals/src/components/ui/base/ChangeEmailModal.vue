<template>
  <BaseModal
    :is-open="isOpen"
    title="ប្តូរអ៊ីមែល"
    @close="$emit('close')"
  >
    <form
      id="changeEmailForm"
      novalidate
      @submit.prevent="handleSubmit"
      class="space-y-5"
    >
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">អ៊ីមែលថ្មី <span class="text-red-500">*</span></label>
        <input
          v-model="localData.newEmail"
          type="email"
          placeholder="បញ្ចូលអ៊ីមែលថ្មីរបស់អ្នក"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
          :class="fieldClass('newEmail')"
          required
          @input="validateField('newEmail')"
        />
        <p v-if="errors.newEmail" class="text-red-400 text-xs mt-1">{{ errors.newEmail }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">ពាក្យសម្ងាត់ <span class="text-red-500">*</span></label>
        <div class="relative">
          <input
            v-model="localData.password"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="បញ្ចូលពាក្យសម្ងាត់របស់អ្នកដើម្បីបន្ត"
            class="w-full px-4 py-2.5 pr-11 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
            :class="fieldClass('password')"
            required
            @input="validateField('password')"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-3 flex items-center border-0 bg-transparent text-gray-400 hover:text-gray-600 focus:outline-none"
            :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
            @click="isPasswordVisible = !isPasswordVisible"
          >
            <i :class="isPasswordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <p v-if="errors.password" class="text-red-400 text-xs mt-1">{{ errors.password }}</p>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          បោះបង់
        </button>
        <button
          type="submit"
          form="changeEmailForm"
          :disabled="loading"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{ loading ? "កំពុងបញ្ជូន..." : "បន្ត" }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import BaseModal from "@/components/ui/base/BaseModal.vue";

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  initialData: {
    type: Object,
    default: () => ({
      newEmail: "",
      password: "",
    }),
  },
});

const emit = defineEmits(["close", "submit"]);

const localData = ref({ ...props.initialData });
const isPasswordVisible = ref(false);
const errors = reactive({
  newEmail: "",
  password: "",
});

watch(
  () => props.initialData,
  (newData) => {
    localData.value = { ...newData };
    Object.keys(errors).forEach(key => errors[key] = "");
    isPasswordVisible.value = false;
  },
  { deep: true }
);

const fieldClass = (key) =>
  errors[key] ? "border-red-400 ring-2 ring-red-100" : "";

const validateField = (key) => {
  if (key === 'newEmail') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!localData.value.newEmail) {
      errors.newEmail = "អ៊ីមែលថ្មីចាំបាច់ត្រូវតែមាន។";
    } else if (!emailRegex.test(String(localData.value.newEmail))) {
      errors.newEmail = "អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវទេ។";
    } else {
      errors.newEmail = "";
    }
  }
  
  if (key === 'password') {
    if (!localData.value.password) {
      errors.password = "ពាក្យសម្ងាត់ចាំបាច់ត្រូវតែមាន។";
    } else if (String(localData.value.password).length < 8) {
      errors.password = "ពាក្យសម្ងាត់ត្រូវតែមាន៨ខ្ទង់ឡើងទៅ។";
    } else {
      errors.password = "";
    }
  }
};

const validateForm = () => {
  validateField('newEmail');
  validateField('password');
  return Object.values(errors).every((message) => message === "");
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("submit", localData.value);
};
</script>
