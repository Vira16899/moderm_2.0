import test from 'node:test';
import assert from 'node:assert/strict';
import { leaveAttachmentUrl } from '../src/api/leaveAttachments.js';

test('leave attachment links support uploaded files on the API host and reject executable URLs', () => {
  assert.equal(leaveAttachmentUrl('uploads/leaves/proof.pdf','/backend-api'),'/backend-api/uploads/leaves/proof.pdf');
  assert.equal(leaveAttachmentUrl('/uploads/leaves/proof.docx','https://backend.example.com/'),'https://backend.example.com/uploads/leaves/proof.docx');
  assert.equal(leaveAttachmentUrl('https://files.example.com/proof.pdf','/backend-api'),'https://files.example.com/proof.pdf');
  for(const value of [null,'','javascript:alert(1)','data:text/html,test','//external.example.com/file','file:///test.pdf']) assert.equal(leaveAttachmentUrl(value,'/backend-api'),'');
});

test('leave attachments accept images and reject documents or disguised files', async () => {
  const {leaveFileError}=await import('../src/api/leaveAttachments.js');
  for(const name of ['proof.pdf','proof.doc','proof.docx']) assert.ok(leaveFileError(new File(['data'],name,{type:'application/pdf'})));
  assert.ok(leaveFileError(new File(['data'],'proof.pdf',{type:'image/png'})));
  for(const [name,type] of [['proof.png','image/png'],['proof.jpg','image/jpeg'],['proof.webp','image/webp']]) assert.equal(leaveFileError(new File(['image'],name,{type})), '');
});
test('leave attachments reject oversized files with Khmer size feedback', async()=>{
  const {leaveFileError,LEAVE_FILE_LIMIT}=await import('../src/api/leaveAttachments.js');
  assert.match(leaveFileError({name:'proof.png',type:'image/png',size:LEAVE_FILE_LIMIT+1}),/១០ MB/);
});
