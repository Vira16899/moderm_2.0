<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { Megaphone } from 'lucide-vue-next';
import { announcementsApi } from '../../api/communicationsApi.js';
import { communicationList, communicationItem, announcementDetail } from '../../api/communications.js';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseModal from '../../components/base/BaseModal.vue';
import BaseState from '../../components/base/BaseState.vue';
import { auth } from '../../auth/index.js';

const props = defineProps({ currentRole: String });
const isAdmin = computed(() => props.currentRole === 'ADMIN');
const isManager = computed(() => props.currentRole === 'MANAGER');
const items = ref([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const search = ref('');
const title = ref('');
const message = ref('');
const selected = ref(null);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const deleting = ref(null);
let generation = 0;
let detailGeneration = 0;
let alive = true;
const visible = computed(() => items.value.filter(item => `${item.title} ${item.message}`.toLowerCase().includes(search.value.toLowerCase())));
function sessionKey() { return `${auth.state.user?.id}:${props.currentRole}`; }
async function load() {
  const token = ++generation;
  loading.value = true;
  error.value = '';
  try {
    const payload = await announcementsApi.list();
    if (alive && token === generation) items.value = communicationList(payload, 'announcements').map(communicationItem);
  } catch (failure) { if (alive && token === generation) error.value = failure.message; }
  finally { if (alive && token === generation) loading.value = false; }
}
async function openDetail(item) {
  const token = ++detailGeneration;
  const owner = sessionKey();
  selected.value = item;
  detailOpen.value = true;
  detailLoading.value = true;
  detailError.value = '';
  try {
    const payload = await announcementsApi.detail(item.id);
    if (alive && owner === sessionKey() && token === detailGeneration) selected.value = { ...item, ...announcementDetail(payload), id: item.id };
  } catch (failure) { if (alive && token === detailGeneration) detailError.value = failure.message; }
  finally { if (alive && token === detailGeneration) detailLoading.value = false; }
}
async function mutate(action, after) {
  if (busy.value) return;
  const owner = sessionKey();
  busy.value = true;
  error.value = '';
  try {
    await action();
    if (!alive || owner !== sessionKey()) return;
    after?.();
    await load();
  } catch (failure) { if (alive && owner === sessionKey()) error.value = failure.message; }
  finally { if (alive && owner === sessionKey()) busy.value = false; }
}
function publish() {
  if (!isAdmin.value || !title.value.trim() || !message.value.trim()) return;
  return mutate(() => announcementsApi.create({ title: title.value.trim(), message: message.value.trim() }), () => { title.value = ''; message.value = ''; });
}
function markRead(id) {
  if (!isManager.value) return;
  return mutate(() => id == null ? announcementsApi.readAll() : announcementsApi.read(id), () => {
    items.value = items.value.map(item => id == null || item.id === id ? { ...item, read: true } : item);
    if (selected.value && (id == null || selected.value.id === id)) selected.value = { ...selected.value, read: true };
  });
}
function remove() {
  if (!isAdmin.value || !deleting.value) return;
  const id = deleting.value.id;
  return mutate(() => announcementsApi.remove(id), () => {
    items.value = items.value.filter(item => item.id !== id);
    deleting.value = null;
    if (selected.value?.id === id) detailOpen.value = false;
  });
}
watch(sessionKey, () => {
  generation++; detailGeneration++;
  items.value = []; selected.value = null; detailOpen.value = false; deleting.value = null;
  title.value = ''; message.value = ''; busy.value = false;
  load();
}, { immediate: true });
onBeforeUnmount(() => { alive = false; generation++; detailGeneration++; });
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="flex items-center gap-3 text-2xl font-semibold"><Megaphone :size="24" />សេចក្តីជូនដំណឹង</h1>
      <div class="flex flex-wrap gap-2"><BaseButton variant="outline" :disabled="busy || loading" @click="load">ផ្ទុកឡើងវិញ</BaseButton><BaseButton v-if="isManager" :disabled="busy || loading || !items.some(item => !item.read)" @click="markRead()">សម្គាល់ថាបានអានទាំងអស់</BaseButton></div>
    </div>
    <form v-if="isAdmin" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900" @submit.prevent="publish">
      <h2 class="font-semibold">បង្កើតសេចក្តីជូនដំណឹង</h2>
      <label class="block space-y-2"><span>ចំណងជើង</span><input v-model="title" required :disabled="busy" class="w-full rounded-xl border border-slate-300 p-3 dark:bg-slate-900" /></label>
      <label class="block space-y-2"><span>សារ</span><textarea v-model="message" required rows="4" :disabled="busy" class="w-full rounded-xl border border-slate-300 p-3 dark:bg-slate-900"></textarea></label>
      <BaseButton type="submit" :loading="busy" :disabled="!title.trim() || !message.trim()">ផ្សព្វផ្សាយ</BaseButton>
    </form>
    <BaseState v-if="error" kind="error" :description="error"><BaseButton variant="outline" :disabled="busy || loading" @click="load">ព្យាយាមម្តងទៀត</BaseButton></BaseState>
    <input v-model="search" type="search" aria-label="ស្វែងរកសេចក្តីជូនដំណឹង" placeholder="ស្វែងរកសេចក្តីជូនដំណឹង..." class="w-full rounded-xl border border-slate-300 p-3 dark:bg-slate-900" />
    <p v-if="loading" role="status">កំពុងទាញយកសេចក្តីជូនដំណឹង...</p>
    <BaseState v-else-if="!error && !visible.length" title="គ្មានសេចក្តីជូនដំណឹង" />
    <article v-for="item in visible" :key="item.id" class="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div class="flex flex-wrap items-center gap-2"><h2 class="break-words font-semibold">{{ item.title }}</h2><span v-if="isManager && !item.read" class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">មិនទាន់អាន</span></div>
      <p class="whitespace-pre-wrap break-words text-sm">{{ item.message }}</p><time class="block text-xs text-slate-500">{{ item.timestamp }}</time>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" @click="openDetail(item)">មើលលម្អិត</BaseButton>
        <BaseButton v-if="isManager && !item.read" :disabled="busy || loading" @click="markRead(item.id)">សម្គាល់ថាបានអាន</BaseButton>
        <BaseButton v-if="isAdmin" variant="danger" :disabled="busy" @click="deleting = item">លុប</BaseButton>
      </div>
    </article>
    <BaseModal v-model="detailOpen" title="ព័ត៌មានលម្អិតសេចក្តីជូនដំណឹង" show-header :busy="busy">
      <p v-if="detailLoading" role="status">កំពុងទាញយក...</p>
      <BaseState v-else-if="detailError" kind="error" :description="detailError"><BaseButton @click="openDetail(selected)">ព្យាយាមម្តងទៀត</BaseButton></BaseState>
      <div v-else-if="selected" class="space-y-4"><h2 class="break-words text-lg font-semibold">{{ selected.title }}</h2><p class="whitespace-pre-wrap break-words">{{ selected.message }}</p><time class="text-xs text-slate-500">{{ selected.timestamp }}</time></div>
      <p v-if="error" role="alert" class="mt-3 text-rose-600">{{ error }}</p>
      <template #footer><BaseButton v-if="isManager && selected && !selected.read && !detailLoading && !detailError" :disabled="busy" @click="markRead(selected.id)">សម្គាល់ថាបានអាន</BaseButton><BaseButton variant="outline" :disabled="busy" @click="detailOpen = false">បិទ</BaseButton></template>
    </BaseModal>
    <BaseModal :model-value="Boolean(deleting)" title="លុបសេចក្តីជូនដំណឹង" show-header :busy="busy" @close="deleting = null">
      <p class="break-words">តើអ្នកចង់លុប «{{ deleting?.title }}» មែនទេ?</p>
      <p v-if="error" role="alert" class="mt-3 text-rose-600">{{ error }}</p>
      <template #footer><BaseButton variant="outline" :disabled="busy" @click="deleting = null">បោះបង់</BaseButton><BaseButton variant="danger" :loading="busy" @click="remove">លុប</BaseButton></template>
    </BaseModal>
  </section>
</template>
