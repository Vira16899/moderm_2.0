import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardInsights } from '../src/api/adminDashboard.js';

test('dashboard charts use actual hires within the selected months and exclude future dates', () => {
  const users = [{ role:'EMPLOYEE', joinedDate:'2026-10-20' }, { role:'MANAGER', hire_date:'2026-09-10' }, { role:'EMPLOYEE', joinedDate:'2026-10-30' }, { role:'ADMIN', joinedDate:'2026-10-01' }, { role:'EMPLOYEE', joinedDate:'' }];
  const result = dashboardInsights(users, [], '2026-10-25');
  assert.deepEqual(result.months.map(row => row.key), ['2026-05','2026-06','2026-07','2026-08','2026-09','2026-10']);
  assert.deepEqual(result.months.map(row => row.count), [0,0,0,0,1,1]);
  assert.equal(result.recentHires.length,2);
  assert.equal(result.missingHireDate,1);
  assert.equal(dashboardInsights([], [], '2026-01-01',12).months[0].key,'2025-02');
});

test('department headcount and attention items use real assignments and account states', () => {
  const users = [{id:1, role:'EMPLOYEE', departmentId:'2', status:'active'}, {id:2, role:'EMPLOYEE', departmentId:'',status:'inactive'}, {id:3, role:'MANAGER',departmentId:'2',status:'active'}];
  const result=dashboardInsights(users,[{id:2,employeeCount:99},{id:3}], '2026-10-25');
  assert.deepEqual(result.departmentRows.map(row=>row.count),[1,0]);
  assert.equal(result.active,2);
  assert.equal(result.inactive,1);
  assert.equal(result.unassigned,1);
  assert.equal(result.unmanaged,1);
  assert.equal(dashboardInsights([],[],'2026-10-25').recentHires.length,0);
});
