import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSalary, salaryError } from '../src/utils/salaryMessages.js';

test('salary validation requires a reason and a valid amount before submitting', () => {
  assert.deepEqual(validateSalary('3030.5', 'Good'), {});
  assert.deepEqual(validateSalary(0, 'ការកែប្រែ'), {});
  assert.ok(validateSalary('', 'Reason').amount);
  for (const amount of [-1, Infinity, NaN, 'abc', '1.001']) assert.ok(validateSalary(amount, 'Reason').amount);
  assert.ok(validateSalary(777, '   ').description);
  assert.ok(validateSalary(777, 'a'.repeat(1001)).description);
});

test('salary errors translate backend validation and failures into Khmer', () => {
  const cases = ['Validate error: "description_salary" is not allowed to be empty', '"base_salary" must be a positive number', 'Network Error', 'Forbidden', 'Unexpected database failure'];
  for (const message of cases) {
    const errors = salaryError(new Error(message));
    assert.ok(Object.keys(errors).length);
    for (const text of Object.values(errors)) { assert.match(text, /[\u1780-\u17ff]/); assert.doesNotMatch(text, /[a-z]/i); }
  }
  assert.ok(salaryError(new Error(cases[0])).description);
});
