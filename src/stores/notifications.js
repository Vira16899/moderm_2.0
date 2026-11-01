import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsApi } from '../api/communicationsApi.js';
import { communicationList, communicationItem, unreadCount } from '../api/communications.js';
import { auth } from '../auth/index.js';

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([]);
  const count = ref(0);
  const loading = ref(false);
  const busy = ref(false);
  const error = ref('');
  let generation = 0;
  let revision = 0;
  function reset() {
    generation++;
    revision++;
    items.value = []; count.value = 0; error.value = ''; loading.value = false; busy.value = false;
  }
  async function refresh() {
    if (!auth.state.user || busy.value) return;
    const token = ++generation;
    const version = revision;
    loading.value = true;
    error.value = '';
    const results = await Promise.allSettled([notificationsApi.list(), notificationsApi.unreadCount()]);
    if (token !== generation || version !== revision) return;
    try {
      if (results[0].status === 'fulfilled') items.value = communicationList(results[0].value, 'notifications').map(communicationItem);
      if (results[1].status === 'fulfilled') count.value = unreadCount(results[1].value);
      const failure = results.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
    } catch (failure) { error.value = failure.message || 'មិនអាចទាញយកការជូនដំណឹងបានទេ។'; }
    finally { loading.value = false; }
  }
  async function markRead(id) {
    if (busy.value || (id != null && items.value.find(item => item.id === id)?.read)) return;
    const token = generation;
    revision++;
    loading.value = false;
    busy.value = true;
    error.value = '';
    try {
      await (id == null ? notificationsApi.readAll() : notificationsApi.read(id));
      if (token !== generation) return;
      items.value = items.value.map(item => id == null || item.id === id ? { ...item, read: true } : item);
      count.value = id == null ? 0 : Math.max(0, count.value - 1);
      // A server count also accounts for notifications received during the mutation.
      const payload = await notificationsApi.unreadCount();
      if (token === generation) count.value = unreadCount(payload);
    } catch (failure) { if (token === generation) error.value = failure.message || 'មិនអាចសម្គាល់ថាបានអានទេ។'; }
    finally { if (token === generation) busy.value = false; }
  }
  return { items, count, loading, busy, error, reset, refresh, markRead };
});
