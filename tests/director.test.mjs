import test from 'node:test';
import assert from 'node:assert/strict';
import { directPrompt } from '../src/director.js';
import { validateSceneDocument } from '../src/scene-schema.js';

test('demo prompt becomes a valid warehouse dolly-through scene', () => {
  const doc = directPrompt('밤의 창고. 두 사람이 서로 마주 서 있고 카메라가 두 사람 사이로 천천히 이동한다.');
  assert.equal(validateSceneDocument(doc).ok, true);
  assert.equal(doc.scene.environment.type, 'warehouse');
  assert.equal(doc.scene.environment.time, 'night');
  assert.equal(doc.actors.length, 2);
  assert.equal(doc.shots[0].camera.movement, 'dolly_through');
  assert.equal(doc.shots[0].camera.lens, 35);
  assert.equal(doc.shots[0].duration, 6);
});

test('camera/lens/duration vocabulary is parsed', () => {
  const doc = directPrompt('비 오는 골목, 두 명을 85mm로 4초 동안 따라간다.');
  assert.equal(doc.scene.environment.type, 'urban_alley');
  assert.equal(doc.scene.environment.weather, 'rain');
  assert.equal(doc.actors.length, 2);
  assert.equal(doc.shots[0].camera.lens, 85);
  assert.equal(doc.shots[0].duration, 4);
  assert.equal(doc.shots[0].camera.movement, 'tracking');
});
