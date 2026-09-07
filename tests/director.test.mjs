import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { validateSceneDocument } from '../src/scene-schema.js';

test('밤의 도로 추격 프롬프트를 20초 4샷 시퀀스로 만든다',()=>{
  const doc=directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다. 카메라는 역동적으로 두 사람 사이를 오가며 추격한다.');
  assert.equal(doc.version,'1.2.3');
  assert.equal(doc.sequence.duration,20);
  assert.equal(doc.sequence.fps,24);
  assert.equal(doc.sequence.width,1920);
  assert.equal(doc.sequence.height,1080);
  assert.equal(doc.scene.environment.type,'road');
  assert.equal(doc.scene.environment.time,'night');
  assert.equal(doc.actors.length,2);
  assert.equal(doc.actors[0].actions[0].type,'run');
  assert.equal(doc.actors[1].actions[0].type,'chase');
  assert.equal(doc.shots.length,4);
  assert.deepEqual(doc.shots.map(s=>s.end-s.start),[4,5,5,6]);
  assert.equal(doc.shots[0].camera.archetype,'rear_three_quarter');
  assert.equal(doc.shots[1].camera.archetype,'side_track');
  assert.equal(doc.shots[3].camera.movement,'track_between');
  assert.equal(validateSceneDocument(doc).ok,true);
});

test('지원되는 표현만 추출하는 일반 프롬프트도 유효한 장면을 만든다',()=>{
  const doc=directPromptFallback('밤의 복도에서 한 사람이 50mm로 달린다. 카메라는 따라간다.');
  assert.equal(doc.scene.environment.type,'corridor');
  assert.equal(doc.shots[0].camera.lens,50);
  assert.equal(doc.shots[0].camera.movement,'track_follow');
  assert.equal(doc.actors[0].actions[0].type,'run');
  assert.equal(validateSceneDocument(doc).ok,true);
});
