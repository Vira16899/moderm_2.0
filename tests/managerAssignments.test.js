import test from 'node:test';
import assert from 'node:assert/strict';
import { managerAssignmentError, managerDepartments, verifyManagerAssignment } from '../src/api/managerAssignments.js';
import { userList } from '../src/api/adminUsers.js';
const users = [{id:7,role:'MANAGER',department_id:3},{id:18,role:'MANAGER',department_id:8},{id:6,role:'EMPLOYEE',department_id:3}];
const departments = [{id:3,user_id:7},{id:8,user_id:18},{id:15,user_id:null}];

test('one manager cannot be assigned to a second department through create or edit',()=>{
  assert.ok(managerAssignmentError(7,15,departments,users));
  assert.ok(managerAssignmentError(7,null,departments,users));
  assert.equal(managerAssignmentError(7,3,departments,users),'');
  assert.equal(managerAssignmentError(null,3,departments,users),'');
  assert.ok(managerAssignmentError(6,15,departments,users));
  assert.ok(managerAssignmentError('new',3,departments,users,{newManager:true,checkOccupied:true}));
});
test('existing conflicts remain visible and clearing a department overrides stale user joins',()=>{
  const duplicated = [...departments,{id:20,user_id:7}];
  assert.equal(managerDepartments(7,duplicated,users).length,2);
  assert.ok(managerAssignmentError(7,3,duplicated,users));
  const cleared = duplicated.map(row=>row.id===20?{...row,user_id:null}:row);
  assert.equal(managerAssignmentError(7,3,cleared,[...users,{id:7,role:'MANAGER',department_id:20}]),'');
});
test('user join rows become one user while preserving all department assignments',()=>{
  const rows=userList({data:[{id:7,role:'MANAGER',department_id:3,department_name:'First'},{id:7,role:'MANAGER',department_id:15,department_name:'Second'},{id:7,role:'MANAGER',department_id:15},{id:8,email:'same@example.com'},{id:9,email:'same@example.com'}]});
  assert.equal(rows.length,3);
  assert.deepEqual(rows[0].departmentAssignments.map(row=>row.id),['3','15']);
});
test('fresh assignment checks block conflicts and fail closed on unavailable lists',async()=>{
  let writes=0;
  const api={getDepartments:async()=>({data:departments}),getUsers:async()=>({data:users})};
  await assert.rejects(async()=>{await verifyManagerAssignment(api,7,15);writes++;});
  assert.equal(writes,0);
  await verifyManagerAssignment(api,7,3);
  await assert.rejects(verifyManagerAssignment({...api,getDepartments:async()=>({message:'Malformed'})},7,3));
  await verifyManagerAssignment({getDepartments:()=>{throw Error('Should not fetch');}},null,3);
});
