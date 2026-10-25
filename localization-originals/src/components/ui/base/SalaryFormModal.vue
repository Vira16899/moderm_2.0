<template>
  <BaseModal
    :is-open="isOpen"
    title="កែប្រែប្រាក់បៀវត្ស"
    @close="$emit('close')"
  >
    <form
      id="salaryForm"
      novalidate
      @submit.prevent="handleSubmit"
      class="space-y-5"
    >
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2"
          >ចំនួនប្រាក់បៀវត្ស <span class="text-red-500">*</span></label
        >
        <input
          v-model="localData.salary"
          type="number"
          min="0"
          step="0.01"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('salary')"
          placeholder="ឧទាហរណ៍៖ 750"
          required
          @input="clearError('salary')"
        />
        <p v-if="errors.salary" class="text-red-400 text-xs mt-1">{{ errors.salary }}</p>
      </div>
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2"
          >ថ្ងៃមានប្រសិទ្ធភាព <span class="text-red-500">*</span></label
        >
        <input
          v-model="localData.effectiveDate"
          type="date"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('effectiveDate')"
          required
          @input="clearError('effectiveDate')"
        />
        <p v-if="errors.effectiveDate" class="text-red-400 text-xs mt-1">{{ errors.effectiveDate }}</p>
      </div>
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2"
          >មូលហេតុនៃការកែប្រែ <span class="text-red-500">*</span></label
        >
        <textarea
          v-model="localData.changeReason"
          rows="3"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] resize-none"
          :class="fieldClass('changeReason')"
          placeholder="ការពិនិត្យប្រចាំឆ្នាំ ការតម្លើងតំណែង ជាដើម"
          required
          @input="clearError('changeReason')"
        ></textarea>
        <p v-if="errors.changeReason" class="text-red-400 text-xs mt-1">{{ errors.changeReason }}</p>
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
          form="salaryForm"
          :disabled="loading"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{ loading ? "កំពុងកែប្រែ..." : "កែប្រែប្រាក់បៀវត្ស" }}
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
      salary: "",
      effectiveDate: "",
      changeReason: "",
    }),
  },
});

const emit = defineEmits(["close", "submit"]);

const localData = ref({ ...props.initialData });
const errors = reactive({
  salary: "",
  effectiveDate: "",
  changeReason: "",
});

watch(
  () => props.initialData,
  (newData) => {
    localData.value = { ...newData };
    clearErrors();
  },
  { deep: true }
);

const fieldClass = (key) =>
  errors[key] ? "border-red-400 ring-2 ring-red-100" : "";

const clearError = (key) => {
  errors[key] = "";
};

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const validateForm = () => {
  clearErrors();

  const salary = Number(localData.value.salary);
  if (localData.value.salary === "" || localData.value.salary === null) {
    errors.salary = "Salary is required.";
  } else if (!Number.isFinite(salary) || salary <= 0) {
    errors.salary = "Salary must be greater than 0.";
  }
  if (!localData.value.effectiveDate) errors.effectiveDate = "Effective date is required.";
  if (!String(localData.value.changeReason || "").trim()) {
    errors.changeReason = "Change reason is required.";
  } else if (String(localData.value.changeReason).length > 500) {
    errors.changeReason = "Reason must be 500 characters or less.";
  }

  return Object.values(errors).every((message) => !message);
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("submit", localData.value);
};
</script>
