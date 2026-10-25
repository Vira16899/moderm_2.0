<template>
  <BaseModal
    :is-open="isOpen"
    title="ប្តូរពាក្យសម្ងាត់"
    @close="$emit('close')"
  >
    <form
      id="changePasswordForm"
      novalidate
      @submit.prevent="handleSubmit"
      class="space-y-5"
    >
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">ពាក្យសម្ងាត់បច្ចុប្បន្ន <span class="text-red-500">*</span></label>
        <div class="relative">
          <input
            v-model="localData.currentPassword"
            :type="passwordVisibility.currentPassword ? 'text' : 'password'"
            placeholder="បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន"
            class="w-full px-4 py-2.5 pr-11 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
            :class="fieldClass('currentPassword')"
            required
            @input="validateField('currentPassword')"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-3 flex items-center border-0 bg-transparent text-gray-400 hover:text-gray-600 focus:outline-none"
            :aria-label="passwordVisibility.currentPassword ? 'Hide password' : 'Show password'"
            @click="togglePasswordVisibility('currentPassword')"
          >
            <i :class="passwordVisibility.currentPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <p v-if="errors.currentPassword" class="text-red-400 text-xs mt-1">{{ errors.currentPassword }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">ពាក្យសម្ងាត់ថ្មី <span class="text-red-500">*</span></label>
        <div class="relative">
          <input
            v-model="localData.newPassword"
            :type="passwordVisibility.newPassword ? 'text' : 'password'"
            placeholder="យ៉ាងហោច ៨ តួអក្សរ"
            class="w-full px-4 py-2.5 pr-11 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
            :class="fieldClass('newPassword')"
            required
            @input="validateField('newPassword')"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-3 flex items-center border-0 bg-transparent text-gray-400 hover:text-gray-600 focus:outline-none"
            :aria-label="passwordVisibility.newPassword ? 'Hide password' : 'Show password'"
            @click="togglePasswordVisibility('newPassword')"
          >
            <i :class="passwordVisibility.newPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <p v-if="errors.newPassword" class="text-red-400 text-xs mt-1">{{ errors.newPassword }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី <span class="text-red-500">*</span></label>
        <div class="relative">
          <input
            v-model="localData.confirmPassword"
            :type="passwordVisibility.confirmPassword ? 'text' : 'password'"
            placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្ដងទៀត"
            class="w-full px-4 py-2.5 pr-11 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
            :class="fieldClass('confirmPassword')"
            required
            @input="validateField('confirmPassword')"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-3 flex items-center border-0 bg-transparent text-gray-400 hover:text-gray-600 focus:outline-none"
            :aria-label="passwordVisibility.confirmPassword ? 'Hide password' : 'Show password'"
            @click="togglePasswordVisibility('confirmPassword')"
          >
            <i :class="passwordVisibility.confirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="text-red-400 text-xs mt-1">{{ errors.confirmPassword }}</p>
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
          form="changePasswordForm"
          :disabled="loading"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{ loading ? "កំពុងរក្សាទុក..." : "រក្សាទុក" }}
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
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }),
  },
});

const emit = defineEmits(["close", "submit"]);

const localData = ref({ ...props.initialData });
const passwordVisibility = reactive({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
});
const errors = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

watch(
  () => props.initialData,
  (newData) => {
    localData.value = { ...newData };
    Object.keys(errors).forEach(key => errors[key] = "");
    Object.keys(passwordVisibility).forEach(key => passwordVisibility[key] = false);
  },
  { deep: true }
);

const fieldClass = (key) =>
  errors[key] ? "border-red-400 ring-2 ring-red-100" : "";

const togglePasswordVisibility = (key) => {
  passwordVisibility[key] = !passwordVisibility[key];
};

const validateField = (key) => {
  if (key === 'currentPassword') {
    if (!localData.value.currentPassword) {
      errors.currentPassword = "ពាក្យសម្ងាត់បច្ចុប្បន្នត្រូវតែមាន។";
    } else if (String(localData.value.currentPassword).length < 8) {
      errors.currentPassword = "ពាក្យសម្ងាត់បច្ចុប្បន្នត្រូវតែមាន ៨ ខ្ទង់ឡើងទៅ។";
    } else {
      errors.currentPassword = "";
    }
  }
  
  if (key === 'newPassword') {
    if (!localData.value.newPassword) {
      errors.newPassword = "ពាក្យសម្ងាត់ថ្មីចាំបាច់ត្រូវតែមាន។";
    } else if (String(localData.value.newPassword).length < 8) {
      errors.newPassword = "ពាក្យសម្ងាត់ថ្មីត្រូវតែមាន ៨ ខ្ទង់ឡើងទៅ។";
    } else {
      errors.newPassword = "";
    }
  }

  if (key === 'confirmPassword' || localData.value.confirmPassword) {
    if (!localData.value.confirmPassword) {
      errors.confirmPassword = "សូមបញ្ជាក់ពាក្យសម្ងាត់ថ្មី។";
    } else if (localData.value.newPassword !== localData.value.confirmPassword) {
      errors.confirmPassword = "ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ។";
    } else {
      errors.confirmPassword = "";
    }
  }
};

const validateForm = () => {
  validateField('currentPassword');
  validateField('newPassword');
  validateField('confirmPassword');
  return Object.values(errors).every((message) => message === "");
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("submit", localData.value);
};
</script>
