import { SCENE_VERSION, clamp } from './scene-schema.js';

const COUNT_WORDS = [
  ['세 사람', 3], ['세 명', 3], ['3명', 3], ['three people', 3],
  ['두 사람', 2], ['두 명', 2], ['2명', 2], ['two people', 2],
  ['한 사람', 1], ['한 명', 1], ['1명', 1], ['one person', 1],
];

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function detectEnvironment(text) {
  if (includesAny(text, ['창고', 'warehouse', '공장', 'factory'])) return 'warehouse';
  if (includesAny(text, ['골목', 'alley', 'street', '거리'])) return 'urban_alley';
  if (includesAny(text, ['사무실', 'office'])) return 'office';
  if (includesAny(text, ['스튜디오', 'studio'])) return 'studio';
  return 'warehouse';
}

function detectActorCount(text) {
  const pair = COUNT_WORDS.find(([word]) => text.includes(word));
  return pair ? pair[1] : 2;
}

function detectLens(text) {
  const match = text.match(/(18|20|24|28|32|35|40|50|65|70|85|100|120)\s*mm/i);
  if (match) return Number(match[1]);
  if (includesAny(text, ['클로즈업', 'close-up', 'close up'])) return 85;
  if (includesAny(text, ['와이드', 'wide'])) return 24;
  return 35;
}

function detectDuration(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:초|sec|seconds?|s\b)/i);
  if (match) return clamp(Number(match[1]), 1, 30);
  if (includesAny(text, ['천천히', 'slow', 'slowly'])) return 6;
  if (includesAny(text, ['빠르게', 'fast', 'quickly'])) return 3;
  return 5;
}

function detectCameraMove(text) {
  if (includesAny(text, ['사이로', 'between'])) return 'dolly_through';
  if (includesAny(text, ['따라', 'follow', 'tracking'])) return 'tracking';
  if (includesAny(text, ['회전', 'orbit', '돌며'])) return 'orbit';
  if (includesAny(text, ['고정', 'static', 'fixed'])) return 'static';
  return 'dolly_forward';
}

function actorLayout(count) {
  if (count === 1) return [[0, 0, 0]];
  if (count === 2) return [[-2.25, 0, 0], [2.25, 0, 0]];
  return [[-2.5, 0, 0], [0, 0, -1], [2.5, 0, 0]];
}

function cameraPath(move, distance) {
  switch (move) {
    case 'static': return { start: [0, 1.65, 6], end: [0, 1.65, 6] };
    case 'tracking': return { start: [-3.5, 1.7, 5.5], end: [3.5, 1.7, 1.5] };
    case 'orbit': return { start: [-5, 2.1, 4], end: [5, 2.1, 4] };
    case 'dolly_through': return { start: [0, 1.7, distance / 2], end: [0, 1.7, -distance / 2] };
    default: return { start: [0, 1.7, distance / 2 + 1], end: [0, 1.7, 1] };
  }
}

export function directPrompt(rawPrompt) {
  const prompt = String(rawPrompt || '').trim();
  const normalized = prompt.toLowerCase();
  const environment = detectEnvironment(normalized);
  const actorCount = detectActorCount(normalized);
  const lens = detectLens(normalized);
  const duration = detectDuration(normalized);
  const movement = detectCameraMove(normalized);
  const distance = movement === 'dolly_through' ? 8 : 6;
  const path = cameraPath(movement, distance);
  const time = includesAny(normalized, ['밤', 'night', '야간']) ? 'night' : 'day';
  const weather = includesAny(normalized, ['비', 'rain', 'wet']) ? 'rain' : 'clear';
  const positions = actorLayout(actorCount);

  return {
    version: SCENE_VERSION,
    sourcePrompt: prompt,
    scene: {
      id: 'scene_warehouse_confrontation',
      environment: { type: environment, time, weather },
      continuityKey: `${environment}:${time}:v1`,
    },
    actors: positions.map((position, index) => ({
      id: `actor_${String(index + 1).padStart(2, '0')}`,
      role: index === 0 ? 'subject_a' : index === 1 ? 'subject_b' : 'subject_c',
      position,
      rotationY: index === 0 ? -Math.PI / 2 : index === 1 ? Math.PI / 2 : 0,
      action: 'stand_confrontation',
    })),
    lights: [
      { id: 'key_01', type: 'rect', intensity: time === 'night' ? 5 : 2.5, position: [-3, 5.5, 2] },
      { id: 'fill_01', type: 'rect', intensity: time === 'night' ? 2 : 1.5, position: [4, 4, -2] },
      { id: 'practical_01', type: 'point', intensity: time === 'night' ? 16 : 5, position: [0, 5.8, -3] },
    ],
    shots: [{
      id: 'shot_01',
      title: movement === 'dolly_through' ? 'Confrontation Dolly' : 'Generated Shot',
      duration,
      camera: {
        movement,
        lens,
        distance,
        start: path.start,
        end: path.end,
        target: [0, 1.25, 0],
      },
    }],
  };
}
