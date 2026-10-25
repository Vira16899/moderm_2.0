<script setup>
import { LogOut } from 'lucide-vue-next';
import { translations as t } from '../../i18n/translations';
import { BaseButton, BaseModal } from '../base';

defineProps({ isOpen: Boolean });
defineEmits(['close', 'confirm']);
</script>

<template>
  <BaseModal :model-value="isOpen" :title="t.logout" class="logout-modal" @close="$emit('close')">
    <div id="logout-confirmation-modal" class="text-center space-y-4">
      <div class="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <LogOut class="w-5 h-5" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ t.logout }}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ t.logoutConfirm }}</p>
      </div>
      <div class="flex gap-2.5 pt-2">
        <BaseButton variant="secondary" class="flex-1" autofocus @click="$emit('close')">{{ t.cancel }}</BaseButton>
        <BaseButton variant="danger" class="flex-1" @click="$emit('confirm')">{{ t.logout }}</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.logout-modal { max-width: 24rem; }
</style>
