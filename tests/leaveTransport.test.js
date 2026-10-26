import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import axios from 'axios';
import { readFile } from 'node:fs/promises';
import { leaveBody } from '../src/api/employeeData.js';
import { API_ENDPOINTS } from '../src/api/endpoints.js';

test('leave requests preserve JSON null without a file and multipart boundaries for uploads', async () => {
  const received=[];
  const server=createServer(async(req,res)=>{
    let raw=''; for await(const chunk of req) raw+=chunk;
    received.push({method:req.method,url:req.url,type:req.headers['content-type'],raw});
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({result:true}));
  });
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  try {
    const transport=axios.create({baseURL:`http://127.0.0.1:${server.address().port}`,adapter:'http',proxy:false});
    globalThis.__leaveTransport = transport;
    const source=(await readFile(new URL('../src/api/employeeApi.js',import.meta.url),'utf8'))
      .replace("import { apiRequest } from './client';", 'const apiRequest = (endpoint, options={}) => globalThis.__leaveTransport.request({method:endpoint.method,url:endpoint.path,data:options.body});')
      .replace("import { API_ENDPOINTS } from './endpoints';", `const API_ENDPOINTS=${JSON.stringify(API_ENDPOINTS)};`);
    const {employeeApi}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const form={startDate:'2026-10-26',endDate:'2026-10-27',reason:'Family matter'};
    await employeeApi.createLeave(leaveBody(form));
    const body=leaveBody({...form,file:new File(['test-document-content'],'proof.pdf',{type:'application/octet-stream'})});
    await employeeApi.updateLeave(16,body);
    for(const request of received.slice(1)) {
      assert.match(request.type,/^multipart\/form-data; boundary=/);
      assert.match(request.raw,/name="reason"\r\n\r\nFamily matter/);
      assert.match(request.raw,/name="start_date"\r\n\r\n2026-10-26/);
      assert.match(request.raw,/name="end_date"\r\n\r\n2026-10-27/);
    }
    assert.equal(received[0].method,'POST');
    assert.equal(received[0].url,'/leaveRequest');
    assert.match(received[0].type,/application\/json/);
    assert.deepEqual(JSON.parse(received[0].raw), {reason:'Family matter',start_date:'2026-10-26',end_date:'2026-10-27',file_url:null});
    assert.equal(received[1].method,'PUT');
    assert.match(received[1].raw,/name="id"\r\n\r\n16/);
    assert.match(received[1].raw,/name="file"; filename="proof.pdf"/);
    assert.match(received[1].raw,/Content-Type: application\/pdf/);
    assert.match(received[1].raw,/test-document-content/);
    assert.equal(body.has('id'),false);
    assert.equal(body.has('file_url'),false, 'uploaded files use file, not the stored URL field');
  } finally { delete globalThis.__leaveTransport; await new Promise(resolve=>server.close(resolve)); }
});
