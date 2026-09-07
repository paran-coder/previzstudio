import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { APP_VERSION, BUILD_INFO } from '../src/build-info.js';

const root=new URL('../',import.meta.url);

test('런타임 build identity는 v1.3.2으로 고정된다',()=>{
  assert.equal(APP_VERSION,'1.3.2');
  assert.equal(BUILD_INFO.appVersion,'1.3.2');
  assert.ok(BUILD_INFO.buildId);
});

test('OG 이미지는 Vite public 디렉터리에서 배포된다',async()=>{
  const info=await stat(new URL('public/og.png',root));
  assert.ok(info.size>10000);
  const html=await readFile(new URL('index.html',root),'utf8');
  assert.match(html,/https:\/\/previzstudio\.vercel\.app\/og\.png/);
});

test('Vercel 캐시는 HTML no-store, hashed asset immutable 정책을 사용한다',async()=>{
  const config=JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
  const rootHeader=config.headers.find(x=>x.source==='/');
  const assetHeader=config.headers.find(x=>x.source==='/assets/(.*)');
  assert.match(rootHeader.headers[0].value,/no-store/);
  assert.match(assetHeader.headers[0].value,/immutable/);
});
