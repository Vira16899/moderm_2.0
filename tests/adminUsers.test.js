import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { createUserBody, updateUserBody, validateCreateUser, userIdBody, unwrapUser, userList, userIdentityFields, departmentHasOtherManager } from '../src/api/adminUsers.js';
import { userDetailBridge } from '../server/userDetailBridge.js';

const user = { nameKh: ' ឈ្មោះ ', nameEn: ' Employee ', email: ' user@example.com ', password: 'Strong1!pass', phone: '012345678', gender: 'male', role: 'EMPLOYEE', departmentId: '2', positionId: '8', salary: 0, idCardNumber: '897654', nationality: 'ខ្មែរ', dob: '2000-01-01', joinedDate: '2026-10-20' };
const departments = [{ id: 2 }], positions = [{ id: 8, departmentId: 2 }];

test('detail identity uses real ID cards and nonempty hire-date aliases', () => {
  for (const key of ['hireDate', 'hire_date', 'joinedAt', 'joined_at']) {
    assert.deepEqual(userIdentityFields({ id: 18, joinedDate: '', [key]: '2026-10-05T00:00:00.000Z', id_card_number: '00897654' }), { joinedDate: '2026-10-05', idCardNumber: '00897654' });
  }
  assert.deepEqual(userIdentityFields({ id: 18, employee: { hireDate: '2026-10-05', id_card_number: '123' } }), { joinedDate: '2026-10-05', idCardNumber: '123' });
  assert.deepEqual(userIdentityFields({ joinedDate: null }, { joinedDate: '2026-10-05', idCardNumber: '456' }), { joinedDate: '2026-10-05', idCardNumber: '456' });
  assert.deepEqual(userIdentityFields({ id: 18, created_at: '2026-10-05' }), { joinedDate: '', idCardNumber: '' });
});

test('create user sends exact API fields, maps roles and omits manager positions', () => {
  assert.deepEqual(createUserBody(user), { email: 'user@example.com', password: user.password, khmer_name: 'ឈ្មោះ', Eng_name: 'Employee', phone: '012345678', gender: 'MALE', hireDate: '2026-10-20', birthday: '2000-01-01', role_id: 3, department_id: 2, position_id: 8, base_salary: 0, id_card_number: '897654', nationality: 'ខ្មែរ' });
  const manager = createUserBody({ ...user, role: 'MANAGER' });
  assert.equal(manager.role_id, 2);
  assert.ok(!Object.hasOwn(manager, 'position_id'));
  assert.throws(() => createUserBody({ ...user, role: 'ADMIN' }));
});

test('creation validates required fields, roles, salary, dates and dropdown membership', () => {
  assert.deepEqual(validateCreateUser(user, departments, positions), {});
  assert.deepEqual(validateCreateUser({ ...user, role: 'MANAGER', positionId: '' }, departments, []), {});
  for (const [field, value] of Object.entries({ idCardNumber: '', nationality: '', nameKh: ' ', nameEn: '', email: 'bad', password: 'weak', phone: 'abc', gender: '', role: 'ADMIN', departmentId: 999, positionId: 999, salary: -1, dob: '2000-02-30', joinedDate: 'bad' })) {
    assert.ok(validateCreateUser({ ...user, [field]: value }, departments, positions)[field], field);
  }
  assert.ok(validateCreateUser({ ...user, salary: '' }, departments, positions).salary);
  assert.ok(validateCreateUser({ ...user, dob: '2999-01-01' }, departments, positions).dob);
});

test('user response parsing distinguishes empty records and preserves original IDs', () => {
  assert.deepEqual(userIdBody('2'), { id: 2 });
  assert.deepEqual(userIdBody('USR-002'), { id: 'USR-002' });
  assert.throws(() => userIdBody(''));
  assert.equal(unwrapUser({ data: { user: { id: 2 } } }).id, 2);
  assert.equal(unwrapUser({ data: [] }), null);
  assert.deepEqual(userList({ data: { users: [] } }), []);
  assert.throws(() => userList({ message: 'malformed' }));
});

for (const [path, body] of [
  ['/getUserById', { id: 2 }],
  ['/my-employee-detail', { employeeId: 3 }],
  ['/getUserSalaryHistory', { id: 6 }],
  ['/getLeaveRequestById', { user_id: 16 }],
  ['/getPositionById', { id: 42 }],
]) {
test(`browser bridge forwards authenticated GET JSON body and backend errors for ${path}`, async () => {
  const received = [];
  const backend = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    received.push({ method: req.method, url: req.url, authorization: req.headers.authorization, body: JSON.parse(raw) });
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'User not found' }));
  });
  backend.listen(0, '127.0.0.1'); await once(backend, 'listening');
  const middleware = userDetailBridge(`http://127.0.0.1:${backend.address().port}`);
  const bridge = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end(); }));
  bridge.listen(0, '127.0.0.1'); await once(bridge, 'listening');
  try {
    const response = await new Promise((resolve, reject) => {
      const req = request(`http://127.0.0.1:${bridge.address().port}/backend-api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' } }, async (res) => {
        let raw = ''; for await (const chunk of res) raw += chunk;
        resolve({ status: res.statusCode, body: JSON.parse(raw) });
      });
      req.on('error', reject); req.end(JSON.stringify(body));
    });
    assert.deepEqual(received, [{ method: 'GET', url: path, authorization: 'Bearer test-token', body }]);
    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'User not found');
  } finally { await Promise.all([new Promise(resolve => bridge.close(resolve)), new Promise(resolve => backend.close(resolve))]); }
});
}

test('update user sends only supported profile and assignment fields', () => {
  assert.deepEqual(updateUserBody({ ...user, id: 3, status: 'inactive' }), { id: 3, khmer_name: 'ឈ្មោះ', Eng_name: 'Employee', phone: '012345678', gender: 'MALE', role: 'EMPLOYEE', department_id: 2, position_id: 8 });
});
test('creation rejects a position from a different department', () => {
  assert.ok(validateCreateUser(user, departments, [{ id: 8, departmentId: 3 }]).positionId);
});

test('manager department assignment is sent without an employee position', () => {
 const result=updateUserBody({...user,id:3,role:'MANAGER',departmentId:'4',positionId:'8'});
 assert.equal(result.department_id,4);
 assert.equal(result.role,'MANAGER');
 assert.ok(!Object.hasOwn(result,'position_id'));
 assert.throws(()=>updateUserBody({...user,id:3,role:'MANAGER',departmentId:''}));
});
test('manager conflicts exclude the current manager and accept empty departments',()=>{
 const departments=[{id:3,managerId:7},{id:4,managerId:''},{id:5,user_id:9}];
 assert.equal(departmentHasOtherManager('3',8,departments),true);
 assert.equal(departmentHasOtherManager('3',7,departments),false);
 assert.equal(departmentHasOtherManager('4',8,departments),false);
 assert.equal(departmentHasOtherManager('',8,departments),false);
 assert.equal(departmentHasOtherManager('5',8,departments),true);
 assert.equal(departmentHasOtherManager('4',8,departments,[{id:10,role:'MANAGER',department_id:4}]),true);
});
