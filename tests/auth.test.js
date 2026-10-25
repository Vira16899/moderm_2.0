import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createSession, dashboardPath, normalizeUser } from '../src/auth/session.js';
import { createAuthGuard } from '../src/auth/guard.js';
import { installAuthInterceptors } from '../src/auth/interceptors.js';

const response = (data, status = 200) => ({ data, status });
const user = (role_id = 2, extra = {}) => ({ id: 7, role_id, status: 'active', email: 'user@example.com', ...extra });
const tokenPair = { accessToken: 'access', refreshToken: 'refresh' };
function failure(status, message) { return Object.assign(new Error(message), { response: { status, data: { message } } }); }
const networkError = () => Object.assign(new Error('Network Error'), { request: {} });
function fixture(handler, entries = {}, options = {}) {
  const saved = new Map(Object.entries(entries));
  const calls = [];
  const storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
  const auth = createSession({ ...options, storage, request: async config => { calls.push(config); return handler(config, calls); } });
  return { auth, saved, calls };
}

for (const [role_id, role] of [[2, 'manager'], [3, 'employee']]) {
  test(`${role} login verifies getMe and uses its own dashboard`, async () => {
    const { auth, calls, saved } = fixture(c => c.url === '/login' ? response({ data: { ...tokenPair, role_id } }) : response({ data: { user: user(role_id) } }));
    const me = await auth.login(' user@example.com ', ' exact password ');
    assert.equal(dashboardPath(me), `/${role}/dashboard`);
    assert.deepEqual(calls[0].data, { email: 'user@example.com', password: ' exact password ' });
    assert.equal(calls[1].url, '/getMe');
    assert.equal(calls[1].headers.Authorization, 'Bearer access');
    assert.deepEqual([...saved], [['modern_factory_refresh', 'refresh']]);
  });
}

test('admin challenge never authenticates before real OTP verification', async () => {
  const { auth, saved, calls } = fixture(c => {
    if (c.url === '/login') return response({ role_id: 1, challengeToken: 'challenge', ...tokenPair }, 202);
    if (c.url === '/admin/verify-otp') return response(tokenPair);
    return response(user(1));
  });
  assert.equal(await auth.login('admin@example.com', 'password'), null);
  assert.equal(auth.state.user, null);
  assert.equal(auth.getAccessToken(), null);
  assert.equal(saved.get('modern_factory_refresh'), undefined);
  assert.equal(auth.getChallenge(), 'challenge');
  assert.equal(dashboardPath(await auth.verifyOtp('123456')), '/admin/dashboard');
  assert.deepEqual(calls[1].data, { otp: '123456', challengeToken: 'challenge' });
  assert.equal(auth.getChallenge(), null);
});

test('admin direct token response and unsupported login roles are rejected', async () => {
  for (const data of [{ role_id: 1, ...tokenPair }, { role_id: 99, ...tokenPair }]) {
    const { auth } = fixture(() => response(data));
    await assert.rejects(auth.login('user@example.com', 'password'));
    assert.equal(auth.state.user, null);
    assert.equal(auth.getAccessToken(), null);
  }
});

test('invalid credentials do not authenticate', async () => {
  const { auth } = fixture(() => { throw failure(401, 'Invalid credentials'); });
  await assert.rejects(auth.login('user@example.com', 'wrong'), /Invalid credentials/);
  assert.equal(auth.state.user, null);
});

test('missing token, role mismatch, inactive and unsupported getMe cannot grant access', async () => {
  for (const [login, me] of [
    [{ role_id: 2, accessToken: 'access' }, user()],
    [{ role_id: 2, ...tokenPair }, user(3)],
    [{ role_id: 2, ...tokenPair }, user(2, { status: 'inactive' })],
    [{ role_id: 2, ...tokenPair }, user(77)],
  ]) {
    const { auth, saved } = fixture(c => response(c.url === '/login' ? login : me));
    await assert.rejects(auth.login('user@example.com', 'password'));
    assert.equal(auth.state.user, null);
    assert.equal(saved.size, 0);
  }
});

test('invalid/expired OTP retains challenge for retry and resend updates challenge', async () => {
  const { auth } = fixture(c => {
    if (c.url === '/admin/verify-otp') throw failure(400, 'OTP expired');
    return response({ data: { challengeToken: 'replacement' } });
  }, { modern_factory_challenge: 'old' });
  await assert.rejects(auth.verifyOtp('111111'), /OTP expired/);
  assert.equal(auth.state.user, null);
  assert.equal(auth.getChallenge(), 'old');
  await auth.resendOtp();
  assert.equal(auth.getChallenge(), 'replacement');
});

test('OTP page without challenge cannot verify or resend', async () => {
  const { auth, calls } = fixture(() => { throw new Error('Should not call'); });
  await assert.rejects(auth.verifyOtp('123456'));
  await assert.rejects(auth.resendOtp());
  assert.equal(calls.length, 0);
});

test('reload restores refresh token, rotates tokens, verifies getMe, ignores stored role', async () => {
  const { auth, calls, saved } = fixture(c => c.url === '/refresh-token'
    ? response({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } }) : response(user(3)),
    { modern_factory_refresh: 'old-refresh', role_id: '1', accessToken: 'forged' });
  assert.equal(auth.state.user, null);
  assert.equal(dashboardPath(await auth.verifyUser()), '/employee/dashboard');
  assert.deepEqual(calls[0].data, { refreshToken: 'old-refresh' });
  assert.equal(calls[1].headers.Authorization, 'Bearer new-access');
  assert.equal(saved.get('modern_factory_refresh'), 'new-refresh');
});

test('expired access refreshes and concurrent refresh calls share one request', async () => {
  let expired = false;
  const { auth, calls } = fixture(c => {
    if (c.url === '/login') return response({ role_id: 2, ...tokenPair });
    if (c.url === '/refresh-token') return response({ accessToken: 'rotated' });
    if (expired && c.headers.Authorization === 'Bearer access') throw failure(401, 'Expired');
    return response(user());
  });
  await auth.login('user@example.com', 'password');
  expired = true;
  assert.equal((await auth.verifyUser()).role, 'MANAGER');
  await Promise.all([auth.refresh(), auth.refresh(), auth.refresh()]);
  assert.equal(calls.filter(c => c.url === '/refresh-token').length, 2);
});

test('invalid refresh clears credentials; network errors preserve refresh for retry', async () => {
  for (const error of [failure(401, 'Session expired'), networkError()]) {
    const { auth, saved } = fixture(() => { throw error; }, { modern_factory_refresh: 'refresh' });
    await assert.rejects(auth.verifyUser());
    assert.equal(auth.state.user, null);
    assert.equal(auth.getAccessToken(), null);
    assert.equal(saved.has('modern_factory_refresh'), !error.response);
  }
});

test('a refresh finishing after sign-out cannot restore a session', async () => {
  let finish;
  const { auth, saved } = fixture(() => new Promise(resolve => { finish = resolve; }), { modern_factory_refresh: 'refresh' });
  const pending = auth.refresh();
  auth.clear();
  finish(response(tokenPair));
  await assert.rejects(pending);
  assert.equal(auth.state.user, null);
  assert.equal(saved.size, 0);
});

for (const status of [undefined, 429, 503]) {
  test(`API refresh failure ${status ?? 'offline'} preserves credentials and can recover`, async () => {
    let unavailable = true;
    let refreshCount = 0;
    const { auth, saved } = fixture(c => {
      if (c.url === '/refresh-token') {
        refreshCount++;
        if (unavailable) throw status ? failure(status, 'Temporarily unavailable') : networkError();
        return response({ data: { accessToken: 'recovered', refreshToken: 'rotated-refresh' } });
      }
      return response(user());
    }, { modern_factory_refresh: 'refresh' });
    const http = axios.create({ adapter: async config => ({ data: { ok: true }, status: 200, headers: {}, config }) });
    installAuthInterceptors(http, auth);
    await assert.rejects(http.get('/getAllUsers'));
    assert.equal(saved.get('modern_factory_refresh'), 'refresh');
    assert.equal(auth.getAccessToken(), null);
    unavailable = false;
    const result = await http.get('/getAllUsers');
    assert.equal(result.config.headers.Authorization, 'Bearer recovered');
    assert.equal(saved.get('modern_factory_refresh'), 'rotated-refresh');
    assert.equal(auth.state.user.role, 'MANAGER');
    assert.equal(refreshCount, 2);
  });
}

test('temporary identity lookup failure preserves the rotated refresh token for recovery', async () => {
  let unavailable = true;
  const { auth, saved, calls } = fixture(c => {
    if (c.url === '/refresh-token') return response({ data: { accessToken: 'rotated', refreshToken: 'new-refresh' } });
    if (unavailable) throw failure(503, 'Temporarily unavailable');
    return response(user());
  }, { modern_factory_refresh: 'refresh' });
  await assert.rejects(auth.verifyUser());
  assert.equal(saved.get('modern_factory_refresh'), 'new-refresh');
  assert.equal(auth.state.user, null);
  unavailable = false;
  assert.equal((await auth.verifyUser()).role, 'MANAGER');
  assert.deepEqual(calls.filter(c => c.url === '/refresh-token').map(c => c.data.refreshToken), ['refresh', 'new-refresh']);
});

test('logout calls backend and clears session even on network failure', async () => {
  for (const fail of [false, true]) {
    const { auth, calls, saved } = fixture(c => {
      if (c.url === '/login') return response({ role_id: 2, ...tokenPair });
      if (c.url === '/logout') { if (fail) throw networkError(); return response({ result: true }); }
      return response(user());
    });
    await auth.login('user@example.com', 'password');
    await auth.logout();
    const logout = calls.find(c => c.url === '/logout');
    assert.equal(logout.method, 'PUT');
    assert.equal(logout.headers.Authorization, 'Bearer access');
    assert.deepEqual(logout.data, { refreshToken: 'refresh' });
    assert.equal(auth.getAccessToken(), null);
    assert.equal(auth.state.user, null);
    assert.equal(saved.size, 0);
    assert.equal(Boolean(auth.state.message), fail);
  }
});

test('guard checks getMe, prevents cross-role access, and handles guest/OTP routes', async () => {
  const { auth, calls } = fixture(c => c.url === '/login' ? response({ role_id: 3, ...tokenPair }) : response(user(3)));
  const guard = createAuthGuard(auth);
  assert.equal(await guard({ path: '/admin/users', meta: { requiresAuth: true, role: 'ADMIN' } }), '/login');
  assert.equal(await guard({ path: '/verify-admin-otp', meta: { guestOnly: true, adminOtp: true } }), '/login');
  await auth.login('user@example.com', 'password');
  const before = calls.length;
  assert.equal(await guard({ path: '/admin/users', meta: { requiresAuth: true, role: 'ADMIN' } }), '/employee/dashboard');
  assert.equal(calls.length, before + 1);
  assert.equal(await guard({ path: '/employee/dashboard', meta: { requiresAuth: true, role: 'EMPLOYEE' } }), true);
  assert.equal(await guard({ path: '/login', meta: { guestOnly: true } }), '/employee/dashboard');
  assert.equal(await guard({ path: '/attendanceQrDisplay', meta: {} }), true);
});

test('workspace switches reuse recent verification, expire it, and force entry and cross-role checks', async () => {
  let clock = 1000;
  const { auth, calls } = fixture(c => c.url === '/login' ? response({ role_id: 2, ...tokenPair }) : response(user()), {}, { now: () => clock });
  await auth.login('user@example.com', 'password');
  const guard = createAuthGuard(auth);
  const page = { meta: { requiresAuth: true, role: 'MANAGER' } };
  const count = () => calls.filter(c => c.url === '/getMe').length;
  const initial = count();
  for (let i = 0; i < 5; i++) assert.equal(await guard(page, page), true);
  assert.equal(count(), initial, 'quick switches make no extra identity requests');
  clock += 15_000;
  assert.equal(await guard(page, page), true);
  assert.equal(count(), initial + 1, 'verification expires after 15 seconds');
  assert.equal(await guard(page, { meta: {} }), true);
  assert.equal(count(), initial + 2, 'initial entry always verifies');
  assert.equal(await guard({ meta: { requiresAuth: true, role: 'ADMIN' } }, page), '/manager/dashboard');
  assert.equal(count(), initial + 3, 'cross-role access always verifies');
  await auth.verifyUser();
  assert.equal(count(), initial + 4, 'default verification never uses the cache');
});

test('failed identity checks invalidate recent verification and cannot permit cached navigation', async () => {
  let fail = false;
  const { auth } = fixture(c => {
    if (fail) throw networkError();
    return c.url === '/login' ? response({ role_id: 2, ...tokenPair }) : response(user());
  });
  await auth.login('user@example.com', 'password');
  fail = true;
  await assert.rejects(auth.verifyUser());
  const page = { meta: { requiresAuth: true, role: 'MANAGER' } };
  assert.equal(await createAuthGuard(auth)(page, page), '/login');
  assert.equal(auth.state.user, null);
  auth.clear();
  assert.equal(await auth.verifyUser({ maxAge: 15_000 }), null);
});

test('guard denies network errors and inactive sessions without rendering protected pages', async () => {
  const { auth } = fixture(() => { throw networkError(); }, { modern_factory_refresh: 'refresh' });
  assert.equal(await createAuthGuard(auth)({ path: '/manager/dashboard', meta: { requiresAuth: true, role: 'MANAGER' } }), '/login');
  assert.equal(auth.state.message, 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។');
  assert.throws(() => normalizeUser(user(2, { is_active: false })), /inactive/);
});

test('pending admin challenge survives reload and guard requires OTP', async () => {
  const { auth } = fixture(() => { throw new Error('No API expected'); }, { modern_factory_challenge: 'challenge' });
  const guard = createAuthGuard(auth);
  assert.equal(await guard({ path: '/admin/dashboard', meta: { requiresAuth: true, role: 'ADMIN' } }), '/verify-admin-otp');
  assert.equal(await guard({ path: '/verify-admin-otp', meta: { guestOnly: true, adminOtp: true } }), true);
});

test('Axios sends bearer token, shares refresh across 401s, and retries requests once', async () => {
  let current = 'old'; let refreshCount = 0; let clearCount = 0;
  let refreshing;
  const auth = {
    getAccessToken: () => current,
    refresh: () => refreshing ||= Promise.resolve().then(() => { refreshCount++; current = 'new'; return current; }),
    clear: () => { current = null; clearCount++; }, verifyUser: async () => user(),
  };
  const seen = [];
  const http = axios.create({ adapter: async config => {
    seen.push({ url: config.url, token: config.headers.Authorization });
    if (config.headers.Authorization === 'Bearer old' || config.url === '/always401') {
      const error = failure(401, 'Expired'); error.config = config; throw error;
    }
    return { data: { ok: true }, status: 200, headers: {}, config };
  } });
  installAuthInterceptors(http, auth);
  await Promise.all([http.get('/first'), http.get('/second')]);
  assert.equal(refreshCount, 1);
  assert.equal(seen.filter(c => c.token === 'Bearer new').length, 2);
  await http.get('/public', { skipAuth: true });
  assert.equal(seen.at(-1).token, undefined);
  await assert.rejects(http.get('/always401'));
  assert.equal(seen.filter(c => c.url === '/always401').length, 2);
  assert.equal(clearCount, 0);
});


test('late login or OTP responses cannot resurrect a cancelled session', async () => {
  for (const action of ['login', 'otp']) {
    let finish;
    const { auth, saved } = fixture(() => new Promise(resolve => { finish = resolve; }),
      action === 'otp' ? { modern_factory_challenge: 'challenge' } : {});
    const pending = action === 'login' ? auth.login('user@example.com', 'password') : auth.verifyOtp('123456');
    auth.clear();
    finish(response({ role_id: 2, ...tokenPair }));
    await assert.rejects(pending, /Session changed/);
    assert.equal(auth.state.user, null);
    assert.equal(auth.getAccessToken(), null);
    assert.equal(saved.size, 0);
  }
});


for (const status of [200, 202]) {
  test(`adminToken challenge without role_id at HTTP ${status} requires OTP before authenticating`, async () => {
    const { auth, calls, saved } = fixture(c => {
      if (c.url === '/login') return response({ result: true, requiresVerification: true,
        data: { requiresAdminVerification: true, adminToken: 'admin-challenge' } }, status);
      if (c.url === '/admin/verify-otp') return response({ data: tokenPair });
      return response({ data: { user: user(1) } });
    });
    assert.equal(await auth.login('admin@example.com', 'password'), null);
    assert.equal(saved.get('adminToken'), 'admin-challenge');
    assert.equal(auth.state.user, null);
    assert.equal(auth.getAccessToken(), null);
    assert.equal(saved.has('modern_factory_refresh'), false);
    assert.equal(calls.length, 1);
    const guard = createAuthGuard(auth);
    assert.equal(await guard({ path: '/admin/dashboard', meta: { requiresAuth: true, role: 'ADMIN' } }), '/verify-admin-otp');
    assert.equal(await guard({ path: '/verify-admin-otp', meta: { guestOnly: true, adminOtp: true } }), true);
    assert.equal(dashboardPath(await auth.verifyOtp('123456')), '/admin/dashboard');
    assert.deepEqual(calls[1].data, { otp: '123456', adminToken: 'admin-challenge' });
    assert.equal(calls[1].headers, undefined);
    assert.equal(saved.has('adminToken'), false);
    assert.equal(auth.getAccessToken(), 'access');
  });
}

test('adminToken survives reload, remains pending after invalid OTP, rotates on resend and clears on cancellation', async () => {
  const { auth, calls, saved } = fixture(c => {
    if (c.url === '/admin/verify-otp') throw failure(400, 'Invalid OTP');
    return response({ data: { adminToken: 'new-admin-challenge' } });
  }, { adminToken: 'pending-admin' });
  assert.equal(await auth.verifyUser(), null);
  assert.equal(auth.getChallenge(), 'pending-admin');
  await assert.rejects(auth.verifyOtp('111111'), /Invalid OTP/);
  assert.equal(saved.get('adminToken'), 'pending-admin');
  await auth.resendOtp();
  assert.deepEqual(calls[1].data, { adminToken: 'pending-admin' });
  assert.equal(saved.get('adminToken'), 'new-admin-challenge');
  auth.clear();
  assert.equal(saved.size, 0);
});

test('normal token login reads nested user role and verifies it through getMe', async () => {
  const { auth } = fixture(c => response(c.url === '/login'
    ? { result: true, data: { ...tokenPair, user: user(2) } }
    : { data: { user: user(2) } }));
  assert.equal(dashboardPath(await auth.login('manager@example.com', 'password')), '/manager/dashboard');
});

test('malformed admin challenges fail without role lookup or authentication', async () => {
  const { auth, saved } = fixture(() => response({ result: true, requiresVerification: true,
    data: { requiresAdminVerification: true } }));
  await assert.rejects(auth.login('admin@example.com', 'password'), /incomplete OTP challenge/);
  assert.equal(auth.state.user, null);
  assert.equal(saved.size, 0);
});


test('delayed dashboard 401s after admin OTP reuse the rotated token instead of expiring the session', async () => {
  let backendToken = 'access';
  let refreshCount = 0;
  const { auth, saved } = fixture(c => {
    if (c.url === '/admin/verify-otp') return response({ result: true, data: { role_id: 1, ...tokenPair } });
    if (c.url === '/refresh-token') {
      refreshCount++;
      backendToken = `rotated-${refreshCount}`;
      return response({ data: { accessToken: backendToken, refreshToken: `refresh-${refreshCount}` } });
    }
    if (c.headers.Authorization !== `Bearer ${backendToken}`) throw failure(401, 'Access token rejected');
    return response({ data: user(1) });
  }, { adminToken: 'pending-admin' });
  assert.equal(dashboardPath(await auth.verifyOtp('123456')), '/admin/dashboard');
  backendToken = 'expired-access';
  const rejectOld = new Map();
  const http = axios.create({ adapter: config => {
    if (config.headers.Authorization === 'Bearer access') {
      return new Promise((resolve, reject) => rejectOld.set(config.url, () => {
        const error = failure(401, 'Old access token'); error.config = config; reject(error);
      }));
    }
    if (config.headers.Authorization !== `Bearer ${backendToken}`) {
      const error = failure(401, 'Token replaced by another refresh'); error.config = config; return Promise.reject(error);
    }
    return Promise.resolve({ data: { result: true }, status: 200, headers: {}, config });
  } });
  installAuthInterceptors(http, auth);
  const first = http.get('/getAllUsers');
  const second = http.get('/getAllDepartments');
  await new Promise(resolve => setImmediate(resolve));
  rejectOld.get('/getAllUsers')();
  await first;
  // The second failure arrives after the first refresh has fully completed.
  rejectOld.get('/getAllDepartments')();
  await second;
  assert.equal(refreshCount, 1);
  assert.equal(auth.state.user.role, 'ADMIN');
  assert.equal(saved.get('modern_factory_refresh'), 'refresh-1');
  assert.equal(auth.state.message, '');
});

test('an endpoint that keeps returning 401 does not log out a getMe-verified admin', async () => {
  const { auth } = fixture(c => {
    if (c.url === '/admin/verify-otp') return response({ data: tokenPair });
    if (c.url === '/refresh-token') return response({ data: tokenPair });
    return response({ data: user(1) });
  }, { adminToken: 'challenge' });
  await auth.verifyOtp('123456');
  const http = axios.create({ adapter: async config => {
    const error = failure(401, 'This endpoint rejected access'); error.config = config; throw error;
  } });
  installAuthInterceptors(http, auth);
  await assert.rejects(http.get('/dashboard-data'));
  assert.equal(auth.state.user.role, 'ADMIN');
  assert.equal(auth.getAccessToken(), 'access');
  assert.equal(auth.state.message, '');
});

test('a delayed getMe 401 uses a token already refreshed by another request', async () => {
  let delayedFailure;
  let delayMe = false;
  let refreshCount = 0;
  const { auth } = fixture(c => {
    if (c.url === '/admin/verify-otp') return response({ data: tokenPair });
    if (c.url === '/refresh-token') { refreshCount++; return response({ data: { accessToken: 'rotated', refreshToken: 'new-refresh' } }); }
    if (delayMe && c.headers.Authorization === 'Bearer access') return new Promise((resolve, reject) => { delayedFailure = () => reject(failure(401, 'Old token')); });
    return response({ data: user(1) });
  }, { adminToken: 'challenge' });
  await auth.verifyOtp('123456');
  delayMe = true;
  const verification = auth.verifyUser();
  await auth.refresh();
  delayedFailure();
  assert.equal((await verification).role, 'ADMIN');
  assert.equal(refreshCount, 1);
});


test('real Axios transport preserves Bearer headers after OTP, refresh, and on dashboard APIs', async () => {
  const received = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({ path: req.url, authorization: req.headers.authorization, body: body ? JSON.parse(body) : null });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/admin/verify-otp') res.end(JSON.stringify({ result: true, data: tokenPair }));
    else if (req.url === '/refresh-token') res.end(JSON.stringify({ result: true, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } }));
    else if (req.url === '/getMe') res.end(JSON.stringify({ result: true, data: user(1) }));
    else res.end(JSON.stringify({ result: true, data: [] }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const transport = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}`, adapter: 'http', proxy: false });
    const saved = new Map([['adminToken', 'admin-challenge']]);
    const storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
    const auth = createSession({ storage, request: config => {
      assert.equal(Object.hasOwn(config, 'auth'), false, 'Do not use Axios reserved Basic auth option');
      return transport.request(config);
    } });
    assert.equal(dashboardPath(await auth.verifyOtp('123456')), '/admin/dashboard');
    assert.equal(received[0].authorization, undefined);
    assert.deepEqual(received[0].body, { adminToken: 'admin-challenge', otp: '123456' });
    assert.equal(received[1].authorization, 'Bearer access');
    await auth.refresh();
    assert.equal(received[2].authorization, undefined);
    assert.deepEqual(received[2].body, { refreshToken: 'refresh' });
    assert.equal(received[3].authorization, 'Bearer new-access');
    installAuthInterceptors(transport, auth);
    await transport.get('/getAllUsers', { skipAuth: false });
    assert.equal(received.at(-1).authorization, 'Bearer new-access');
    await transport.get('/attendanceQrDisplay', { skipAuth: true });
    assert.equal(received.at(-1).authorization, undefined);
    assert.equal(received.some(req => req.authorization?.startsWith('Basic')), false);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
