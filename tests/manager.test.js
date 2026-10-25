import test from 'node:test';
import assert from 'node:assert/strict';
import { managerEmployees, managerEmployeeDetail, managerEmployeeIdBody, managerDashboardData } from '../src/api/managerData.js';
import { API_ENDPOINTS } from '../src/api/endpoints.js';

const employee = { id: 7, khmer_name: 'បុគ្គលិក', Eng_name: 'Employee', department_id: 2, department_name: 'Production', position_name: 'Operator', base_salary: 0, is_active: 0 };

test('manager detail uses the GET body bridge and the employeeId contract', () => {
  assert.deepEqual(API_ENDPOINTS.manager.getEmployeeDetail, {
    method: 'GET', path: '/my-employee-detail', browserBridge: true,
  });
  assert.deepEqual(managerEmployeeIdBody(3), { employeeId: 3 });
  assert.deepEqual(managerEmployeeIdBody(' 3 '), { employeeId: 3 });
  assert.deepEqual(managerEmployeeIdBody('EMP-003'), { employeeId: 'EMP-003' });
  for (const id of [null, undefined, '', ' ']) {
    assert.throws(() => managerEmployeeIdBody(id), /Employee ID is required/);
  }
});

test('manager detail loads directly from the detail endpoint response', () => {
  for (const payload of [employee, { data: employee }, { data: { employee } }, { data: { data: [employee] } }]) {
    const user = managerEmployeeDetail(payload);
    assert.equal(user.id, '7');
    assert.equal(user.nameEn, 'Employee');
    assert.equal(user.salary, 0);
  }
  assert.throws(() => managerEmployeeDetail({ data: [] }), /not found/);
});

test('manager list normalizes wrapped records and preserves empty teams', () => {
  for (const payload of [[employee], { data: [employee] }, { data: { data: { employees: [employee] } } }]) {
    const [user] = managerEmployees(payload);
    assert.equal(user.id, '7');
    assert.equal(user.nameKh, employee.khmer_name);
    assert.equal(user.departmentKh, 'Production');
    assert.equal(user.status, 'inactive');
    assert.equal(user.salary, 0);
  }
  assert.deepEqual(managerEmployees({ data: { employees: [] } }), []);
  assert.throws(() => managerEmployees({ message: 'Unexpected response' }));
});

test('manager employee profile and detail are combined without losing contact data', () => {
  const user = managerEmployeeDetail({ data: { employee } }, { data: { detail: true, phone: '012345678', address: 'Phnom Penh', base_salary: 400 } });
  assert.equal(user.id, '7');
  assert.equal(user.nameEn, 'Employee');
  assert.equal(user.phone, '012345678');
  assert.equal(user.address, 'Phnom Penh');
  assert.equal(user.salary, 400);
  assert.throws(() => managerEmployeeDetail({ data: [] }, {}), /not found/);
});

test('manager dashboard uses actual counts and distinguishes unknown metrics from zero', () => {
  assert.deepEqual(managerDashboardData({ data: [] }, []), {
    total: 0, present: null, absent: null, pending: null, pendingLeaves: null, leaveRequests: null,
  });
  const payload = { data: { employees: [employee], summary: { present_count: 0, absent_count: '1' }, leave_requests: [{ id: 1, status: 'PENDING' }, { id: 2, status: 'approved' }] } };
  const dashboard = managerDashboardData(payload, managerEmployees(payload));
  assert.equal(dashboard.total, 1);
  assert.equal(dashboard.present, 0);
  assert.equal(dashboard.absent, 1);
  assert.equal(dashboard.pending, 1);
  assert.deepEqual(dashboard.pendingLeaves.map((request) => request.id), [1]);
});


test('manager employee detail maps the supplied limited profile and user_status', () => {
  const payload = { message:'Fetched employee details successfully.', data:{id:6, email:'employee@example.com', khmer_name:'តតត', Eng_name:'Vira Chea', phone:'0974564291', avatar:'uploads/avatars/avatar-6.webp', is_active:1, gender:'MALE', hire_date:'2026-10-20T22:00:00.000Z', user_status:'ACTIVE', position_name:'បុគ្គលិកត្រួតពិនិត្យគុណភាព', department_name:'ផ្នែកត្រួតពិនិត្យ'} };
  const user = managerEmployeeDetail(payload);
  assert.equal(user.nameKh, payload.data.khmer_name);
  assert.equal(user.nameEn, 'Vira Chea');
  assert.equal(user.joinedDate, payload.data.hire_date);
  assert.equal(user.departmentKh, payload.data.department_name);
  assert.equal(user.positionKh, payload.data.position_name);
  assert.equal(user.avatar, payload.data.avatar);
  assert.equal(user.status, 'active');
  assert.equal(user.salary, null);
  assert.equal(managerEmployeeDetail({data:{id:6,user_status:'INACTIVE'}}).status, 'inactive');
});
