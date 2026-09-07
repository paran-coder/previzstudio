import { directPrompt } from './director.js';
import { cloneSceneDocument, validateSceneDocument } from './scene-schema.js';
import { SceneEngine } from './scene-engine.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  viewport: $('#viewport'),
  prompt: $('#prompt'),
  generate: $('#generate'),
  play: $('#play'),
  reset: $('#reset'),
  timeline: $('#timeline'),
  timelineTime: $('#timeline-time'),
  progressReadout: $('#progress-readout'),
  lens: $('#lens'),
  duration: $('#duration'),
  distance: $('#distance'),
  sceneTree: $('#scene-tree'),
  environmentLabel: $('#environment-label'),
  cameraLabel: $('#camera-label'),
  shotDurationLabel: $('#shot-duration-label'),
  showJson: $('#show-json'),
  exportJson: $('#export-json'),
  dialog: $('#json-dialog'),
  closeJson: $('#close-json'),
  jsonOutput: $('#json-output'),
  toast: $('#toast'),
};

const engine = new SceneEngine(els.viewport);
let sceneDoc = directPrompt(els.prompt.value);
let toastTimer;

function formatTime(seconds) {
  const whole = Math.floor(seconds);
  const tenth = Math.floor((seconds - whole) * 10);
  return `00:${String(whole).padStart(2, '0')}.${tenth}`;
}

function movementLabel(movement) {
  return ({
    dolly_through: 'DOLLY THROUGH',
    dolly_forward: 'DOLLY',
    tracking: 'TRACKING',
    orbit: 'ORBIT',
    static: 'STATIC',
  })[movement] || movement.toUpperCase();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 1800);
}

function renderTree(doc) {
  const env = doc.scene.environment;
  const actors = doc.actors.map((actor, index) => `
    <button class="tree-item" data-node="${actor.id}">
      <span class="tree-icon">${index + 1}</span>
      <span>${actor.id.replace('_', ' ').toUpperCase()}</span>
    </button>`).join('');

  els.sceneTree.innerHTML = `
    <div class="tree-group">
      <div class="tree-heading">Environment</div>
      <button class="tree-item"><span class="tree-icon">◇</span><span>${env.type.replace('_', ' ').toUpperCase()}</span></button>
    </div>
    <div class="tree-group">
      <div class="tree-heading">Actors</div>${actors}
    </div>
    <div class="tree-group">
      <div class="tree-heading">Cameras</div>
      <button class="tree-item"><span class="tree-icon">⌁</span><span>SHOT CAMERA 01</span></button>
    </div>
    <div class="tree-group">
      <div class="tree-heading">Lights</div>
      <button class="tree-item"><span class="tree-icon">✦</span><span>CINEMATIC RIG</span></button>
    </div>`;
}

function syncUI() {
  const shot = sceneDoc.shots[0];
  const env = sceneDoc.scene.environment;
  els.lens.value = shot.camera.lens;
  els.duration.value = shot.duration;
  els.distance.value = shot.camera.distance;
  els.environmentLabel.textContent = `${env.type.replace('_', ' ')} / ${env.time}`.toUpperCase();
  els.cameraLabel.textContent = `${shot.camera.lens} MM · ${movementLabel(shot.camera.movement)}`;
  els.shotDurationLabel.textContent = `${shot.duration.toFixed(1)} sec · ${shot.camera.lens}mm`;
  els.jsonOutput.textContent = JSON.stringify(sceneDoc, null, 2);
  renderTree(sceneDoc);
  updateProgressUI(engine.progress, engine.playing);
}

function updateProgressUI(progress, playing = engine.playing) {
  const duration = sceneDoc.shots[0].duration;
  els.timeline.value = String(progress);
  els.timelineTime.textContent = formatTime(duration * progress);
  els.progressReadout.textContent = `${formatTime(duration * progress)} / ${formatTime(duration)}`;
  els.play.textContent = playing ? 'Ⅱ' : '▶';
  els.play.setAttribute('aria-label', playing ? 'Pause previz' : 'Play previz');
}

function loadScene(nextDoc, toastMessage = 'Scene generated') {
  const validation = validateSceneDocument(nextDoc);
  if (!validation.ok) {
    showToast(validation.errors[0]);
    return false;
  }
  sceneDoc = nextDoc;
  engine.loadDocument(sceneDoc);
  syncUI();
  showToast(toastMessage);
  return true;
}

function updateShotFromInspector() {
  const next = cloneSceneDocument(sceneDoc);
  const shot = next.shots[0];
  shot.camera.lens = Math.max(18, Math.min(120, Number(els.lens.value) || 35));
  shot.duration = Math.max(1, Math.min(30, Number(els.duration.value) || 6));
  shot.camera.distance = Math.max(1, Math.min(16, Number(els.distance.value) || 8));

  if (shot.camera.movement === 'dolly_through') {
    shot.camera.start = [0, 1.7, shot.camera.distance / 2];
    shot.camera.end = [0, 1.7, -shot.camera.distance / 2];
  }

  sceneDoc = next;
  engine.updateShot(shot);
  syncUI();
}

function buildReferenceManifest(doc) {
  const shot = doc.shots[0];
  const env = doc.scene.environment;
  return {
    format: 'previz-reference-pack',
    version: '1.0.0',
    sourcePrompt: doc.sourcePrompt,
    continuityKey: doc.scene.continuityKey,
    environment: env,
    shot: {
      id: shot.id,
      title: shot.title,
      duration: shot.duration,
      lens: shot.camera.lens,
      movement: shot.camera.movement,
      cameraStart: shot.camera.start,
      cameraEnd: shot.camera.end,
      target: shot.camera.target,
    },
    actors: doc.actors.map(({ id, role, position, action }) => ({ id, role, position, action })),
    referenceFrames: [
      { role: 'start', progress: 0, suggestedFilename: 'previz-shot01-start.png' },
      { role: 'mid', progress: 0.5, suggestedFilename: 'previz-shot01-mid.png' },
      { role: 'end', progress: 1, suggestedFilename: 'previz-shot01-end.png' },
    ],
    aiVideoReference: {
      intent: `${shot.title}; ${shot.camera.lens}mm ${movementLabel(shot.camera.movement)}; ${env.type} ${env.time}`,
      continuityInstruction: 'Keep actor identities, spatial relationships, environment and lighting continuity across the shot.',
    },
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function capture(progress, name) {
  const blob = await engine.capture(progress);
  if (!blob) return showToast('Frame capture failed');
  downloadBlob(blob, `previz-shot01-${name}.png`);
  showToast(`${name.toUpperCase()} frame captured`);
}

els.generate.addEventListener('click', () => {
  const next = directPrompt(els.prompt.value);
  loadScene(next, 'Natural language → 3D scene updated');
});

els.prompt.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') els.generate.click();
});

els.play.addEventListener('click', () => {
  if (engine.progress >= 1) engine.applyProgress(0);
  engine.setPlaying(!engine.playing);
  updateProgressUI(engine.progress, engine.playing);
});

els.reset.addEventListener('click', () => engine.reset());
els.timeline.addEventListener('input', () => {
  engine.setPlaying(false);
  engine.applyProgress(Number(els.timeline.value));
  updateProgressUI(engine.progress, false);
});

for (const input of [els.lens, els.duration, els.distance]) {
  input.addEventListener('change', updateShotFromInspector);
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-view]').forEach((b) => b.classList.toggle('is-active', b === button));
  engine.setViewMode(button.dataset.view);
}));

$('#capture-start').addEventListener('click', () => capture(0, 'start'));
$('#capture-mid').addEventListener('click', () => capture(0.5, 'mid'));
$('#capture-end').addEventListener('click', () => capture(1, 'end'));
$('#ref-start').addEventListener('click', () => capture(0, 'start'));
$('#ref-mid').addEventListener('click', () => capture(0.5, 'mid'));
$('#ref-end').addEventListener('click', () => capture(1, 'end'));
$('#ref-manifest').addEventListener('click', () => {
  const manifest = buildReferenceManifest(sceneDoc);
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'previz-reference-pack-manifest.json');
  showToast('Reference manifest exported');
});

els.showJson.addEventListener('click', () => {
  els.jsonOutput.textContent = JSON.stringify(sceneDoc, null, 2);
  els.dialog.showModal();
});
els.closeJson.addEventListener('click', () => els.dialog.close());
els.dialog.addEventListener('click', (event) => {
  if (event.target === els.dialog) els.dialog.close();
});

els.exportJson.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(sceneDoc, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'previz-scene-v1.0.0.json');
  showToast('Scene JSON exported');
});

engine.onProgress = updateProgressUI;
loadScene(sceneDoc, 'Demo scene ready');
