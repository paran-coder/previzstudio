import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../server.mjs';

function fakeResponse(){return {status:null,headers:null,body:'',writeHead(status,headers){this.status=status;this.headers=headers;},end(data=''){this.body+=Buffer.isBuffer(data)?data.toString('utf8'):String(data||'');}};}

test('health endpoint는 v1.3.2 로컬 디렉터 상태를 반환한다',async()=>{
  const req={method:'GET',url:'/api/health',headers:{host:'localhost'}};
  const res=fakeResponse();
  await handleRequest(req,res);
  assert.equal(res.status,200);
  const data=JSON.parse(res.body);
  assert.equal(data.version,'1.3.2');
  assert.equal(data.director,'local-command-parser');
});
