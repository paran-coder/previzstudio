import { clamp } from './scene-schema.js';

export const lerp = (a,b,t) => a + (b-a)*t;
export const lerpVec3 = (a,b,t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
export const addVec3 = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const scaleVec3 = (a,s) => [a[0]*s,a[1]*s,a[2]*s];

export function activeShotAtTime(doc, time) {
  const t = clamp(time, 0, doc.sequence.duration);
  return doc.shots.find((shot, i) => t >= shot.start && (t < shot.end || (i === doc.shots.length-1 && t <= shot.end))) || doc.shots[doc.shots.length-1];
}

export function shotProgress(shot, time) {
  return clamp((time - shot.start) / Math.max(0.0001, shot.end - shot.start), 0, 1);
}

function defaultActionState(actor) {
  return { position:[...actor.position], rotationY:actor.rotationY, action:'idle', stride:0, bob:0, lean:0 };
}

export function evaluateActorAtTime(doc, actorOrId, time) {
  const actor = typeof actorOrId === 'string' ? doc.actors.find(a => a.id === actorOrId) : actorOrId;
  if (!actor) return null;
  const t = clamp(time, 0, doc.sequence.duration);
  let state = defaultActionState(actor);
  const actions = [...(actor.actions || [])].sort((a,b)=>a.start-b.start);
  for (const action of actions) {
    const from = action.from || state.position;
    const to = action.to || from;
    const r0 = Number.isFinite(action.rotationFrom) ? action.rotationFrom : state.rotationY;
    const r1 = Number.isFinite(action.rotationTo) ? action.rotationTo : r0;
    if (t < action.start) break;
    if (t > action.end) {
      state = { ...state, position:[...to], rotationY:r1, action:action.type, stride:0, bob:0, lean:0 };
      continue;
    }
    const p = clamp((t-action.start)/Math.max(.001,action.end-action.start),0,1);
    const moving = ['walk','run','chase'].includes(action.type);
    const speed = action.type === 'walk' ? 1.55 : moving ? 3.4 : 0;
    const cycle = (t-action.start) * speed * Math.PI * 2;
    state = {
      position: ['walk','run','chase'].includes(action.type) ? lerpVec3(from,to,p) : [...from],
      rotationY: lerp(r0,r1,p),
      action: action.type,
      stride: moving ? Math.sin(cycle) * (action.type === 'walk' ? .48 : .82) : 0,
      bob: moving ? Math.abs(Math.sin(cycle)) * (action.type === 'walk' ? .035 : .075) : Math.sin(t*2.2)*.008,
      lean: action.type === 'run' || action.type === 'chase' ? .13 : 0,
      progress:p,
    };
    return state;
  }
  return state;
}

function midpoint(a,b) { return [(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]; }

export function evaluateCameraAtTime(doc, time) {
  const shot = activeShotAtTime(doc,time);
  const p = shotProgress(shot,time);
  const c = shot.camera;
  const primary = c.targetActorId ? evaluateActorAtTime(doc,c.targetActorId,time) : null;
  const secondary = c.secondaryActorId ? evaluateActorAtTime(doc,c.secondaryActorId,time) : null;
  let position = lerpVec3(c.start,c.end,p);
  let target = [...c.target];

  if (c.movement === 'track_follow' || c.movement === 'handheld_follow') {
    const subject = primary?.position || c.target;
    position = addVec3(subject, lerpVec3(c.start,c.end,p));
    const forwardLead = c.movement === 'handheld_follow' ? 2.0 : 1.2;
    target = addVec3(subject,[0,1.45,forwardLead]);
  } else if (c.movement === 'track_between') {
    const a = primary?.position || c.target;
    const b = secondary?.position || a;
    const mid = midpoint(a,b);
    const push = p*p;
    position = addVec3(mid, lerpVec3(c.start,c.end,p));
    target = lerpVec3(addVec3(mid,[0,1.35,2]), addVec3(a,[0,1.4,2.5]), push);
  } else if (c.movement === 'orbit') {
    const center = primary?.position || c.target;
    const angle = lerp(-.8,.8,p);
    const radius = Math.max(2.5,c.distance || 6);
    position = addVec3(center,[Math.sin(angle)*radius,2.1,Math.cos(angle)*radius]);
    target = addVec3(center,[0,1.35,0]);
  } else if (primary) {
    target = addVec3(primary.position,[0,1.35,0]);
  }

  if (c.movement === 'handheld_follow' || c.handheldAmount > 0) {
    const a = c.handheldAmount || .25;
    position = addVec3(position,[
      Math.sin(time*13.3)*.055*a,
      Math.sin(time*17.1+1.2)*.04*a,
      Math.sin(time*11.7+.3)*.035*a,
    ]);
    target = addVec3(target,[Math.sin(time*9.2)*.025*a,Math.sin(time*12.5)*.018*a,0]);
  }

  return { shot, progress:p, position, target, lens:c.lens };
}

export function buildTimelineRows(doc) {
  return {
    shots: doc.shots.map(s => ({ id:s.id,label:s.title,start:s.start,end:s.end,type:'shot' })),
    actors: doc.actors.map(actor => ({
      id:actor.id, label:actor.id.toUpperCase(),
      clips:actor.actions.map(a=>({id:`${actor.id}-${a.type}-${a.start}`,label:a.type.toUpperCase(),start:a.start,end:a.end,type:a.type}))
    })),
    camera: doc.shots.map(s=>({id:`cam-${s.id}`,label:s.camera.movement.toUpperCase(),start:s.start,end:s.end,type:s.camera.movement}))
  };
}
