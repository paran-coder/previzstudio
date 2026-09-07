export const SCENE_VERSION = '1.0.0';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

export function validateSceneDocument(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') errors.push('Scene document must be an object.');
  if (doc?.version !== SCENE_VERSION) errors.push(`version must be ${SCENE_VERSION}.`);
  if (!doc?.scene?.environment?.type) errors.push('scene.environment.type is required.');
  if (!Array.isArray(doc?.actors) || doc.actors.length < 1) errors.push('At least one actor is required.');
  if (!Array.isArray(doc?.shots) || doc.shots.length < 1) errors.push('At least one shot is required.');

  const shot = doc?.shots?.[0];
  if (shot) {
    if (!(shot.duration > 0)) errors.push('shot.duration must be greater than 0.');
    if (!(shot.camera?.lens >= 10 && shot.camera?.lens <= 200)) errors.push('shot.camera.lens must be 10–200mm.');
    if (!Array.isArray(shot.camera?.start) || shot.camera.start.length !== 3) errors.push('shot.camera.start must be vec3.');
    if (!Array.isArray(shot.camera?.end) || shot.camera.end.length !== 3) errors.push('shot.camera.end must be vec3.');
  }

  return { ok: errors.length === 0, errors };
}

export function cloneSceneDocument(doc) {
  return structuredClone(doc);
}
