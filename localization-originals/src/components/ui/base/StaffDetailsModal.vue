<template>
  <BaseModal
    :is-open="isOpen"
    title="លម្អិតអំពីបុគ្គលិក"
    size="md"
    @close="$emit('close')"
  >
    <div v-if="staff" class="space-y-6">
      <div class="flex flex-col items-center mb-6">
        <div
          class="w-20 h-20 rounded-full bg-[#84A98C] flex items-center justify-center text-white text-2xl font-normal mb-3 shadow-lg"
        >
          {{ staff.fullName.charAt(0) }}
        </div>
        <h3 class="text-xl font-normal text-gray-900">
          {{ staff.fullName }}
        </h3>
        <p class="text-sm text-gray-500">{{ staff.email }}</p>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
            >លេខទូរស័ព្ទ</label
          >
          <p class="text-gray-900 font-normal">
            {{ staff.phoneNumber || "-" }}
          </p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
            >ស្ថានភាព</label
          >
          <StatusBadge :status="staff.status" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
            >ប្រាក់បៀវត្ស</label
          >
          <p class="text-lg font-normal text-emerald-600">
            ${{
              staff && staff.salary
                ? staff.salary.toLocaleString()
                : "-"
            }}
          </p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label
            class="block text-xs font-normal text-gray-400 uppercase tracking-widest mb-1"
            >ថ្ងៃចូលធ្វើការ</label
          >
          <p class="text-gray-900 font-normal">
            {{
              staff.hireDate
                ? new Date(staff.hireDate).toLocaleDateString()
                : "-"
            }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
        >
          បិទ
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from "@/components/ui/base/BaseModal.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";

defineProps({
  isOpen: Boolean,
  staff: {
    type: Object,
    default: null,
  },
});

defineEmits(["close"]);
</script>
