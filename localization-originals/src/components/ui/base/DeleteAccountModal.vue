<template>
  <BaseModal
    :is-open="isOpen"
    title="លុបគណនី"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <div class="flex flex-col items-center text-center">
        <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Trash2Icon class="w-7 h-7 text-red-500" />
        </div>
        <h3 class="text-lg font-medium text-gray-900">តើអ្នកពិតជាចង់លុបគណនីមែនទេ?</h3>
        <p class="text-sm text-gray-500 mt-2 leading-relaxed">
          សកម្មភាពនេះនឹងលុបព័ត៌មានរបស់អ្នកជាអចិន្ត្រៃយ៍ និងមិនអាចស្តារឡើងវិញបានទេ។
        </p>
      </div>

      <form id="deleteAccountForm" novalidate @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <label class="block text-sm font-normal text-gray-700">
            បញ្ចូលពាក្យសម្ងាត់ដើម្បីបញ្ជាក់
            <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="isPasswordVisible ? 'text' : 'password'"
              placeholder="••••••••"
              class="w-full px-4 py-2.5 pr-11 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400 transition-all"
              :class="{ 'border-red-400 ring-2 ring-red-100': error }"
              required
              @input="validatePassword"
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
          <p v-if="error" class="text-red-400 text-xs mt-1">{{ error }}</p>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          :disabled="loading"
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          បោះបង់
        </button>
        <button
          type="submit"
          form="deleteAccountForm"
          :disabled="loading"
          class="px-6 py-2 bg-red-500 text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{ loading ? "កំពុងលុប..." : "លុបគណនី" }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from "vue";
import { Trash2 as Trash2Icon } from "lucide-vue-next";
import BaseModal from "@/components/ui/base/BaseModal.vue";

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
});

const emit = defineEmits(["close", "submit"]);
const password = ref("");
const error = ref("");
const isPasswordVisible = ref(false);

// មុខងារពិនិត្យពាក្យសម្ងាត់ (៨ ខ្ទង់ឡើងទៅ)
const validatePassword = () => {
  if (!password.value) {
    error.value = "ពាក្យសម្ងាត់បច្ចុប្បន្នត្រូវតែមាន។";
  } else if (password.value.length < 8) {
    error.value = "ពាក្យសម្ងាត់បច្ចុប្បន្នត្រូវតែមាន ៨ ខ្ទង់ឡើងទៅ។";
  } else {
    error.value = "";
  }
};

watch(() => props.isOpen, (val) => {
  if (val) {
    password.value = "";
    error.value = "";
    isPasswordVisible.value = false;
  }
});

const handleSubmit = () => {
  validatePassword();
  if (!error.value) {
    emit("submit", { password: password.value });
  }
};
</script>
