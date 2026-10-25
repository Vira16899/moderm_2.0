import { reactive } from 'vue';
export const toasts = reactive([]);
let sequence = 0;
const timers = new Map();
export function dismissToast(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  const index = toasts.findIndex(toast => toast.id === id);
  if (index >= 0) toasts.splice(index, 1);
}
export function notify(message, type = 'success') {
  const id = ++sequence;
  if (toasts.length >= 3) dismissToast(toasts[0].id);
  toasts.push({ id, message, type });
  timers.set(id, setTimeout(() => dismissToast(id), type === 'error' ? 9000 : 6000));
}
