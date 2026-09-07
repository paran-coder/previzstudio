import test from 'node:test';
import assert from 'node:assert/strict';
import { extractOutputText, callDirector } from '../server.mjs';
import { directPromptFallback } from '../src/director-fallback.js';

test('Responses API output_text content를 추출한다', () => {
  const value = extractOutputText({ output:[{ content:[{ type:'output_text', text:'{"ok":true}' }] }] });
  assert.equal(value, '{"ok":true}');
});


test('AI Director가 Responses Structured Outputs 포맷으로 요청한다', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, body: JSON.parse(init.body), headers: init.headers };
    const scene = directPromptFallback('창고에서 두 사람이 대치한다.');
    return { ok: true, status: 200, async json() { return { output: [{ content: [{ type: 'output_text', text: JSON.stringify(scene) }] }] }; } };
  };
  try {
    const scene = await callDirector('창고에서 두 사람이 대치한다.');
    assert.equal(scene.version, '1.1.0');
    assert.equal(captured.url, 'https://api.openai.com/v1/responses');
    assert.equal(captured.body.store, false);
    assert.equal(captured.body.text.format.type, 'json_schema');
    assert.equal(captured.body.text.format.strict, true);
    assert.equal(captured.headers.authorization, 'Bearer test-key');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
  }
});
