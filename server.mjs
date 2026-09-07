import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { SCENE_JSON_SCHEMA, validateSceneDocument } from './src/scene-schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('='); if (i < 1) continue;
    const key = line.slice(0, i).trim(); let value = line.slice(i + 1).trim();
    value = value.replace(/^['\"]|['\"]$/g, '');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadLocalEnv();

const PORT = Number(process.env.PORT || 4173);
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-astra';
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml', '.glb':'model/gltf-binary', '.gltf':'model/gltf+json', '.md':'text/markdown; charset=utf-8'
};

function json(res, status, data) {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  let total = 0; const chunks = [];
  for await (const chunk of req) {
    total += chunk.length; if (total > 1_000_000) throw new Error('요청이 너무 큽니다.'); chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n');
}

export async function callDirector(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('OPENAI_API_KEY가 설정되지 않았습니다.'), { statusCode: 503 });

  const instructions = `당신은 영화·광고·AI 영상 제작을 위한 3D 프리비즈 Director입니다.
사용자의 장면을 1~8개의 명확한 샷으로 분해하십시오. 먼저 공간을 이해할 수 있는 샷을 만들고, 인물 관계와 감정에 필요한 커버리지를 배치한 뒤, 필요한 경우 카메라 이동으로 마무리하십시오.
배우 ID와 공간 배치를 샷 사이에서 절대 바꾸지 마십시오. 렌즈는 18~120mm, 각 샷은 1~30초 범위입니다.
환경 assetId는 warehouse일 때 warehouse_blockout, 그 외에는 <environment>_procedural을 사용하십시오.
배우 assetId는 actor_neutral을 사용하십시오. 도시 골목에 차량이 필요할 때는 sedan_blockout을 사용할 수 있습니다.
렌더러 코드나 설명문을 출력하지 말고 제공된 JSON Schema에 맞는 Scene Document만 생성하십시오.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      store: false,
      instructions,
      input: prompt,
      text: { format: { type: 'json_schema', name: 'previz_scene', strict: true, schema: SCENE_JSON_SCHEMA } }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI API ${response.status}`;
    throw Object.assign(new Error(message), { statusCode: 502 });
  }
  const text = extractOutputText(data);
  if (!text) throw Object.assign(new Error('AI Director 응답에 구조화된 텍스트가 없습니다.'), { statusCode: 502 });
  let scene;
  try { scene = JSON.parse(text); } catch { throw Object.assign(new Error('AI Director JSON 파싱에 실패했습니다.'), { statusCode: 502 }); }
  const validation = validateSceneDocument(scene);
  if (!validation.ok) throw Object.assign(new Error(validation.errors.join(' ')), { statusCode: 502 });
  return scene;
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const publicPath = requested === '/index.html' || requested === '/styles.css' || requested.startsWith('/src/') || requested.startsWith('/assets/');
  if (!publicPath || requested.split('/').some((part) => part.startsWith('.'))) return json(res, 404, { error:'파일을 찾을 수 없습니다.' });
  const safe = path.normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, safe);
  if (!filePath.startsWith(__dirname)) return json(res, 403, { error:'금지된 경로입니다.' });
  try {
    const s = await stat(filePath); if (!s.isFile()) throw new Error('not file');
    const body = await readFile(filePath); const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
    res.end(body);
  } catch { json(res, 404, { error:'파일을 찾을 수 없습니다.' }); }
}

export async function handleRequest(req, res) {
  if (req.method === 'GET' && req.url === '/api/health') {
    return json(res, 200, { ok:true, version:'1.1.0', aiDirector:Boolean(process.env.OPENAI_API_KEY), model:OPENAI_MODEL });
  }
  if (req.method === 'POST' && req.url === '/api/direct') {
    try {
      const body = await readJsonBody(req); const prompt = String(body.prompt || '').trim();
      if (!prompt) return json(res, 400, { error:'prompt가 필요합니다.' });
      const scene = await callDirector(prompt);
      return json(res, 200, { scene, model:OPENAI_MODEL });
    } catch (error) {
      return json(res, error.statusCode || 500, { error:String(error.message || error) });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error:'지원하지 않는 메서드입니다.' });
  return serveStatic(req, res);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = http.createServer((req, res) => { handleRequest(req, res); });
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Previz Studio v1.1.0: http://127.0.0.1:${PORT}`);
    console.log(`AI Director: ${process.env.OPENAI_API_KEY ? `ON (${OPENAI_MODEL})` : 'OFF · local fallback in browser'}`);
  });
}
