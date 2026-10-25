import test from 'node:test';
import assert from 'node:assert/strict';
import { employmentUserBody, employmentEligibleUsers, employmentLetter, employmentFilename, letterValue, letterSalary } from '../src/api/employmentVerification.js';
const payload = {result:true,data:{document_type:'លិខិតបញ្ជាក់ការងារបុគ្គលិក',generated_at:'2026-10-25',employee:{id:3,khmer_name:'ឆៃអ៊ី',Eng_name:'Chhai Y',salary:'7900.00',id_card_number:null,nationality:null,address:'',hire_date:'2026-10-19'}}};

test('employment verification sends the exact numeric userId contract',()=>{
  assert.deepEqual(employmentUserBody('3'),{userId:3});
  for(const id of ['',null,0,-1,'user3','3e0',1.5])assert.throws(()=>employmentUserBody(id));
});
test('document selector includes only managers and employees with unique IDs',()=>{
  const rows = employmentEligibleUsers([{id:1,role:'ADMIN'}, {id:3,role:'EMPLOYEE'}, {id:'03',role:'EMPLOYEE'}, {id:7,role:'MANAGER'}, {id:8,role_id:3}, {id:9,role:'UNKNOWN'}, {role:'EMPLOYEE'}]);
  assert.deepEqual(rows.map(row=>row.id).sort(),['3','7','8']);
});
test('employment response fills the selected employee without inventing missing details',()=>{
  const letter=employmentLetter(payload,'3');
  assert.equal(letter.employee.salary,'7900.00');
  assert.equal(letter.generatedAt,'2026-10-25');
  assert.equal(letterValue(letter.employee.nationality),'មិនបានផ្តល់');
  assert.equal(letterValue(letter.employee.address),'មិនបានផ្តល់');
  assert.equal(letterSalary(0),'$0.00');
  assert.equal(letterSalary(letter.employee.salary),'$7,900.00');
  assert.equal(employmentFilename(letter),'employment-verification-3-2026-10-25.pdf');
  assert.throws(()=>employmentLetter(payload,4));
  assert.throws(()=>employmentLetter({data:{generated_at:'2026-10-25'}}));
  assert.throws(()=>employmentLetter({...payload,data:{...payload.data,generated_at:'2026-02-30'}}));
  assert.throws(()=>employmentLetter({result:false,msg:'Failed'}));
});
