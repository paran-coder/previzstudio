import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const stableHashes = {
  'src/app.js': 'dd94220f6b1ff24d4ce6fb92d96da3108ef211862185d3a0deff167539011d59',
  'src/renderer-three.js': '0c828e5ca247dd3d0ee1407f95397e08f4319ac97a03d0b033f918b3499d7a28',
  'src/sequence.js': '9f281517aee9eae5dcf3c718829a5755ff84a2ec920809609f35c8b415032f1e',
  'src/video-exporter.js': '1004aa38833b3496b74b6c6b9878952b49cb4a7a29595cf8a299da79ecd77146',
};

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

test('v1.3.5 recovery runtime core는 사용자 업로드 v1.3.1 baseline과 동일하다', async () => {
  for (const [path, expected] of Object.entries(stableHashes)) {
    const content = await readFile(path);
    assert.equal(sha256(content), expected, `${path} changed from stable v1.3.1 baseline`);
  }
});

test('회귀를 만든 post-v1.3.1 상태 관리 기능은 recovery runtime에 없다', async () => {
  const runtime = [
    await readFile('src/app.js', 'utf8'),
    await readFile('src/renderer-three.js', 'utf8'),
    await readFile('index.html', 'utf8'),
  ].join('\n');

  for (const forbidden of [
    'transformSpace',
    'lastSafeCamera',
    'cameraSafety',
    'fallbackCamera',
    'undoStack',
    'redoStack',
  ]) {
    assert.equal(runtime.includes(forbidden), false, `${forbidden} must not be present in recovery runtime`);
  }
});
