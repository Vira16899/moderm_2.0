<script setup>
import BaseModal from '../base/BaseModal.vue';
import BaseButton from '../base/BaseButton.vue';
import NotificationsView from '../../views/shared/NotificationsView.vue';
defineProps({ isOpen: Boolean, onClose: Function, onViewAll: Function });
</script>
<template>
  <BaseModal :model-value="isOpen" title="ការជូនដំណឹង" size="lg" show-header @close="onClose?.()">
    <NotificationsView v-if="isOpen" />
    <template #footer><BaseButton variant="outline" @click="onViewAll?.(); onClose?.()">មើលទាំងអស់</BaseButton><BaseButton @click="onClose?.()">បិទ</BaseButton></template>
  </BaseModal>
</template>
