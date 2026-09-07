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
});

test('다크 UI는 surface layering과 제한된 accent 토큰을 갖는다',async()=>{
  const css=await readFile(new URL('styles.css',root),'utf8');
  for(const token of ['--abyss:#05070a','--workspace:#090d11','--panel:#11171d','--panel-elevated:#1b232b','--interactive:#222c35','--accent:#c6ff4a','--cyan:#4cb8e8','--purple:#9a7bff']) assert.ok(css.includes(token),token);
  assert.match(css,/\.패널헤더\{[^}]*font-size:13px/);
  assert.match(css,/\.타임클립 span\{[^}]*font-size:11px/);
  assert.match(css,/data-view=\"preview\"[^}]*\.세이프프레임\{display:none/);
});

test('카메라 프리뷰와 export 렌더러는 동일한 applyTime evaluator 경로를 사용한다',async()=>{
  for(const name of ['renderer-canvas.js','renderer-three.js']){
    const source=await readFile(new URL(`src/${name}`,root),'utf8');
    assert.match(source,/renderExportFrame\(time\)\{this\.applyTime\(time\)/);
    assert.match(source,/applyTime\(next\)/);
    assert.match(source,/viewMode==='preview'/);
  }
});


test('카메라 프리뷰 renderer는 고정 output aspect stage를 사용한다',async()=>{
  for(const name of ['renderer-canvas.js','renderer-three.js']){
    const source=await readFile(new URL(`src/${name}`,root),'utf8');
    assert.match(source,/fitAspectRect/);
    assert.match(source,/outputAspect/);
    assert.match(source,/viewMode==='preview'/);
  }
  const three=await readFile(new URL('src/renderer-three.js',root),'utf8');
  assert.match(three,/shotCamera\.aspect=this\.getOutputAspect\(\)/);
  assert.doesNotMatch(three,/for\(const cam of \[this\.directorCamera,this\.shotCamera\]\)/);
});

test('PNG capture는 export와 같은 canonical output buffer를 사용한다',async()=>{
  for(const name of ['renderer-canvas.js','renderer-three.js']){
    const source=await readFile(new URL(`src/${name}`,root),'utf8');
    assert.match(source,/captureAtTime\(time\).*beginExport/s);
    assert.match(source,/finally\{this\.endExport\(\);\}/);
  }
});
