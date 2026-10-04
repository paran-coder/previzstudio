import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const stableHashes = {
// v1.4.0 intentionally changes app, renderer and sequence; behavior is covered by composition/sequence/browser tests.


  'src/video-exporter.js': '1004aa38833b3496b74b6c6b9878952b49cb4a7a29595cf8a299da79ecd77146',
};

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

test('영상 출력 모듈은 안정 기준과 동일하다 (LF 정규화)', async () => {
  for (const [path, expected] of Object.entries(stableHashes)) {
    const content = (await readFile(path,'utf8')).replaceAll('\r\n','\n');
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
