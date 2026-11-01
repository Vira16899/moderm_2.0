<script setup>
import { computed } from 'vue';
import UserAvatar from './UserAvatar.vue';
const props = defineProps({ members: { type: Array, default: () => [] }, total: Number });
const shown = computed(() => props.members.slice(0, 3));
const count = computed(() => Math.max(props.members.length, props.total || 0));
const name = member => member.nameKh || member.khmer_name || member.nameEn || member.Eng_name || 'បុគ្គលិក';
</script>
<template>
  <span v-if="shown.length" class="avatar-stack" role="img" :aria-label="`${count} បុគ្គលិក៖ ${shown.map(name).join(', ')}`">
    <span v-for="member in shown" :key="member.id ?? member.user_id ?? member.employee_id" :title="name(member)"><UserAvatar :src="member.avatar || member.profile_image" :name="name(member)" :size="28" /></span>
    <span v-if="count > shown.length" class="avatar-stack-more">+{{ count - shown.length }}</span>
  </span>
</template>
<style scoped>
.avatar-stack { display:inline-flex; align-items:center; gap:0; flex-shrink:0; padding-left:5px; }
.avatar-stack>span { display:inline-flex; margin-left:-5px; border-radius:50%; background:var(--surface); }
.avatar-stack-more { min-width:28px; height:28px; justify-content:center; align-items:center; padding:0 5px; background:var(--soft)!important; color:var(--muted); font-size:10px; font-family:Inter,sans-serif; font-weight:600; }
</style>
