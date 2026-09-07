import { directPrompt } from './director-client.js';
import { directPromptFallback } from './director-fallback.js';
import { cloneSceneDocument, validateSceneDocument } from './scene-schema.js';
import { CanvasSceneEngine } from './renderer-canvas.js';

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const els = {
  viewport: $('#viewport'), prompt: $('#prompt'), generate: $('#generate'), play: $('#play'), reset: $('#reset'),
  timeline: $('#timeline'), timelineTime: $('#timeline-time'), progressReadout: $('#progress-readout'),
  lens: $('#lens'), duration: $('#duration'), distance: $('#distance'), movementLabel: $('#movement-label'),
  sceneTree: $('#scene-tree'), environmentLabel: $('#environment-label'), cameraLabel: $('#camera-label'),
  shotStrip: $('#shot-strip'), shotCount: $('#shot-count'), shotIndexLabel: $('#shot-index-label'),
  intentTitle: $('#intent-title'), intentCopy: $('#intent-copy'), shotIntent: $('#shot-intent'),
  continuityLabel: $('#continuity-label'), directorMode: $('#director-mode'), rendererStatus: $('#renderer-status'),
  showJson: $('#show-json'), exportJson: $('#export-json'), dialog: $('#json-dialog'), closeJson: $('#close-json'),
  jsonOutput: $('#json-output'), toast: $('#toast')
};

let sceneDoc = directPromptFallback(els.prompt.value);
let shotIndex = 0;
let engine;
let toastTimer;

const movementLabels = {
  dolly_through: '돌리 통과', dolly_forward: '돌리 전진', tracking: '트래킹', orbit: '오비트', static: '고정'
};
const envLabels = { warehouse: '창고', urban_alley: '도시 골목', office: '사무실', studio: '스튜디오' };
const timeLabels = { night: '밤', day: '낮' };

function formatTime(sec) {
  const s = Math.max(0, sec); const whole = Math.floor(s); const tenth = Math.floor((s - whole) * 10);
  return `00:${String(whole).padStart(2,'0')}.${tenth}`;
}
function showToast(msg) {
  els.toast.textContent = msg; els.toast.classList.add('보임'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('보임'), 1900);
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

async function initEngine() {
  try {
    const { createThreeSceneEngine } = await import('./renderer-three.js');
    const next = await createThreeSceneEngine(els.viewport);
    els.rendererStatus.textContent = next.rendererLabel;
    els.rendererStatus.classList.add('온라인');
    return next;
  } catch (error) {
    const next = new CanvasSceneEngine(els.viewport);
    els.rendererStatus.textContent = 'Canvas 대체 렌더러';
    els.rendererStatus.classList.add('대체');
    console.info('[Previz] Three.js 로드 실패, Canvas fallback 사용:', error?.message || error);
    return next;
  }
}

function renderTree() {
  const env = sceneDoc.scene.environment;
  const actors = sceneDoc.actors.map((a, i) => `<button class="트리아이템"><span class="트리아이콘">${i+1}</span><span>${a.id.toUpperCase()}</span></button>`).join('');
  const props = sceneDoc.props.length ? sceneDoc.props.map((p) => `<button class="트리아이템"><span class="트리아이콘">◇</span><span>${p.id.toUpperCase()}</span></button>`).join('') : `<div class="트리아이템"><span class="트리아이콘">–</span><span>없음</span></div>`;
  const cameras = sceneDoc.shots.map((s, i) => `<button class="트리아이템"><span class="트리아이콘">⌁</span><span>샷 카메라 ${String(i+1).padStart(2,'0')}</span></button>`).join('');
  els.sceneTree.innerHTML = `
    <div class="트리그룹"><div class="트리제목">환경</div><button class="트리아이템"><span class="트리아이콘">◇</span><span>${envLabels[env.type] || env.type}</span></button></div>
    <div class="트리그룹"><div class="트리제목">배우</div>${actors}</div>
    <div class="트리그룹"><div class="트리제목">소품</div>${props}</div>
    <div class="트리그룹"><div class="트리제목">카메라</div>${cameras}</div>
    <div class="트리그룹"><div class="트리제목">조명</div><button class="트리아이템"><span class="트리아이콘">✦</span><span>시네마틱 라이트 리그</span></button></div>`;
}

function renderShots() {
  els.shotCount.textContent = `${sceneDoc.shots.length}개 샷`;
  els.shotStrip.innerHTML = sceneDoc.shots.map((shot, i) => `
    <button class="샷카드 ${i===shotIndex?'선택':''}" data-shot="${i}">
      <span class="샷번호">샷 ${String(i+1).padStart(2,'0')}</span>
      <strong>${shot.title}</strong>
      <span class="샷메타">${shot.duration.toFixed(1)}초 · ${shot.camera.lens}mm · ${movementLabels[shot.camera.movement]}</span>
    </button>`).join('');
  $$('[data-shot]').forEach((button) => button.addEventListener('click', () => selectShot(Number(button.dataset.shot))));
}

function syncUI() {
  const shot = sceneDoc.shots[shotIndex]; const env = sceneDoc.scene.environment;
  els.lens.value = shot.camera.lens; els.duration.value = shot.duration; els.distance.value = shot.camera.distance;
  els.movementLabel.textContent = movementLabels[shot.camera.movement] || shot.camera.movement;
  els.environmentLabel.textContent = `${envLabels[env.type] || env.type} · ${timeLabels[env.time] || env.time}`;
  els.cameraLabel.textContent = `${shot.camera.lens}mm · ${movementLabels[shot.camera.movement]}`;
  els.shotIndexLabel.textContent = `샷 ${String(shotIndex+1).padStart(2,'0')}`;
  els.intentTitle.textContent = shot.title; els.intentCopy.textContent = shot.intent; els.shotIntent.textContent = shot.intent;
  els.continuityLabel.textContent = sceneDoc.scene.continuityKey;
  els.jsonOutput.textContent = JSON.stringify(sceneDoc, null, 2);
  renderTree(); renderShots(); updateProgressUI(engine?.progress || 0, engine?.playing || false);
}

function updateProgressUI(progress, playing = false) {
  if (!sceneDoc.shots[shotIndex]) return;
  const duration = sceneDoc.shots[shotIndex].duration;
  els.timeline.value = String(progress); els.timelineTime.textContent = formatTime(duration * progress);
  els.progressReadout.textContent = `${formatTime(duration * progress)} / ${formatTime(duration)}`;
  els.play.textContent = playing ? 'Ⅱ' : '▶';
}

async function loadScene(next, mode = 'fallback', model = '') {
  const check = validateSceneDocument(next);
  if (!check.ok) { showToast(check.errors[0]); return; }
  sceneDoc = next; shotIndex = 0;
  await engine.loadDocument(sceneDoc);
  engine.onProgress = updateProgressUI;
  els.directorMode.textContent = mode === 'llm' ? `AI 연출: ${model || 'LLM'}` : 'AI 연출: 로컬 대체';
  els.directorMode.classList.toggle('온라인', mode === 'llm');
  els.directorMode.classList.toggle('대체', mode !== 'llm');
  syncUI();
}

function selectShot(index) {
  if (!sceneDoc.shots[index]) return;
  shotIndex = index; engine.selectShot(index); syncUI();
}

function updateShotFromInspector() {
  const next = cloneSceneDocument(sceneDoc); const shot = next.shots[shotIndex];
  shot.camera.lens = Math.max(18, Math.min(120, Number(els.lens.value) || 35));
  shot.duration = Math.max(1, Math.min(30, Number(els.duration.value) || 4));
  shot.camera.distance = Math.max(0, Math.min(30, Number(els.distance.value) || 0));
  if (shot.camera.movement === 'dolly_through') {
    const d = Math.max(2, shot.camera.distance); shot.camera.start = [0,1.7,d/2]; shot.camera.end = [0,1.7,-d/2];
  } else if (shot.camera.movement === 'dolly_forward') {
    const d = Math.max(1, shot.camera.distance); shot.camera.end = [...shot.camera.start]; shot.camera.end[2] -= d;
  }
  sceneDoc = next; engine.updateShot(sceneDoc.shots[shotIndex]); syncUI();
}

function buildManifest() {
  return {
    format: 'previz-reference-pack', version: '1.1.0', sourcePrompt: sceneDoc.sourcePrompt,
    continuityKey: sceneDoc.scene.continuityKey, environment: sceneDoc.scene.environment,
    actors: sceneDoc.actors.map(({id,role,assetId,position,action}) => ({id,role,assetId,position,action})),
    shots: sceneDoc.shots.map((shot, i) => ({
      id: shot.id, title: shot.title, intent: shot.intent, duration: shot.duration,
      lens: shot.camera.lens, movement: shot.camera.movement, cameraStart: shot.camera.start,
      cameraEnd: shot.camera.end, target: shot.camera.target,
      referenceFrames: ['start','mid','end'].map((role, j) => ({ role, progress: [0,.5,1][j], suggestedFilename: `previz-shot${String(i+1).padStart(2,'0')}-${role}.png` }))
    })),
    aiVideoReference: { continuityInstruction: '모든 샷에서 배우 정체성, 의상, 공간 배치, 시간대와 조명 연속성을 유지한다.' }
  };
}

async function capture(progress, role) {
  const blob = await engine.capture(progress); if (!blob) return showToast('프레임 캡처에 실패했습니다.');
  downloadBlob(blob, `previz-shot${String(shotIndex+1).padStart(2,'0')}-${role}.png`); showToast(`${role} 프레임을 저장했습니다.`);
}

els.generate.addEventListener('click', async () => {
  const prompt = els.prompt.value.trim(); if (!prompt) return;
  els.generate.disabled = true; els.generate.querySelector('span').textContent = '연출 중…';
  const result = await directPrompt(prompt);
  await loadScene(result.scene, result.mode, result.model);
  showToast(result.mode === 'llm' ? 'AI Director가 멀티샷 장면을 생성했습니다.' : '로컬 Director로 장면을 생성했습니다.');
  els.generate.disabled = false; els.generate.querySelector('span').textContent = '장면 생성';
});
els.prompt.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') els.generate.click(); });
els.play.addEventListener('click', () => { if (engine.progress >= 1) engine.applyProgress(0); engine.setPlaying(!engine.playing); updateProgressUI(engine.progress, engine.playing); });
els.reset.addEventListener('click', () => engine.reset());
els.timeline.addEventListener('input', () => { engine.setPlaying(false); engine.applyProgress(Number(els.timeline.value)); updateProgressUI(engine.progress, false); });
for (const el of [els.lens, els.duration, els.distance]) el.addEventListener('change', updateShotFromInspector);
$$('[data-view]').forEach((button) => button.addEventListener('click', () => { $$('[data-view]').forEach((b) => b.classList.toggle('활성', b===button)); engine.setViewMode(button.dataset.view); }));
$('#ref-start').addEventListener('click', () => capture(0, 'start')); $('#ref-mid').addEventListener('click', () => capture(.5, 'mid')); $('#ref-end').addEventListener('click', () => capture(1, 'end'));
$('#ref-manifest').addEventListener('click', () => downloadBlob(new Blob([JSON.stringify(buildManifest(), null, 2)], {type:'application/json'}), 'previz-reference-pack-v1.1.0.json'));
els.showJson.addEventListener('click', () => { els.jsonOutput.textContent = JSON.stringify(sceneDoc, null, 2); els.dialog.showModal(); });
els.closeJson.addEventListener('click', () => els.dialog.close());
els.dialog.addEventListener('click', (e) => { if (e.target === els.dialog) els.dialog.close(); });
els.exportJson.addEventListener('click', () => { downloadBlob(new Blob([JSON.stringify(sceneDoc, null, 2)], {type:'application/json'}), 'previz-scene-v1.1.0.json'); showToast('씬 JSON을 저장했습니다.'); });

engine = await initEngine();
await loadScene(sceneDoc, 'fallback');
showToast('Previz Studio v1.1.0 준비 완료');
