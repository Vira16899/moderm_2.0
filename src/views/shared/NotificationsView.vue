<script setup>
import { computed, ref } from 'vue';
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-vue-next';
import { useNotificationsStore } from '../../stores/notifications.js';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseState from '../../components/base/BaseState.vue';
const store = useNotificationsStore();
const search = ref('');
const status = ref('all');
const filtered = computed(() => store.items.filter(item =>
  `${item.title} ${item.message}`.toLowerCase().includes(search.value.toLowerCase()) &&
  (status.value === 'all' || (status.value === 'read' ? item.read : !item.read))));
</script>
<template>
  <section class="space-y-5" aria-label="ការជូនដំណឹង">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h1 class="text-2xl font-semibold">ការជូនដំណឹង</h1><p class="text-sm text-slate-500" aria-live="polite">មិនទាន់អាន {{ store.count }}</p></div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :disabled="store.busy || store.loading" @click="store.refresh">ផ្ទុកឡើងវិញ</BaseButton>
        <BaseButton :disabled="store.busy || store.loading || !store.count" @click="store.markRead()"><CheckCheck :size="16" />សម្គាល់ថាបានអានទាំងអស់</BaseButton>
      </div>
    </div>
    <div class="flex flex-wrap gap-3">
      <input v-model="search" type="search" aria-label="ស្វែងរកការជូនដំណឹង" placeholder="ស្វែងរកការជូនដំណឹង..." class="rounded-xl border border-slate-300 p-3 dark:bg-slate-900" />
      <select v-model="status" class="filter-select" aria-label="ស្ថានភាព"><option value="all">ទាំងអស់</option><option value="unread">មិនទាន់អាន</option><option value="read">បានអាន</option></select>
    </div>
    <BaseState v-if="store.error" kind="error" :description="store.error"><BaseButton variant="outline" :disabled="store.loading || store.busy" @click="store.refresh">ព្យាយាមម្តងទៀត</BaseButton></BaseState>
    <p v-if="store.loading" role="status" class="py-6 text-slate-500">កំពុងទាញយកការជូនដំណឹង...</p>
    <BaseState v-else-if="!store.error && !filtered.length" title="គ្មានការជូនដំណឹង" />
    <article v-for="item in filtered" :key="item.id" class="flex items-start gap-3 rounded-2xl border p-4" :class="item.read ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900' : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-slate-800'">
      <Bell :size="20" class="mt-1 shrink-0 text-blue-600" />
      <div class="min-w-0 flex-1 space-y-2"><h2 class="font-semibold break-words">{{ item.title }}</h2><p class="whitespace-pre-wrap break-words text-sm">{{ item.message }}</p><time class="text-xs text-slate-500">{{ item.timestamp }}</time><p v-if="!item.read" class="text-xs text-blue-600">មិនទាន់អាន</p></div>
      <BaseButton v-if="!item.read" size="sm" variant="outline" :disabled="store.busy || store.loading" @click="store.markRead(item.id)"><CheckCircle2 :size="16" />បានអាន</BaseButton>
    </article>
  </section>
</template>
