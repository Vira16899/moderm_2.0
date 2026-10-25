<template>
  <BaseModal
    :is-open="isOpen"
    title="លម្អិតរបាយការណ៍"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="report" class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
          >
            ចំណងជើង
          </label>
          <p class="text-lg font-normal text-gray-900">
            {{ report.title || "-" }}
          </p>
        </div>
        <StatusBadge :status="report.status" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="item in detailItems"
          :key="item.label"
          class="bg-gray-50 p-4 rounded-xl border border-gray-100"
        >
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
          >
            {{ item.label }}
          </label>
          <p class="text-gray-900">{{ item.value || "-" }}</p>
        </div>
      </div>

      <div v-if="report.rating" class="bg-gray-50 border border-gray-100 p-4 rounded-xl">
        <label
          class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-2"
        >
          កម្រិតពិន្ទុ
        </label>
        <div class="flex items-center gap-1.5">
          <span
            v-for="star in 5"
            :key="star"
            class="text-xl"
            :class="star <= Number(report.rating) ? 'text-amber-400' : 'text-gray-200'"
          >
            ★
          </span>
          <span class="ml-2 text-sm text-gray-500">
            {{ report.rating }}/5
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <div v-for="item in textItems" :key="item.label" v-show="item.value">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-2"
          >
            {{ item.label }}
          </label>
          <div
            class="bg-gray-50 border border-gray-100 p-5 rounded-xl text-gray-700 text-sm leading-relaxed whitespace-pre-line"
          >
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>

    <template v-if="report && canReview" #footer>
      <button
        type="button"
        :disabled="reviewLoading"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        @click="$emit('review')"
      >
        <CheckCircleIcon class="w-4 h-4" />
        {{ reviewLoading ? "កំពុងពិនិត្យ..." : "ពិនិត្យ" }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from "vue";
import { CheckCircle as CheckCircleIcon } from "lucide-vue-next";
import BaseModal from "@/components/ui/base/BaseModal.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";

const props = defineProps({
  isOpen: Boolean,
  report: {
    type: Object,
    default: null,
  },
  canReview: {
    type: Boolean,
    default: false,
  },
  reviewLoading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "review"]);

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const detailItems = computed(() => [
  { label: "បុគ្គលិក", value: props.report?.staffName },
  { label: "អ្នកគ្រប់គ្រង", value: props.report?.managerName },
  { label: "រយៈពេល", value: props.report?.period },
  { label: "កាលបរិច្ឆេទដាក់ស្នើ", value: formatDateTime(props.report?.submittedAt) },
  { label: "កាលបរិច្ឆេទពិនិត្យ", value: formatDateTime(props.report?.reviewedAt) },
]);

const textItems = computed(() => [
  {
    label: "សង្ខេបការងារ",
    value: props.report?.performanceSummary || props.report?.content,
  },
  { label: "សមិទ្ធផលសំខាន់ៗ", value: props.report?.achievement },
  { label: "ចំណុចត្រូវកែលម្អ", value: props.report?.areaForImprove },
  { label: "មតិយោបល់", value: props.report?.comment },
]);
</script>
