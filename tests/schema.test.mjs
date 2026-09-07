import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { cloneSceneDocument, validateSceneDocument } from '../src/scene-schema.js';

test('렌즈 범위를 벗어나면 validation이 실패한다',()=>{
  const doc=cloneSceneDocument(directPromptFallback('밤의 도로에서 한 사람이 달린다.'));
  doc.shots[0].camera.lens=200;
  const result=validateSceneDocument(doc);
  assert.equal(result.ok,false);
  assert.match(result.errors.join(' '),/렌즈/);
});

test('샷들이 시퀀스 20초를 끊김 없이 채운다',()=>{
  const doc=directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다.');
  assert.equal(doc.shots[0].start,0);
  for(let i=1;i<doc.shots.length;i++)assert.equal(doc.shots[i].start,doc.shots[i-1].end);
  assert.equal(doc.shots.at(-1).end,doc.sequence.duration);
});

test('지원되지 않는 FPS는 validation이 실패한다',()=>{
  const doc=cloneSceneDocument(directPromptFallback('도로에서 한 사람이 달린다.'));
  doc.sequence.fps=29;
  const result=validateSceneDocument(doc);
  assert.equal(result.ok,false);
  assert.match(result.errors.join(' '),/지원 FPS/);
});
