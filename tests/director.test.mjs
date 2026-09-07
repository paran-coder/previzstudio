import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { validateSceneDocument } from '../src/scene-schema.js';

test('대치 장면을 4개 멀티샷으로 분해한다', () => {
  const doc = directPromptFallback('밤의 창고. 두 사람이 서로 마주 서 있다. 와이드로 공간을 보여준 뒤 마지막에는 두 사람 사이로 카메라가 천천히 이동한다.');
  assert.equal(doc.scene.environment.type, 'warehouse');
  assert.equal(doc.scene.environment.time, 'night');
  assert.equal(doc.actors.length, 2);
  assert.equal(doc.shots.length, 4);
  assert.equal(doc.shots[0].camera.lens, 24);
  assert.equal(doc.shots[3].camera.movement, 'dolly_through');
  assert.equal(validateSceneDocument(doc).ok, true);
});

test('트래킹 프롬프트는 단일 추적 샷으로 만든다', () => {
  const doc = directPromptFallback('비 오는 골목에서 두 명을 85mm로 4초 동안 따라간다.');
  assert.equal(doc.scene.environment.type, 'urban_alley');
  assert.equal(doc.scene.environment.weather, 'rain');
  assert.equal(doc.props[0].assetId, 'sedan_blockout');
  assert.equal(doc.shots.length, 1);
  assert.equal(doc.shots[0].camera.movement, 'tracking');
  assert.equal(doc.shots[0].camera.lens, 85);
  assert.equal(doc.shots[0].duration, 4);
});
