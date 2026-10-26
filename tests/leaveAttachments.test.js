import test from 'node:test';
import assert from 'node:assert/strict';
import { leaveAttachmentUrl } from '../src/api/leaveAttachments.js';

test('leave attachment links support uploaded files on the API host and reject executable URLs', () => {
  assert.equal(leaveAttachmentUrl('uploads/leaves/proof.pdf','/backend-api'),'/backend-api/uploads/leaves/proof.pdf');
  assert.equal(leaveAttachmentUrl('/uploads/leaves/proof.docx','https://backend.example.com/'),'https://backend.example.com/uploads/leaves/proof.docx');
  assert.equal(leaveAttachmentUrl('https://files.example.com/proof.pdf','/backend-api'),'https://files.example.com/proof.pdf');
  for(const value of [null,'','javascript:alert(1)','data:text/html,test','//external.example.com/file','file:///test.pdf']) assert.equal(leaveAttachmentUrl(value,'/backend-api'),'');
});

test('PDF and Word uploads use canonical MIME types when the browser reports generic binary', async () => {
  const {leaveUploadFile}=await import('../src/api/leaveAttachments.js');
  for(const [name,type] of [['RockyLinux Answers.pdf','application/pdf'],['evidence.doc','application/msword'],['evidence.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document']]) {
    const source=new File(['document'],name,{type:'application/octet-stream',lastModified:1234});
    const upload=leaveUploadFile(source);
    assert.equal(upload.type,type);
    assert.equal(upload.name,name);
    assert.equal(upload.lastModified,1234);
    assert.equal(await upload.text(),'document');
  }
  assert.equal(leaveUploadFile(new File(['%PDF-1.7'],'proof.pdf')).type,'application/pdf');
  const unsafe=new File(['html'],'proof.pdf',{type:'text/html'});
  assert.equal(leaveUploadFile(unsafe),unsafe,'do not disguise an explicitly different content type');
});

test('leave attachments reject oversized files with Khmer size feedback', async()=>{
  const {leaveFileError,LEAVE_FILE_LIMIT}=await import('../src/api/leaveAttachments.js');
  assert.match(leaveFileError({name:'proof.pdf',type:'application/pdf',size:LEAVE_FILE_LIMIT+1}),/១០ MB/);
});
