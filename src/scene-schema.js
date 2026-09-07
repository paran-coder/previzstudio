export const SCENE_VERSION = '1.3.1';
export const SUPPORTED_FPS = [24, 25, 30, 60];

export const CAMERA_MOVES = [
  'static', 'dolly_in', 'dolly_out', 'track_follow', 'track_between', 'orbit', 'handheld_follow'
];
export const CAMERA_ARCHETYPES = ['free','rear_three_quarter','side_track','rear_follow','between_push'];
export const ENVIRONMENTS = ['road', 'urban_alley', 'warehouse', 'corridor', 'office', 'studio'];
export const ACTOR_ACTIONS = ['idle', 'walk', 'run', 'chase', 'fight', 'turn', 'stop'];

const vec3Schema = { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } };

export const SCENE_JSON_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['version', 'sourcePrompt', 'sequence', 'scene', 'actors', 'props', 'lights', 'shots'],
  properties: {
    version: { type: 'string', enum: [SCENE_VERSION] },
    sourcePrompt: { type: 'string' },
    sequence: {
      type: 'object', additionalProperties: false,
      required: ['duration', 'fps', 'width', 'height'],
      properties: {
        duration: { type: 'number', minimum: 1, maximum: 120 },
        fps: { type: 'number', enum: SUPPORTED_FPS },
        width: { type: 'integer', minimum: 320, maximum: 3840 },
        height: { type: 'integer', minimum: 180, maximum: 2160 },
      },
    },
    scene: {
      type: 'object', additionalProperties: false,
      required: ['id', 'continuityKey', 'environment'],
      properties: {
        id: { type: 'string' }, continuityKey: { type: 'string' },
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
        required: ['id', 'role', 'assetId', 'position', 'rotationY', 'actions'],
        properties: {
          id: { type: 'string' }, role: { type: 'string' }, assetId: { type: 'string' },
          position: vec3Schema, rotationY: { type: 'number' },
          actions: {
            type: 'array', minItems: 1, maxItems: 16,
            items: {
              type: 'object', additionalProperties: false,
              required: ['type', 'start', 'end'],
              properties: {
                type: { type: 'string', enum: ACTOR_ACTIONS },
                start: { type: 'number', minimum: 0 }, end: { type: 'number', minimum: 0 },
                from: vec3Schema, to: vec3Schema,
                rotationFrom: { type: 'number' }, rotationTo: { type: 'number' },
                targetId: { type: 'string' }, phaseOffset: { type: 'number' },
              },
            },
          },
        },
      },
    },
    props: {
      type: 'array', maxItems: 16,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'type', 'assetId', 'position', 'rotationY'],
        properties: { id:{type:'string'}, type:{type:'string'}, assetId:{type:'string'}, position:vec3Schema, rotationY:{type:'number'} },
      },
    },
    lights: {
      type: 'array', minItems: 1, maxItems: 12,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'type', 'intensity', 'position'],
        properties: {
          id:{type:'string'}, type:{type:'string',enum:['directional','point','ambient']},
          intensity:{type:'number'}, position:vec3Schema,
        },
      },
    },
    shots: {
      type: 'array', minItems: 1, maxItems: 12,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'title', 'intent', 'start', 'end', 'camera'],
        properties: {
          id:{type:'string'}, title:{type:'string'}, intent:{type:'string'},
          start:{type:'number',minimum:0}, end:{type:'number',minimum:0},
          camera: {
            type:'object', additionalProperties:false,
            required:['movement','lens','distance','start','end','target','handheldAmount'],
            properties:{
              movement:{type:'string',enum:CAMERA_MOVES}, archetype:{type:'string',enum:CAMERA_ARCHETYPES}, lens:{type:'number',minimum:18,maximum:120},
              distance:{type:'number',minimum:0,maximum:50}, start:vec3Schema, end:vec3Schema, target:vec3Schema,
              targetActorId:{type:'string'}, secondaryActorId:{type:'string'}, handheldAmount:{type:'number',minimum:0,maximum:1},
              manual:{
                type:'object', additionalProperties:false,
                required:['enabled','start','end','targetMode','targetStart','targetEnd','targetOffset'],
                properties:{
                  enabled:{type:'boolean'}, start:vec3Schema, end:vec3Schema,
                  targetMode:{type:'string',enum:['free','actor','midpoint']},
                  targetActorId:{type:'string'}, targetStart:vec3Schema, targetEnd:vec3Schema, targetOffset:vec3Schema
                }
              },
            }
          }
        }
      }
    }
  }
};

export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function cloneSceneDocument(doc) { return JSON.parse(JSON.stringify(doc)); }

export function validateSceneDocument(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') errors.push('Scene Document가 객체가 아닙니다.');
  if (doc?.version !== SCENE_VERSION) errors.push(`Scene version은 ${SCENE_VERSION}이어야 합니다.`);
  if (!ENVIRONMENTS.includes(doc?.scene?.environment?.type)) errors.push('지원하지 않는 환경입니다.');
  if (!Array.isArray(doc?.actors) || doc.actors.length < 1) errors.push('배우가 최소 1명 필요합니다.');
  if (!Array.isArray(doc?.shots) || doc.shots.length < 1) errors.push('샷이 최소 1개 필요합니다.');
  const duration = Number(doc?.sequence?.duration || 0);
  if (!(duration >= 1 && duration <= 120)) errors.push('시퀀스 길이가 올바르지 않습니다.');
  if (!SUPPORTED_FPS.includes(doc?.sequence?.fps)) errors.push('지원 FPS는 24 / 25 / 30 / 60 중 하나여야 합니다.');
  for (const [i, actor] of (doc?.actors || []).entries()) {
    for (const [j, action] of (actor.actions || []).entries()) {
      if (!ACTOR_ACTIONS.includes(action?.type)) errors.push(`배우 ${i+1} 액션 ${j+1}: 지원하지 않는 동작입니다.`);
      if (!(action?.start >= 0 && action?.end > action.start && action.end <= duration)) errors.push(`배우 ${i+1} 액션 ${j+1}: 시간 범위가 잘못되었습니다.`);
    }
  }
  let previousEnd = 0;
  for (const [i, shot] of (doc?.shots || []).entries()) {
    if (!CAMERA_MOVES.includes(shot?.camera?.movement)) errors.push(`샷 ${i+1}: 지원하지 않는 카메라 이동입니다.`);
    if (!(shot?.camera?.lens >= 18 && shot.camera.lens <= 120)) errors.push(`샷 ${i+1}: 렌즈 범위가 잘못되었습니다.`);
    if (!(shot?.start >= 0 && shot?.end > shot.start && shot.end <= duration + 1e-6)) errors.push(`샷 ${i+1}: 시간 범위가 잘못되었습니다.`);
    if (i > 0 && Math.abs(shot.start - previousEnd) > 0.001) errors.push(`샷 ${i+1}: 이전 샷과 시간 연결이 끊겼습니다.`);
    previousEnd = shot.end;
  }
  if ((doc?.shots || []).length && Math.abs(previousEnd - duration) > 0.001) errors.push('마지막 샷이 시퀀스 끝까지 이어지지 않습니다.');
  return { ok: errors.length === 0, errors };
}
