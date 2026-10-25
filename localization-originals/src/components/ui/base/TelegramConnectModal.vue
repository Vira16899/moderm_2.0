<template>
  <BaseModal :is-open="isOpen" title="ភ្ជាប់ Telegram" @close="$emit('close')">
    <div class="text-center space-y-6">
      <div
        class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100"
      >
        <MessageSquareIcon class="w-10 h-10 text-blue-500" />
      </div>

      <div class="space-y-2">
        <h4 class="text-xl font-bold text-gray-900">តំណភ្ជាប់របស់អ្នក</h4>
        <p class="text-sm text-gray-500">
          បើកតំណភ្ជាប់នេះក្នុង Telegram ដើម្បីភ្ជាប់គណនីរបស់អ្នក
        </p>
      </div>

      <div
        class="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg"
      >
        <p class="flex-1 truncate text-xs text-[#84A98C] font-mono">
          {{ linkingUrl }}
        </p>
        <button
          @click="$emit('copy')"
          class="p-2 hover:bg-gray-100 rounded-md transition-all text-gray-400 hover:text-gray-600"
        >
          <CopyIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="pt-4 space-y-3">
        <a
          :href="linkingUrl"
          target="_blank"
          class="w-full flex items-center justify-center gap-2 bg-[#84A98C] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-md"
        >
          បើកក្នុង Telegram
          <ExternalLinkIcon class="w-4 h-4" />
        </a>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import {
  MessageSquare as MessageSquareIcon,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon,
} from "lucide-vue-next";
import BaseModal from "@/components/ui/base/BaseModal.vue";

defineProps({
  isOpen: Boolean,
  linkingUrl: String,
});

defineEmits(["close", "copy"]);
</script>
