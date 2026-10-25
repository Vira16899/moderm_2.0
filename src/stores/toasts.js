import { reactive } from 'vue';
export const toasts = reactive([]);
let sequence = 0;
const timers = new Map();
function schedule(id, entry) {
  entry.startedAt = Date.now();
  entry.handle = setTimeout(() => dismissToast(id), entry.remaining);
}
export function dismissToast(id) {
  clearTimeout(timers.get(id)?.handle);
  timers.delete(id);
  const index = toasts.findIndex(toast => toast.id === id);
  if (index >= 0) toasts.splice(index, 1);
}
export function pauseToast(id, reason = 'pointer') {
  const entry = timers.get(id);
  if (!entry || entry.pauses.has(reason)) return;
  if (!entry.pauses.size) {
    clearTimeout(entry.handle);
    entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
  }
  entry.pauses.add(reason);
}
export function resumeToast(id, reason = 'pointer') {
  const entry = timers.get(id);
  if (!entry || !entry.pauses.delete(reason) || entry.pauses.size) return;
  schedule(id, entry);
}
export function notify(message, type = 'success') {
  const id = ++sequence;
  if (toasts.length >= 3) dismissToast(toasts[0].id);
  toasts.push({ id, message, type });
  const entry = { remaining:type === 'error' ? 9000 : 6000, pauses:new Set(), startedAt:0, handle:null };
  timers.set(id, entry);
  schedule(id, entry);
  return id;
}
