import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { activeShotAtTime, evaluateActorAtTime, evaluateCameraAtTime } from '../src/sequence.js';

const doc=directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다. 카메라는 역동적으로 두 사람 사이를 오가며 추격한다.');

test('도망자와 추격자는 시간에 따라 실제 월드 위치가 이동한다',()=>{
  const a0=evaluateActorAtTime(doc,'actor_01',0);
  const a10=evaluateActorAtTime(doc,'actor_01',10);
  const b0=evaluateActorAtTime(doc,'actor_02',0);
  const b10=evaluateActorAtTime(doc,'actor_02',10);
  assert.ok(a10.position[2]>a0.position[2]+10);
  assert.ok(b10.position[2]>b0.position[2]+10);
  assert.equal(a10.action,'run');
  assert.equal(b10.action,'chase');
});

test('20초 마스터 타임라인에서 활성 샷이 올바르게 바뀐다',()=>{
  assert.equal(activeShotAtTime(doc,1).id,'shot_01');
  assert.equal(activeShotAtTime(doc,5).id,'shot_02');
  assert.equal(activeShotAtTime(doc,11).id,'shot_03');
  assert.equal(activeShotAtTime(doc,18).id,'shot_04');
});

test('카메라 위치는 샷 종류와 시간에 따라 실제로 이동한다',()=>{
  const c4=evaluateCameraAtTime(doc,4.1);
  const c8=evaluateCameraAtTime(doc,8.8);
  const c15=evaluateCameraAtTime(doc,15);
  const c19=evaluateCameraAtTime(doc,19);
  assert.notDeepEqual(c4.position,c8.position);
  assert.equal(c4.shot.camera.movement,'track_follow');
  assert.equal(c15.shot.camera.movement,'track_between');
  assert.notDeepEqual(c15.position,c19.position);
});
