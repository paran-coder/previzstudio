import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);

test('UI는 편집 뷰와 카메라 프리뷰를 명확히 분리한다',async()=>{
  const html=await readFile(new URL('index.html',root),'utf8');
  assert.match(html,/data-view="edit">편집 뷰/);
  assert.match(html,/data-view="preview">카메라 프리뷰/);
  assert.match(html,/id="view-status"/);
  assert.match(html,/id="shot-overlay"/);
  assert.match(html,/id="build-status"/);
});

test('다크 UI는 surface layering과 제한된 accent 토큰을 갖는다',async()=>{
  const css=await readFile(new URL('styles.css',root),'utf8');
  for(const token of ['--abyss:#05070a','--workspace:#090d11','--panel:#11171d','--panel-elevated:#1b232b','--interactive:#222c35','--accent:#c6ff4a','--cyan:#4cb8e8','--purple:#9a7bff']) assert.ok(css.includes(token),token);
  assert.match(css,/\.패널헤더\{[^}]*font-size:13px/);
  assert.match(css,/\.타임클립 span\{[^}]*font-size:11px/);
  assert.match(css,/data-view="preview"[^}]*\.세이프프레임\{display:none/);
});

test('Preview PNG Video는 동일한 renderCanonicalFrame 엔트리 포인트를 사용한다',async()=>{
  const exporter=await readFile(new URL('src/video-exporter.js',root),'utf8');
  assert.ok((exporter.match(/engine\.renderCanonicalFrame\(timestamp\)/g)||[]).length>=2);
  assert.doesNotMatch(exporter,/renderExportFrame/);
  for(const name of ['renderer-canvas.js','renderer-three.js']){
    const source=await readFile(new URL(`src/${name}`,root),'utf8');
    assert.match(source,/renderCanonicalFrame\(time\)/);
    assert.match(source,/captureAtTime\(time\)[\s\S]*renderCanonicalFrame\(time\)/);
    assert.match(source,/viewMode==='preview'[\s\S]*renderCanonicalFrame\(this\.time\)/);
    assert.doesNotMatch(source,/renderExportFrame/);
  }
});

test('카메라 프리뷰 renderer는 고정 output aspect stage를 사용한다',async()=>{
  for(const name of ['renderer-canvas.js','renderer-three.js']){
    const source=await readFile(new URL(`src/${name}`,root),'utf8');
    assert.match(source,/fitAspectRect/);
    assert.match(source,/outputAspect/);
    assert.match(source,/viewMode==='preview'/);
    assert.match(source,/beginCanonicalOutput/);
  }
  const three=await readFile(new URL('src/renderer-three.js',root),'utf8');
  assert.match(three,/shotCamera\.aspect=this\.getOutputAspect\(\)/);
  assert.match(three,/requestedAspect-aspect/);
});

test('Vite production build는 CDN import map 대신 hashed assets와 npm dependencies를 사용한다',async()=>{
  const html=await readFile(new URL('index.html',root),'utf8');
  const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  const vite=await readFile(new URL('vite.config.js',root),'utf8');
  const vercel=JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
  assert.doesNotMatch(html,/importmap/);
  assert.doesNotMatch(html,/cdn\.jsdelivr\.net/);
  assert.equal(pkg.version,'1.2.3');
  assert.equal(pkg.dependencies.three,'0.185.1');
  assert.equal(pkg.dependencies.mediabunny,'1.55.7');
  assert.match(pkg.scripts.build,/vite build/);
  assert.match(vite,/\[name\]-\[hash\]\.js/);
  assert.equal(vercel.outputDirectory,'dist');
});
