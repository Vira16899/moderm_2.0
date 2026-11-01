import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { createCommunicationsApi, communicationList, communicationItem, unreadCount, announcementDetail } from '../src/api/communications.js';

test('all communication endpoints use the specified methods, bodies and query parameters', async () => {
  const requests = [];
  const api = createCommunicationsApi(async (endpoint, options = {}) => { requests.push({ ...endpoint, ...options }); });
  await api.notifications.list();
  await api.notifications.unreadCount();
  await api.notifications.read(3);
  await api.notifications.readAll();
  await api.announcements.list();
  await api.announcements.detail(1);
  await api.announcements.create({ title: 'សេចក្តីជូនដំណឹង', message: 'សូមចូលរួមប្រជុំថ្ងៃស្អែក', role: 'ADMIN' });
  await api.announcements.read(1);
  await api.announcements.readAll();
  await api.announcements.remove(1);
  assert.deepEqual(requests, [
    { method: 'GET', path: '/api/notifications' },
    { method: 'GET', path: '/api/notifications/unread-count' },
    { method: 'PATCH', path: '/api/notifications/read', body: { id: 3 } },
    { method: 'PATCH', path: '/api/notifications/read-all' },
    { method: 'GET', path: '/api/announcements' },
    { method: 'GET', path: '/api/announcements/detail', query: { id: 1 } },
    { method: 'POST', path: '/api/announcements', body: { title: 'សេចក្តីជូនដំណឹង', message: 'សូមចូលរួមប្រជុំថ្ងៃស្អែក' } },
    { method: 'PATCH', path: '/api/announcements/read', body: { id: 1 } },
    { method: 'PATCH', path: '/api/announcements/read-all' },
    { method: 'DELETE', path: '/api/announcements', query: { id: 1 } },
  ]);
});

test('communication responses normalize wrapped lists, read flags, counts and Khmer text', () => {
  const rows = communicationList({ data: { notifications: [null, { notification_id: 3, title: 'ជូនដំណឹង', message: 'សារ', is_read: '0' }] } }, 'notifications');
  assert.equal(rows.length, 1);
  assert.deepEqual(communicationItem(rows[0]), { ...rows[0], id: 3, title: 'ជូនដំណឹង', message: 'សារ', read: false, timestamp: '' });
  for (const value of [true, 1, '1', 'true']) assert.equal(communicationItem({ is_read: value }).read, true);
  for (const value of [false, 0, '0', 'false']) assert.equal(communicationItem({ is_read: value }).read, false);
  assert.equal(unreadCount({ data: { unread_count: '4' } }), 4);
  assert.equal(unreadCount({ count: 0 }), 0);
  assert.throws(() => unreadCount({ count: 'unknown' }));
  assert.equal(announcementDetail({ data: { announcement: { id: 1, title: 'Meeting' } } }).title, 'Meeting');
});

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { resolve, promise }; };

test('notifications persist read changes only after success, synchronize count and discard stale session responses', async () => {
  const auth = { state: { user: { id: 1 } } };
  let fail = false;
  let count = 2;
  let list = () => Promise.resolve({ data: [{ id: 3, title: 'Meeting', is_read: 0 }, { id: 4, is_read: 0 }] });
  const calls = [];
  const notificationsApi = {
    list: () => list(), unreadCount: async () => ({ unread_count: count }),
    read: async id => { calls.push(id); if (fail) throw new Error('Cannot mark read'); count--; },
    readAll: async () => { count = 0; },
  };
  // Load the real store with isolated auth and API dependencies, using native Vue/Pinia.
  globalThis.__communicationsTest = { defineStore, ref, auth, notificationsApi, communicationList, communicationItem, unreadCount };
  const source = (await readFile(new URL('../src/stores/notifications.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '')
    .replace("export const useNotificationsStore", "const { defineStore, ref, auth, notificationsApi, communicationList, communicationItem, unreadCount } = globalThis.__communicationsTest;\nexport const useNotificationsStore");
  const { useNotificationsStore } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  delete globalThis.__communicationsTest;
  setActivePinia(createPinia());
  const store = useNotificationsStore();
  await store.refresh();
  assert.equal(store.count, 2);
  fail = true;
  await store.markRead(3);
  assert.equal(store.items[0].read, false);
  assert.equal(store.count, 2);
  assert.equal(store.error, 'Cannot mark read');
  fail = false;
  await store.markRead(3);
  assert.equal(store.items[0].read, true);
  assert.equal(store.count, 1);
  await store.markRead(3);
  assert.deepEqual(calls, [3, 3], 'already-read notifications cannot be toggled unread');
  await store.markRead();
  assert.ok(store.items.every(item => item.read));
  assert.equal(store.count, 0);
  const stale = deferred();
  list = () => stale.promise;
  const pending = store.refresh();
  store.reset();
  auth.state.user = { id: 2 };
  stale.resolve([{ id: 99, message: 'Previous user' }]);
  await pending;
  assert.deepEqual(store.items, []);
  assert.equal(store.count, 0);
  assert.equal(store.loading, false);
});
