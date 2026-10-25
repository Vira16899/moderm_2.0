import test from 'node:test';
import assert from 'node:assert/strict';
import { createPasswordReset, createResetGuard, validPassword, validEmail, resetError, RESET_NOTICE, RESET_SUCCESS } from '../src/auth/passwordReset.js';
const ok = data => ({ data: { result: true, data }, status: 200 });
function fixture(handler = () => ok({}), initial = {}) {
  let time = 1000;
  const values = new Map(Object.entries(initial));
  const calls = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const reset = createPasswordReset({ storage, now: () => time, request: async c => { calls.push(c); return handler(c); } });
  return { reset, calls, values, advance: ms => time += ms };
}
const failure = (status, data = {}, headers = {}) => Object.assign(new Error('server error'), { response: { status, data, headers } });

test('recovery sends the exact contract without credentials, clears secrets, and never logs in', async () => {
  const { reset, calls, values } = fixture(c => ok(c.url === '/verify-reset-otp' ? { resetToken: 'reset-token' } : {}));
  await reset.requestOtp(' user@example.com ');
  assert.equal(reset.getEmail(), 'user@example.com');
  assert.equal(reset.state.notice, RESET_NOTICE);
  assert.equal(reset.remaining(), 30);
  await reset.verifyOtp('123456');
  assert.equal(reset.hasResetToken(), true);
  await reset.resetPassword('SecurePass123!', 'SecurePass123!');
  assert.deepEqual(calls.map(c => [c.method, c.url, c.data]), [
    ['POST', '/forgot-password', { email: 'user@example.com' }],
    ['POST', '/verify-reset-otp', { email: 'user@example.com', otp: '123456' }],
    ['PUT', '/reset-password', { token: 'reset-token', newPassword: 'SecurePass123!', confirmPass: 'SecurePass123!' }],
  ]);
  assert.equal(calls.every(c => c.skipAuth === true && !c.headers && !Object.hasOwn(c, 'auth')), true);
  assert.equal(values.size, 0);
  assert.equal(reset.state.notice, RESET_SUCCESS);
});

test('email and backend password rules reject invalid input before making requests', async () => {
  const { reset, calls } = fixture(() => ok({ resetToken: 'reset' }));
  for (const email of ['', 'invalid', 'test@', 'user @example.com']) { assert.equal(validEmail(email), false); await assert.rejects(reset.requestOtp(email)); }
  await reset.requestOtp('user@example.com'); await reset.verifyOtp('123456');
  const count = calls.length;
  for (const password of ['short', 'lowercase123!', 'UPPERCASE123!', 'NoNumbers!', 'NoSpecial123', 'Has Space123!', 'A'.repeat(31) + 'a1!']) {
    assert.equal(validPassword(password), false); await assert.rejects(reset.resetPassword(password, password));
  }
  assert.equal(validPassword('StrongPassword123!'), true);
  await assert.rejects(reset.resetPassword('StrongPassword123!', 'Different123!'), /ដូចគ្នា/);
  assert.equal(calls.length, count);
});

test('resend countdown persists through reload, enforces cooldown, and invalidates old reset tokens', async () => {
  const { reset, advance, calls, values } = fixture(c => ok(c.url === '/verify-reset-otp' ? { resetToken: 'old' } : {}));
  await reset.requestOtp('user@example.com');
  await assert.rejects(reset.resendOtp(), /រង់ចាំ/);
  await reset.verifyOtp('123456');
  advance(30000); await reset.resendOtp();
  assert.deepEqual(calls.at(-1).data, { email: 'user@example.com' });
  assert.equal(reset.hasResetToken(), false);
  assert.equal(reset.remaining(), 30);
  assert.equal([...values.values()].some(value => value.includes('123456') || value.includes('old')), false);
  advance(15 * 60000);
  assert.equal(reset.getEmail(), ''); assert.equal(values.size, 0);
});

test('route guard denies skipped, missing, and expired recovery steps', async () => {
  const { reset, advance } = fixture(() => ok({ resetToken: 'token' }));
  const guard = createResetGuard(reset);
  assert.equal(guard({ meta: { resetStage: 'verify' } }), '/forgot-password');
  await reset.requestOtp('user@example.com');
  assert.equal(guard({ meta: { resetStage: 'reset' } }), '/verify-reset-otp');
  await reset.verifyOtp('123456');
  assert.equal(guard({ meta: { resetStage: 'reset' } }), true);
  advance(15 * 60000);
  assert.equal(guard({ meta: { resetStage: 'reset' } }), '/forgot-password');
});

test('double submission is blocked while processing and cancelled responses cannot restore secrets', async () => {
  let finish;
  const { reset, calls, values } = fixture(() => new Promise(resolve => { finish = resolve; }));
  const pending = reset.requestOtp('user@example.com');
  assert.equal(reset.state.busy, true);
  await assert.rejects(reset.requestOtp('user@example.com'), /កំពុងដំណើរការ/);
  assert.equal(calls.length, 1);
  reset.clear(); finish(ok({}));
  await assert.rejects(pending, /បោះបង់/);
  assert.equal(reset.state.busy, false); assert.equal(values.size, 0);
});

test('rate limits use Retry-After, network errors remain retryable, and malformed verification is blocked', async () => {
  const limited = fixture(() => { throw failure(429, {}, { 'retry-after': '90' }); });
  await assert.rejects(limited.reset.requestOtp('user@example.com'));
  assert.equal(limited.reset.remaining(), 90);
  const network = fixture(() => { throw Object.assign(new Error('network'), { request: {} }); });
  await assert.rejects(network.reset.requestOtp('user@example.com'));
  assert.equal(network.reset.state.busy, false);
  const missing = fixture(() => ok({ verified: true }));
  await missing.reset.requestOtp('user@example.com');
  await assert.rejects(missing.reset.verifyOtp('123456'), /មិនអាចទទួលបានសិទ្ធិ/);
  assert.equal(missing.reset.hasResetToken(), false);
});

test('account-existence messages are never displayed and validation errors remain safe', () => {
  for (const phase of ['request', 'resend', 'verify', 'reset']) {
    const message = resetError(failure(404, { msg: 'Account exists but is inactive', details: ['user@example.com not found'] }), phase);
    assert.equal(/exists|inactive|not found|user@example/.test(message), false);
  }
  assert.match(resetError(failure(429), 'verify'), /ច្រើនដងពេក/);
  assert.match(resetError(Object.assign(new Error('network'), { request: {} }), 'request'), /ការតភ្ជាប់/);
  assert.match(resetError(failure(400, { details: ['Password must contain uppercase, lowercase, number, and special character'] }), 'reset'), /៨ ដល់ ៣០/);
  assert.match(resetError(failure(400, { details: ['Confirm password must match new password'] }), 'reset'), /ដូចគ្នា/);
  assert.match(resetError(failure(401), 'verify'), /មិនត្រឹមត្រូវ ឬផុតកំណត់/);
  assert.match(resetError(failure(401), 'reset'), /មិនត្រឹមត្រូវ ឬផុតកំណត់/);
});
