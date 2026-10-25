import test from 'node:test';
import assert from 'node:assert/strict';
import { toasts, notify, dismissToast, pauseToast, resumeToast } from '../src/stores/toasts.js';
const clear = () => { for (const toast of [...toasts]) dismissToast(toast.id); };
test('toasts allow Khmer reading time and pause until both pointer and keyboard leave', context => {
  context.mock.timers.enable({apis:['setTimeout','Date']});
  try {
    const id = notify('បានចូលប្រើប្រាស់ដោយជោគជ័យ។');
    context.mock.timers.tick(2000);
    pauseToast(id);
    pauseToast(id, 'focus');
    context.mock.timers.tick(10000);
    assert.equal(toasts.length, 1);
    resumeToast(id);
    context.mock.timers.tick(10000);
    assert.equal(toasts.length, 1);
    resumeToast(id, 'focus');
    context.mock.timers.tick(3999);
    assert.equal(toasts.length, 1);
    context.mock.timers.tick(1);
    assert.equal(toasts.length, 0);
    notify('មិនអាចទាញយកព័ត៌មានបានទេ។', 'error');
    context.mock.timers.tick(8999);
    assert.equal(toasts.length, 1);
    context.mock.timers.tick(1);
    assert.equal(toasts.length, 0);
  } finally { clear(); context.mock.timers.reset(); }
});
test('toast limits and manual dismissal also clear paused timers', context => {
  context.mock.timers.enable({apis:['setTimeout','Date']});
  try {
    const first = notify('first'); pauseToast(first);
    notify('second'); notify('third'); notify('fourth');
    assert.equal(toasts.length,3);
    assert.ok(!toasts.some(toast => toast.id === first));
    resumeToast(first);
    dismissToast(toasts[0].id);
    context.mock.timers.tick(6000);
    assert.equal(toasts.length,0);
  } finally { clear(); context.mock.timers.reset(); }
});
