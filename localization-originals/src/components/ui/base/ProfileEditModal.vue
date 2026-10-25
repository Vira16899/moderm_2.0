<template>
  <BaseModal
    :is-open="isOpen"
    title="កែប្រែព័ត៌មាន"
    @close="$emit('close')"
  >
    <form
      id="profileEditForm"
      novalidate
      @submit.prevent="handleSubmit"
      class="space-y-5"
    >
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2"
          >ឈ្មោះពេញ <span class="text-red-500">*</span></label
        >
        <input
          v-model="localData.fullName"
          type="text"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('fullName')"
          placeholder="បញ្ចូលឈ្មោះពេញរបស់អ្នក"
          required
          @input="clearError('fullName')"
        />
        <p v-if="errors.fullName" class="text-red-400 text-xs mt-1">{{ errors.fullName }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2"
          >លេខទូរស័ព្ទ</label
        >
        <input
          v-model="localData.phoneNumber"
          type="tel"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('phoneNumber')"
          placeholder="+1234567890"
          @input="clearError('phoneNumber')"
        />
        <p v-if="errors.phoneNumber" class="text-red-400 text-xs mt-1">{{ errors.phoneNumber }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2"
          >ភេទ</label
        >
        <select
          v-model="localData.gender"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('gender')"
          @change="clearError('gender')"
        >
          <option value="">ជ្រើសរើសភេទ</option>
          <option value="MALE">ប្រុស</option>
          <option value="FEMALE">ស្រី</option>
        </select>
        <p v-if="errors.gender" class="text-red-400 text-xs mt-1">{{ errors.gender }}</p>
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
          form="profileEditForm"
          :disabled="loading"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
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
      fullName: "",
      phoneNumber: "",
      gender: "",
    }),
  },
});

const emit = defineEmits(["close", "submit"]);

const localData = ref({ ...props.initialData });
const errors = reactive({
  fullName: "",
  phoneNumber: "",
  gender: "",
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

  if (!String(localData.value.fullName || "").trim()) {
    errors.fullName = "Full name is required.";
  }
  if (
    localData.value.phoneNumber &&
    !/^[+()\d\s-]{7,20}$/.test(String(localData.value.phoneNumber))
  ) {
    errors.phoneNumber = "Enter a valid phone number.";
  }
  if (localData.value.gender && !["MALE", "FEMALE"].includes(localData.value.gender)) {
    errors.gender = "Select a valid gender.";
  }

  return Object.values(errors).every((message) => !message);
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("submit", localData.value);
};
</script>
