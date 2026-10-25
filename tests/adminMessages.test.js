import test from 'node:test';
import assert from 'node:assert/strict';
import { adminErrorMessage } from '../src/utils/adminMessages.js';

test('admin errors translate manager conflicts and common API failures into Khmer', () => {
  for (const message of ['This department already has a manager.', 'Email already exists', 'Network Error', 'Request failed (403).', 'Validate error: id is required']) {
    const translated = adminErrorMessage(new Error(message));
    assert.match(translated, /[\u1780-\u17ff]/u);
    assert.notEqual(translated, message);
  }
  assert.match(adminErrorMessage('This department already has a manager.'), /នាយកដ្ឋានផ្សេង/);
});

test('admin feedback preserves Khmer messages and safely handles unknown failures', () => {
  const message = 'សូមជ្រើសរើសមុខតំណែងត្រឹមត្រូវ។';
  assert.equal(adminErrorMessage(new Error(message)), message);
  for (const error of [undefined, '', new Error('SQL internal failure')]) {
    assert.equal(adminErrorMessage(error), 'មិនអាចបញ្ចប់សកម្មភាពនេះបានទេ។ សូមព្យាយាមម្ដងទៀត។');
  }
});
