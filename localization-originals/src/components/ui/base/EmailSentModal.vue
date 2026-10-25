<template>
  <BaseModal
    :is-open="isOpen"
    title="ពិនិត្យអ៊ីមែលរបស់អ្នក"
    @close="$emit('close')"
  >
    <div class="flex flex-col items-center py-4 text-center">
      <div
        class="w-16 h-16 bg-[#84A98C]/10 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircleIcon class="w-10 h-10 text-[#84A98C]" />
      </div>
      <h3 class="text-xl font-normal text-gray-900 mb-2">
        តំណភ្ជាប់ត្រូវបានផ្ញើ
      </h3>
      <p class="text-gray-500 mb-8">
        តំណភ្ជាប់សម្រាប់បញ្ជាក់អ៊ីមែលថ្មី ត្រូវបានផ្ញើទៅកាន់
        <span class="font-semibold text-gray-700">{{ email }}</span>
        រួចរាល់ហើយ។ សូមពិនិត្យប្រអប់សំបុត្ររបស់អ្នក។
      </p>

      <div class="w-full space-y-3">
        <a
          href="https://mail.google.com/"
          target="_blank"
          class="w-full bg-[#84A98C] text-white py-3 rounded-lg font-normal hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          បើក Gmail
        </a>
        <button
          @click="$emit('close')"
          class="w-full text-gray-500 hover:text-gray-700 text-sm transition-colors py-2"
        >
          បិទ
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { CheckCircle as CheckCircleIcon } from "lucide-vue-next";
import BaseModal from "@/components/ui/base/BaseModal.vue";

defineProps({
  isOpen: Boolean,
  email: String,
});

defineEmits(["close"]);
</script>
