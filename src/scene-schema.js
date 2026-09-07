export const SCENE_VERSION = '1.1.0';

export const CAMERA_MOVES = ['static', 'dolly_forward', 'dolly_through', 'tracking', 'orbit'];
export const ENVIRONMENTS = ['warehouse', 'urban_alley', 'office', 'studio'];
export const ACTOR_ACTIONS = ['stand_confrontation', 'stand', 'walk', 'run', 'look', 'exit_vehicle'];

export const SCENE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'sourcePrompt', 'scene', 'actors', 'props', 'lights', 'shots'],
  properties: {
    version: { type: 'string', enum: [SCENE_VERSION] },
    sourcePrompt: { type: 'string' },
    scene: {
      type: 'object', additionalProperties: false,
      required: ['id', 'continuityKey', 'environment'],
      properties: {
        id: { type: 'string' },
        continuityKey: { type: 'string' },
        environment: {
          type: 'object', additionalProperties: false,
          required: ['type', 'time', 'weather', 'assetId'],
          properties: {
            type: { type: 'string', enum: ENVIRONMENTS },
            time: { type: 'string', enum: ['day', 'night'] },
            weather: { type: 'string', enum: ['clear', 'rain'] },
            assetId: { type: 'string' },
          },
        },
      },
    },
    actors: {
      type: 'array', minItems: 1, maxItems: 4,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'role', 'assetId', 'position', 'rotationY', 'action'],
        properties: {
          id: { type: 'string' }, role: { type: 'string' },
          assetId: { type: 'string' },
          position: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
          rotationY: { type: 'number' },
          action: { type: 'string', enum: ACTOR_ACTIONS },
        },
      },
    },
    props: {
      type: 'array', maxItems: 12,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'type', 'assetId', 'position', 'rotationY'],
        properties: {
          id: { type: 'string' }, type: { type: 'string' }, assetId: { type: 'string' },
          position: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
          rotationY: { type: 'number' },
        },
      },
    },
    lights: {
      type: 'array', minItems: 1, maxItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'type', 'intensity', 'position'],
        properties: {
          id: { type: 'string' }, type: { type: 'string', enum: ['directional', 'point', 'ambient'] },
          intensity: { type: 'number' },
          position: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
        },
      },
    },
    shots: {
      type: 'array', minItems: 1, maxItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'title', 'intent', 'duration', 'camera'],
        properties: {
          id: { type: 'string' }, title: { type: 'string' }, intent: { type: 'string' },
          duration: { type: 'number', minimum: 1, maximum: 30 },
          camera: {
            type: 'object', additionalProperties: false,
            required: ['movement', 'lens', 'distance', 'start', 'end', 'target'],
            properties: {
              movement: { type: 'string', enum: CAMERA_MOVES },
              lens: { type: 'number', minimum: 18, maximum: 120 },
              distance: { type: 'number', minimum: 0, maximum: 30 },
              start: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
              end: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
              target: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
            },
          },
        },
      },
    },
  },
};

export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function cloneSceneDocument(doc) { return JSON.parse(JSON.stringify(doc)); }

export function validateSceneDocument(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') errors.push('Scene Document가 객체가 아닙니다.');
  if (doc?.version !== SCENE_VERSION) errors.push(`Scene version은 ${SCENE_VERSION}이어야 합니다.`);
  if (!doc?.scene?.environment?.type || !ENVIRONMENTS.includes(doc.scene.environment.type)) errors.push('지원하지 않는 환경입니다.');
  if (!Array.isArray(doc?.actors) || doc.actors.length < 1) errors.push('배우가 최소 1명 필요합니다.');
  if (!Array.isArray(doc?.shots) || doc.shots.length < 1) errors.push('샷이 최소 1개 필요합니다.');
  for (const [i, shot] of (doc?.shots || []).entries()) {
    if (!CAMERA_MOVES.includes(shot?.camera?.movement)) errors.push(`샷 ${i + 1}: 지원하지 않는 카메라 이동입니다.`);
    if (!(shot?.camera?.lens >= 18 && shot.camera.lens <= 120)) errors.push(`샷 ${i + 1}: 렌즈 범위가 잘못되었습니다.`);
    if (!(shot?.duration >= 1 && shot.duration <= 30)) errors.push(`샷 ${i + 1}: 길이 범위가 잘못되었습니다.`);
  }
  return { ok: errors.length === 0, errors };
}
