import { SCENE_VERSION, clamp } from './scene-schema.js';

const has = (text, terms) => terms.some((term) => text.includes(term));
const COUNT_WORDS = [
  ['네 사람', 4], ['네 명', 4], ['4명', 4],
  ['세 사람', 3], ['세 명', 3], ['3명', 3],
  ['두 사람', 2], ['두 명', 2], ['2명', 2],
  ['한 사람', 1], ['한 명', 1], ['1명', 1],
];

function environmentOf(text) {
  if (has(text, ['골목', '거리', 'street', 'alley'])) return 'urban_alley';
  if (has(text, ['사무실', 'office'])) return 'office';
  if (has(text, ['스튜디오', 'studio'])) return 'studio';
  return 'warehouse';
}
function actorCountOf(text) { return COUNT_WORDS.find(([word]) => text.includes(word))?.[1] || 2; }
function durationOf(text, fallback = 4) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:초|sec|seconds?|s\b)/i);
  return m ? clamp(Number(m[1]), 1, 30) : fallback;
}
function explicitLens(text) {
  const m = text.match(/(18|20|24|28|32|35|40|50|65|70|85|100|120)\s*mm/i);
  return m ? Number(m[1]) : null;
}
function actorLayout(count) {
  if (count === 1) return [[0, 0, 0]];
  if (count === 2) return [[-2.2, 0, 0], [2.2, 0, 0]];
  if (count === 3) return [[-2.8, 0, 0], [0, 0, -1.2], [2.8, 0, 0]];
  return [[-3, 0, 0], [-1, 0, -1], [1, 0, -1], [3, 0, 0]];
}
function shot(id, title, intent, duration, movement, lens, start, end, target, distance = 0) {
  return { id, title, intent, duration, camera: { movement, lens, distance, start, end, target } };
}

export function directPromptFallback(rawPrompt) {
  const prompt = String(rawPrompt || '').trim();
  const text = prompt.toLowerCase();
  const environment = environmentOf(text);
  const actorCount = actorCountOf(text);
  const time = has(text, ['밤', '야간', 'night']) ? 'night' : 'day';
  const weather = has(text, ['비', 'rain', 'wet']) ? 'rain' : 'clear';
  const lens = explicitLens(text);
  const oneShot = has(text, ['한 샷', '원테이크', 'one take', 'single shot']);
  const tracking = has(text, ['따라', 'tracking', 'follow']);
  const orbit = has(text, ['회전', '돌며', 'orbit']);
  const through = has(text, ['사이로', 'between']);
  const duration = durationOf(text, 4);
  const positions = actorLayout(actorCount);

  let shots;
  if (oneShot || tracking || orbit) {
    if (tracking) shots = [shot('shot_01', '추적 샷', '피사체를 따라 이동하며 공간 관계를 유지', duration, 'tracking', lens || 50, [-4, 1.7, 5], [4, 1.7, 1.8], [0, 1.35, 0], 8)];
    else if (orbit) shots = [shot('shot_01', '오비트 샷', '인물 관계를 원호 이동으로 강조', duration, 'orbit', lens || 35, [-5, 2.0, 4], [5, 2.0, 4], [0, 1.3, 0], 8)];
    else shots = [shot('shot_01', '원테이크', '하나의 연속된 카메라 이동으로 장면을 전달', duration, through ? 'dolly_through' : 'dolly_forward', lens || 35, [0, 1.7, 5], [0, 1.7, through ? -4 : 1.2], [0, 1.3, 0], through ? 9 : 4)];
  } else {
    shots = [
      shot('shot_01', '공간 설정', '공간과 두 인물의 위치 관계를 먼저 제시', 3.5, 'dolly_forward', lens || 24, [0, 2.0, 9], [0, 1.9, 7], [0, 1.2, 0], 2),
      shot('shot_02', '인물 A', '첫 번째 인물의 긴장감을 중간 클로즈업으로 강조', 3.0, 'static', lens || 50, [-4.6, 1.75, 2.8], [-4.6, 1.75, 2.8], [-2.1, 1.45, 0], 0),
      shot('shot_03', '인물 B', '반대편 인물의 반응을 대응 구도로 연결', 3.0, 'static', lens || 50, [4.6, 1.75, 2.8], [4.6, 1.75, 2.8], [2.1, 1.45, 0], 0),
      shot('shot_04', '대치 돌리', '두 인물 사이의 축을 통과하며 긴장감을 마무리', has(text, ['천천히', 'slow']) ? 6 : 5, 'dolly_through', lens || 35, [0, 1.7, 4.5], [0, 1.7, -4.5], [0, 1.3, 0], 9),
    ];
  }

  const props = environment === 'urban_alley' ? [{ id: 'car_01', type: 'car', assetId: 'sedan_blockout', position: [5.2, 0, -3.5], rotationY: -0.25 }] : [];
  return {
    version: SCENE_VERSION,
    sourcePrompt: prompt,
    scene: {
      id: `scene_${environment}_01`,
      continuityKey: `${environment}:${time}:${weather}:v1`,
      environment: { type: environment, time, weather, assetId: environment === 'warehouse' ? 'warehouse_blockout' : `${environment}_procedural` },
    },
    actors: positions.map((position, i) => ({
      id: `actor_${String(i + 1).padStart(2, '0')}`,
      role: `subject_${String.fromCharCode(97 + i)}`,
      assetId: 'actor_neutral',
      position,
      rotationY: i === 0 ? -Math.PI / 2 : i === 1 ? Math.PI / 2 : 0,
      action: 'stand_confrontation',
    })),
    props,
    lights: [
      { id: 'ambient_01', type: 'ambient', intensity: time === 'night' ? 0.7 : 1.2, position: [0, 4, 0] },
      { id: 'key_01', type: 'directional', intensity: time === 'night' ? 3.2 : 2.0, position: [-4, 7, 5] },
      { id: 'rim_01', type: 'point', intensity: time === 'night' ? 18 : 7, position: [3, 4.5, -3] },
    ],
    shots,
  };
}
