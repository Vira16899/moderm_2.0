<template>
  <BaseModal
    :is-open="isOpen"
    :title="isEdit ? 'កែសម្រួលរបាយការណ៍' : 'បង្កើតរបាយការណ៍ថ្មី'"
    size="lg"
    @close="$emit('close')"
  >
    <form id="reportForm" novalidate @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
          <label class="block text-sm font-normal text-gray-700 mb-2">
            ចំណងជើងរបាយការណ៍ *
          </label>
          <input
            v-model="localData.title"
            type="text"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
            :class="fieldClass('title')"
            placeholder="Q1 2025 Performance Review"
            required
            @input="clearError('title')"
          />
          <p v-if="errors.title" class="text-red-400 text-xs mt-1">{{ errors.title }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            បុគ្គលិក *
          </label>
          <select
            v-model="localData.staffId"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
            :class="fieldClass('staffId')"
            required
            @change="clearError('staffId')"
          >
            <option value="">ជ្រើសរើសបុគ្គលិក</option>
            <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
              {{ staff.fullName }}
            </option>
          </select>
          <p v-if="errors.staffId" class="text-red-400 text-xs mt-1">{{ errors.staffId }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            Rating (1-5)
          </label>
          <select
            v-model.number="localData.rating"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
            :class="fieldClass('rating')"
            @change="clearError('rating')"
          >
            <option v-for="rating in 5" :key="rating" :value="rating">
              {{ rating }} - {{ getRatingLabel(rating) }}
            </option>
          </select>
          <p v-if="errors.rating" class="text-red-400 text-xs mt-1">{{ errors.rating }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            ថ្ងៃចាប់ផ្តើម *
          </label>
          <input
            v-model="localData.reportPeriodStart"
            type="date"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
            :class="fieldClass('reportPeriodStart')"
            required
            @input="clearError('reportPeriodStart')"
          />
          <p v-if="errors.reportPeriodStart" class="text-red-400 text-xs mt-1">{{ errors.reportPeriodStart }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            ថ្ងៃបញ្ចប់ *
          </label>
          <input
            v-model="localData.reportPeriodEnd"
            type="date"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
            :class="fieldClass('reportPeriodEnd')"
            required
            @input="clearError('reportPeriodEnd')"
          />
          <p v-if="errors.reportPeriodEnd" class="text-red-400 text-xs mt-1">{{ errors.reportPeriodEnd }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            សង្ខេបការងារ
          </label>
          <textarea
            v-model="localData.performanceSummary"
            rows="3"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] resize-none"
            :class="fieldClass('performanceSummary')"
            placeholder="Summary of overall performance..."
            @input="clearError('performanceSummary')"
          ></textarea>
          <p v-if="errors.performanceSummary" class="text-red-400 text-xs mt-1">{{ errors.performanceSummary }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            សមិទ្ធផលសំខាន់ៗ
          </label>
          <textarea
            v-model="localData.achievement"
            rows="3"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] resize-none"
            :class="fieldClass('achievement')"
            placeholder="What were the highlights of this period?"
            @input="clearError('achievement')"
          ></textarea>
          <p v-if="errors.achievement" class="text-red-400 text-xs mt-1">{{ errors.achievement }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            ចំណុចត្រូវកែលម្អ
          </label>
          <textarea
            v-model="localData.areaForImprove"
            rows="3"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] resize-none"
            :class="fieldClass('areaForImprove')"
            placeholder="What can be better next time?"
            @input="clearError('areaForImprove')"
          ></textarea>
          <p v-if="errors.areaForImprove" class="text-red-400 text-xs mt-1">{{ errors.areaForImprove }}</p>
        </div>

        <div>
          <label class="block text-sm font-normal text-gray-700 mb-2">
            មតិយោបល់
          </label>
          <textarea
            v-model="localData.comment"
            rows="3"
            class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] resize-none"
            :class="fieldClass('comment')"
            placeholder="Good overall progress. Keep it up!"
            @input="clearError('comment')"
          ></textarea>
          <p v-if="errors.comment" class="text-red-400 text-xs mt-1">{{ errors.comment }}</p>
        </div>
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
          form="reportForm"
          :disabled="loading"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{
            loading
              ? "កំពុងរក្សាទុក..."
              : isEdit
                ? "រក្សាទុកការផ្លាស់ប្តូរ"
                : "បង្កើតសេចក្តីព្រាង"
          }}
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
  isEdit: Boolean,
  loading: Boolean,
  staffMembers: {
    type: Array,
    default: () => [],
  },
  initialData: {
    type: Object,
    default: () => ({
      title: "",
      staffId: "",
      reportPeriodStart: "",
      reportPeriodEnd: "",
      performanceSummary: "",
      achievement: "",
      areaForImprove: "",
      comment: "",
      rating: 3,
    }),
  },
});

const emit = defineEmits(["close", "submit"]);

const localData = ref({ ...props.initialData });
const errors = reactive({
  title: "",
  staffId: "",
  rating: "",
  reportPeriodStart: "",
  reportPeriodEnd: "",
  performanceSummary: "",
  achievement: "",
  areaForImprove: "",
  comment: "",
});

watch(
  () => props.initialData,
  (newData) => {
    localData.value = { ...newData };
    clearErrors();
  },
  { deep: true },
);

const getRatingLabel = (rating) => {
  const labels = {
    1: "ខ្សោយ",
    2: "មធ្យម",
    3: "ល្អ",
    4: "ល្អណាស់",
    5: "ល្អប្រសើរ",
  };
  return labels[rating];
};

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

const hasTooManyCharacters = (value, limit) => String(value || "").length > limit;

const validateForm = () => {
  clearErrors();

  if (!String(localData.value.title || "").trim()) errors.title = "សូមបញ្ចូលចំណងជើងរបាយការណ៍";
  if (!localData.value.staffId) errors.staffId = "សូមជ្រើសរើសបុគ្គលិក";
  if (!Number.isInteger(Number(localData.value.rating)) || localData.value.rating < 1 || localData.value.rating > 5) {
    errors.rating = "ការវាយតម្លៃត្រូវតែនៅចន្លោះពី ១ ដល់ ៥";
  }
  if (!localData.value.reportPeriodStart) errors.reportPeriodStart = "សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម";
  if (!localData.value.reportPeriodEnd) errors.reportPeriodEnd = "សូមជ្រើសរើសថ្ងៃបញ្ចប់";
  if (
    localData.value.reportPeriodStart &&
    localData.value.reportPeriodEnd &&
    new Date(localData.value.reportPeriodEnd) < new Date(localData.value.reportPeriodStart)
  ) {
    errors.reportPeriodEnd = "ថ្ងៃបញ្ចប់ត្រូវតែក្រោយថ្ងៃចាប់ផ្តើម";
  }
  if (hasTooManyCharacters(localData.value.performanceSummary, 1000)) errors.performanceSummary = "មិនអាចលើសពី ១០០០ តួអក្សរ";
  if (hasTooManyCharacters(localData.value.achievement, 1000)) errors.achievement = "មិនអាចលើសពី ១០០០ តួអក្សរ";
  if (hasTooManyCharacters(localData.value.areaForImprove, 1000)) errors.areaForImprove = "មិនអាចលើសពី ១០០០ តួអក្សរ";
  if (hasTooManyCharacters(localData.value.comment, 1000)) errors.comment = "មិនអាចលើសពី ១០០០ តួអក្សរ";

  return Object.values(errors).every((message) => !message);
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("submit", localData.value);
};
</script>
