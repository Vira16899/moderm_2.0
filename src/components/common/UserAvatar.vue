<script setup>
import { computed, ref, watch } from 'vue';
import { UserRound } from 'lucide-vue-next';
import { API_BASE_URL } from '../../auth/index.js';
import { avatarUrl } from '../../api/profile.js';

const props = defineProps({ src: String, name: String, size: { type: Number, default: 30 } });
const initials = computed(() => (props.name || '').trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase());
const resolved = computed(() => avatarUrl(props.src, API_BASE_URL));
const failed = ref(false);
watch(resolved, () => { failed.value = false; });
</script>

<template>
  <span class="user-avatar" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <img v-if="resolved && !failed" :src="resolved" alt="" class="user-avatar-image" @error="failed = true" />
    <span v-else-if="initials" class="avatar-initials">{{ initials }}</span>
    <UserRound v-else :size="Math.round(size * .58)" />
  </span>
</template>

<style scoped>
.user-avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; overflow: hidden; background: var(--soft); color: var(--blue); border: 0; }
.user-avatar-image { width: 100% !important; height: 100% !important; border-radius: 50%; object-fit: cover; }
.avatar-initials { font-size: 12px; font-weight: 600; }
</style>
