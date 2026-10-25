import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createProfileApi, profileBody, profileDraft, profileValidation, passwordValidation, profileError, displayValue, displaySalary, displayDate, NOT_PROVIDED, avatarUrl } from '../src/api/profile.js';
import { createSession } from '../src/auth/session.js';
import { installAuthInterceptors } from '../src/auth/interceptors.js';

const record = { id: 7, role_id: 3, is_active: 1, khmer_name: 'ឈ្មោះ', Eng_name: 'Employee', email: 'user@example.com', phone: '012345678', base_salary: '350.00', gender: null, date_of_birth: '1995-06-15T00:00:00.000Z' };
test('profile edits whitelist API fields and preserve nullable dates without privileged fields', () => {
  const draft = profileDraft(record);
  assert.equal(draft.date_of_birth, '1995-06-15');
  const body = profileBody({ ...draft, newkhmer_name: ' ឈ្មោះ ', email: 'other', base_salary: 999, role_id: 1, is_active: 0, permissions: ['admin'] });
  assert.deepEqual(Object.keys(body).sort(), ['newkhmer_name', 'newEng_name', 'newphone', 'address', 'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'].sort());
  assert.equal(body.newkhmer_name, 'ឈ្មោះ');
  assert.equal(profileBody(profileDraft({})).date_of_birth, null);
  assert.equal(profileBody({ ...draft, gender: 'MALE' }).gender, 'MALE');
});
test('password validation enforces backend rules, matching and different passwords', () => {
  const valid = { oldPassword: 'Old1!pass', newPassword: 'New2!pass', confirmPass: 'New2!pass' };
  assert.equal(passwordValidation(valid), '');
  for (const value of ['', 'short', 'lowercase1!', 'UPPERCASE1!', 'NoNumbers!', 'NoSymbol123', 'Space 1!aa', 'A1!' + 'a'.repeat(28)]) {
    assert.ok(passwordValidation({ ...valid, newPassword: value, confirmPass: value }));
  }
  assert.ok(passwordValidation({ ...valid, oldPassword: '' }));
  assert.ok(passwordValidation({ ...valid, confirmPass: 'different' }));
  assert.ok(passwordValidation({ ...valid, oldPassword: valid.newPassword }));
});
test('profile presentation handles nulls, zero salary, dates and relative avatars', () => {
  assert.equal(displayValue(null), NOT_PROVIDED);
  assert.equal(displaySalary(null), NOT_PROVIDED);
  assert.equal(displaySalary(0), '$0.00');
  assert.equal(displaySalary('350.5'), '$350.50');
  assert.equal(displayDate(null), NOT_PROVIDED);
  assert.notEqual(displayDate(record.date_of_birth), NOT_PROVIDED);
  assert.match(displayDate(record.date_of_birth), /មិថុនា/);
  assert.equal(avatarUrl('/uploads/avatar.jpg', '/backend-api'), '/backend-api/uploads/avatar.jpg');
  assert.equal(avatarUrl('https://example.com/avatar.jpg', '/backend-api'), 'https://example.com/avatar.jpg');
  assert.equal(avatarUrl('javascript:bad', '/backend-api'), '');
});
test('backend validation messages and supported HTTP errors remain visible', () => {
  assert.equal(profileError({ response: { status: 422, data: { message: 'Validation failed', details: ['Phone too long', { message: 'Name required' }] } } }), 'Phone too long Name required');
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    assert.ok(profileError({ response: { status, data: {} } }));
    assert.equal(profileError({ response: { status, data: { msg: 'Backend message' } } }), 'Backend message');
  }
  assert.match(profileError({ request: {} }), /ម៉ាស៊ីនមេ/);
});
test('real HTTP profile flow sends Bearer, refreshes once, updates global identity and expires failed sessions', async () => {
  const received = [];
  let user = { ...record }, rejectAccess = false, failRefresh = false;
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : null;
    received.push({ url: req.url, method: req.method, token: req.headers.authorization, contentType: req.headers['content-type'], body });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/login') return res.end(JSON.stringify({ result: true, data: { accessToken: 'access', refreshToken: 'refresh', user } }));
    if (req.url === '/refresh-token') {
      if (failRefresh) { res.statusCode = 401; return res.end(JSON.stringify({ msg: 'Expired refresh' })); }
      return res.end(JSON.stringify({ result: true, data: { accessToken: 'rotated', refreshToken: 'refresh2' } }));
    }
    if (rejectAccess && (failRefresh || req.headers.authorization === 'Bearer access')) {
      res.statusCode = 401; return res.end(JSON.stringify({ msg: 'Expired access' }));
    }
    if (req.url === '/updateProfile') user = { ...user, khmer_name: body.newkhmer_name, Eng_name: body.newEng_name, phone: body.newphone, gender: body.gender, address: body.address, date_of_birth: body.date_of_birth, emergency_contact_name: body.emergency_contact_name, emergency_contact_phone: body.emergency_contact_phone, emergency_contact_relationship: body.emergency_contact_relationship };
    res.end(JSON.stringify({ result: true, data: req.url === '/getMe' ? user : {} }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const transport = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}`, adapter: 'http', proxy: false });
    const saved = new Map();
    const storage = { getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v), removeItem: k => saved.delete(k) };
    const session = createSession({ storage, request: config => transport.request(config) });
    await session.login(record.email, 'SyntheticOnly1!');
    installAuthInterceptors(transport, session);
    const api = createProfileApi({ request: config => transport.request(config), session });
    await api.load();
    const draft = { ...profileDraft(user), newEng_name: 'Updated employee', gender: 'MALE', address: 'Test address', date_of_birth: '1995-06-15', emergency_contact_name: 'Test contact', emergency_contact_phone: '098765432', emergency_contact_relationship: 'Sister', email: 'blocked', role_id: 1 };
    rejectAccess = true;
    await api.update(draft);
    assert.equal(received.filter(r => r.url === '/refresh-token').length, 1);
    assert.equal(received.filter(r => r.url === '/updateProfile').length, 2);
    await api.load();
    assert.equal(session.state.user.nameEn, 'Updated employee');
    assert.equal(session.state.user.address, 'Test address');
    assert.equal(session.state.user.phone, draft.newphone);
    assert.equal(session.state.user.date_of_birth, '1995-06-15');
    assert.equal(session.state.user.emergency_contact_name, 'Test contact');
    assert.equal(session.state.user.emergency_contact_phone, '098765432');
    assert.equal(session.state.user.emergency_contact_relationship, 'Sister');
    assert.deepEqual(received.find(r => r.url === '/updateProfile').body, profileBody(draft));
    await api.changePassword({ oldPassword: 'Old1!pass', newPassword: 'New2!pass', confirmPass: 'New2!pass', password: 'ignored' });
    assert.deepEqual(received.at(-1).body, { oldPassword: 'Old1!pass', newPassword: 'New2!pass', confirmPass: 'New2!pass' });
    assert.equal(received.at(-1).token, 'Bearer rotated');
    assert.match(received.at(-1).contentType, /application\/json/);
    assert.equal(saved.has('password'), false);
    const count = received.length;
    await assert.rejects(api.changePassword({ oldPassword: '', newPassword: '', confirmPass: '' }));
    assert.equal(received.length, count);
    failRefresh = true;
    await assert.rejects(api.load());
    assert.equal(session.state.user, null);
    assert.equal(session.getAccessToken(), null);
    assert.equal(saved.size, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('pending profile responses cannot restore a signed-out user', async () => {
  let resolve;
  const session = { state: { user: { id: '7' } }, getAccessToken: () => session.state.user ? 'access' : null };
  const api = createProfileApi({ session, request: () => new Promise(done => { resolve = done; }) });
  const pending = api.load(); session.state.user = null;
  resolve({ data: { result: true, data: record } });
  await pending;
  assert.equal(session.state.user, null);
});

test('avatar endpoints send authenticated multipart images and reload the shared profile', async () => {
  const received = [];
  let avatar = null, fail = false;
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    received.push({ url: req.url, method: req.method, type: req.headers['content-type'], token: req.headers.authorization, raw });
    res.setHeader('Content-Type', 'application/json');
    if (fail) return res.end(JSON.stringify({ result: false, msg: 'Image rejected' }));
    if (req.url === '/upload-avatar') avatar = '/uploads/first.png';
    if (req.url === '/update-avatar') avatar = '/uploads/second.png';
    if (req.url === '/delete-avatar') avatar = null;
    res.end(JSON.stringify({ result: true, data: req.url === '/getMe' ? { ...record, avatar } : {} }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const transport = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}`, adapter: 'http', proxy: false });
    const session = { state: { user: { id: '7' } }, getAccessToken: () => 'access' };
    installAuthInterceptors(transport, session);
    const api = createProfileApi({ request: config => transport.request(config), session });
    const file = new File(['image-content'], 'avatar.png', { type: 'image/png' });
    for (const [method, url, action, expected] of [
      ['POST', '/upload-avatar', () => api.uploadAvatar(file), '/uploads/first.png'],
      ['PUT', '/update-avatar', () => api.updateAvatar(file), '/uploads/second.png'],
      ['DELETE', '/delete-avatar', () => api.deleteAvatar(), ''],
    ]) {
      await action();
      const request = received.at(-1);
      assert.equal(request.method, method);
      assert.equal(request.url, url);
      assert.equal(request.token, 'Bearer access');
      if (method !== 'DELETE') {
        assert.match(request.type, /multipart\/form-data; boundary=/);
        assert.match(request.raw, /name="avatar"; filename="avatar.png"/);
        assert.match(request.raw, /Content-Type: image\/png/);
        assert.match(request.raw, /image-content/);
      } else assert.equal(request.raw, '');
      await api.load();
      assert.equal(session.state.user.avatar, expected);
    }
    fail = true;
    await assert.rejects(api.uploadAvatar(file), error => profileError(error) === 'Image rejected');
    assert.equal(session.state.user.avatar, '');
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('full profile payload supports the supplied contract and optional contact validation',()=>{
 const draft={newkhmer_name:'សុខ ដារ៉ា',newEng_name:'Sok Dara',newphone:'012345678',gender:'MALE',address:'Phnom Penh, Cambodia',date_of_birth:'1995-06-15',emergency_contact_name:'Sok Srey',emergency_contact_phone:'098765432',emergency_contact_relationship:'Sister'};
 assert.deepEqual(profileBody(draft),draft);
 assert.deepEqual(profileValidation(draft,'2026-10-25'),{});
 assert.ok(profileValidation({...draft,emergency_contact_phone:'bad'},'2026-10-25').emergency_contact_phone);
 assert.ok(profileValidation({...draft,date_of_birth:'1995-02-30'},'2026-10-25').date_of_birth);
 assert.ok(profileValidation({...draft,date_of_birth:'2027-01-01'},'2026-10-25').date_of_birth);
 assert.ok(profileValidation({...draft,newphone:''},'2026-10-25').newphone);
 assert.equal(profileDraft({gender:'female',birthday:'1995-06-15',nameKh:'សុខ',nameEn:'Sok'}).gender,'FEMALE');
 assert.equal(profileDraft({birthday:'1995-06-15'}).date_of_birth,'1995-06-15');
});
