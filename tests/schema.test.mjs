import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { cloneSceneDocument, validateSceneDocument } from '../src/scene-schema.js';

test('렌즈 범위를 벗어나면 validation이 실패한다', () => {
  const doc = cloneSceneDocument(directPromptFallback('창고에서 두 사람이 대치한다.'));
  doc.shots[0].camera.lens = 200;
  const result = validateSceneDocument(doc);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /렌즈/);
});

test('모든 멀티샷이 동일한 배우 ID를 참조할 수 있는 continuity 구조를 가진다', () => {
  const doc = directPromptFallback('창고에서 두 사람이 대치한다.');
  assert.ok(doc.scene.continuityKey);
  assert.deepEqual(doc.actors.map(a => a.id), ['actor_01','actor_02']);
  assert.ok(doc.shots.every(s => Array.isArray(s.camera.target)));
});
