<template>
  <BaseModal
    :is-open="isOpen"
    title="ការមើលរបាយការណ៍ជាមុន"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="report" class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-normal text-gray-900">
          {{ report.title }}
        </h3>
        <StatusBadge :status="report.status" />
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
            >Staff</label
          >
          <p class="text-gray-900 font-normal">
            {{ report.staffName }}
          </p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
            >រយៈពេល</label
          >
          <p class="text-gray-900 font-normal">{{ report.period }}</p>
        </div>
      </div>

      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <label
          class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-2"
          >Rating</label
        >
        <div class="flex items-center gap-1.5">
          <span
            v-for="star in 5"
            :key="star"
            class="text-xl"
            :class="
              star <= report.rating
                ? 'text-amber-400'
                : 'text-gray-200'
            "
            >★</span
          >
          <span class="ml-2 text-sm text-gray-500"
            >({{ getRatingLabel(report.rating) }})</span
          >
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="report.performanceSummary">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-2"
            >សង្ខេបការងារ</label
          >
          <p
            class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100"
          >
            {{ report.performanceSummary }}
          </p>
        </div>
        <div v-if="report.achievement">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-2"
            >សមិទ្ធផលសំខាន់ៗ</label
          >
          <p
            class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100"
          >
            {{ report.achievement }}
          </p>
        </div>
        <div v-if="report.areaForImprove">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-2"
            >ចំណុចត្រូវកែលម្អ</label
          >
          <p
            class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100"
          >
            {{ report.areaForImprove }}
          </p>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from "@/components/ui/base/BaseModal.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";

defineProps({
  isOpen: Boolean,
  report: {
    type: Object,
    default: null,
  },
});

defineEmits(["close"]);

const getRatingLabel = (r) => {
  const labels = {
    1: "ខ្សោយ",
    2: "មធ្យម",
    3: "ល្អ",
    4: "ល្អណាស់",
    5: "ល្អប្រសើរ",
  };
  return labels[r];
};
</script>
