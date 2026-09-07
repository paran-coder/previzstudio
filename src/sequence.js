import { clamp } from './scene-schema.js';

export const lerp = (a,b,t) => a + (b-a)*t;
export const lerpVec3 = (a,b,t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
export const addVec3 = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const scaleVec3 = (a,s) => [a[0]*s,a[1]*s,a[2]*s];
const subVec3 = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const lengthXZ = (v) => Math.hypot(v[0],v[2]);
const normalizeXZ = (v,fallback=[0,0,1]) => {
  const n=lengthXZ(v);
  return n>.0001 ? [v[0]/n,0,v[2]/n] : [...fallback];
};
const rightFromForward = (forward) => [forward[2],0,-forward[0]];
const midpoint = (a,b) => [(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];

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
    const fighting = action.type === 'fight';
    const speed = action.type === 'walk' ? 1.55 : moving ? 3.4 : fighting ? 1.35 : 0;
    const cycle = (t-action.start) * speed * Math.PI * 2 + (action.phaseOffset||0);
    const fightWave=fighting?Math.sin(cycle):0;
    state = {
      position: moving || fighting ? lerpVec3(from,to,p) : [...from],
      rotationY: lerp(r0,r1,p),
      action: action.type,
      stride: moving ? Math.sin(cycle) * (action.type === 'walk' ? .48 : .82) : fighting ? Math.sin(cycle*.5)*.16 : 0,
      bob: moving ? Math.abs(Math.sin(cycle)) * (action.type === 'walk' ? .035 : .075) : fighting ? Math.abs(Math.sin(cycle))*0.025 : Math.sin(t*2.2)*.008,
      lean: action.type === 'run' || action.type === 'chase' ? .13 : fighting ? .08 + Math.max(0,fightWave)*.08 : 0,
      fightSwing:fightWave,
      fightGuard:fighting ? Math.cos(cycle*.5) : 0,
      progress:p,
    };
    return state;
  }
  return state;
}

export function actorTravelBasis(doc, actorOrId, time) {
  const actor = typeof actorOrId === 'string' ? doc.actors.find(a=>a.id===actorOrId) : actorOrId;
  if (!actor) return { forward:[0,0,1], right:[1,0,0] };
  const dt=.2;
  const a=evaluateActorAtTime(doc,actor,Math.max(0,time-dt));
  const b=evaluateActorAtTime(doc,actor,Math.min(doc.sequence.duration,time+dt));
  const fallback=[Math.sin(actor.rotationY||0),0,Math.cos(actor.rotationY||0)];
  const forward=normalizeXZ(subVec3(b.position,a.position),fallback);
  return {forward,right:rightFromForward(forward)};
}

function localOffset(base, basis, local) {
  return [
    base[0] + basis.right[0]*local[0] + basis.forward[0]*local[2],
    base[1] + local[1],
    base[2] + basis.right[2]*local[0] + basis.forward[2]*local[2],
  ];
}

export function evaluateCameraAtTime(doc, time, options={}) {
  const shot = activeShotAtTime(doc,time);
  const p = shotProgress(shot,time);
  const c = shot.camera;
  const primary = c.targetActorId ? evaluateActorAtTime(doc,c.targetActorId,time) : null;
  const secondary = c.secondaryActorId ? evaluateActorAtTime(doc,c.secondaryActorId,time) : null;
  const basis = c.targetActorId ? actorTravelBasis(doc,c.targetActorId,time) : {forward:[0,0,1],right:[1,0,0]};
  const archetype = c.archetype || 'free';
  let position;
  let target;

  if (c.manual?.enabled) {
    position = lerpVec3(c.manual.start,c.manual.end,p);
    const mode=c.manual.targetMode||'free';
    const offset=c.manual.targetOffset||[0,0,0];
    if(mode==='actor'){
      const subject=evaluateActorAtTime(doc,c.manual.targetActorId||c.targetActorId,time);
      target=addVec3(subject?.position||lerpVec3(c.manual.targetStart,c.manual.targetEnd,p),offset);
    } else if(mode==='midpoint'){
      const a=evaluateActorAtTime(doc,c.targetActorId||doc.actors[0]?.id,time);
      const b=evaluateActorAtTime(doc,c.secondaryActorId||doc.actors[1]?.id,time);
      target=addVec3(midpoint(a?.position||[0,0,0],b?.position||a?.position||[0,0,0]),offset);
    } else target=addVec3(lerpVec3(c.manual.targetStart,c.manual.targetEnd,p),offset);
  } else if (archetype === 'rear_three_quarter' && primary) {
    position = localOffset(primary.position,basis,lerpVec3(c.start,c.end,p));
    target = localOffset(primary.position,basis,[0,1.38,3.4]);
  } else if (archetype === 'side_track' && primary) {
    position = localOffset(primary.position,basis,lerpVec3(c.start,c.end,p));
    target = localOffset(primary.position,basis,[0,1.4,1.8]);
  } else if (archetype === 'rear_follow' && primary) {
    position = localOffset(primary.position,basis,lerpVec3(c.start,c.end,p));
    target = localOffset(primary.position,basis,[0,1.42,2.5]);
  } else if (archetype === 'between_push' && primary) {
    const b = secondary?.position || primary.position;
    const mid = midpoint(primary.position,b);
    position = localOffset(mid,basis,lerpVec3(c.start,c.end,p));
    const targetMid=localOffset(mid,basis,[0,1.38,2.0]);
    const targetLead=localOffset(primary.position,basis,[0,1.42,3.0]);
    target=lerpVec3(targetMid,targetLead,p*p);
  } else {
    position = lerpVec3(c.start,c.end,p);
    target = [...c.target];

    if (c.movement === 'track_follow' || c.movement === 'handheld_follow') {
      const subject = primary?.position || c.target;
      const focus = secondary?.position ? midpoint(subject,secondary.position) : subject;
      position = addVec3(subject, lerpVec3(c.start,c.end,p));
      const forwardLead = c.movement === 'handheld_follow' ? .6 : 1.2;
      target = addVec3(focus,[0,1.45,forwardLead]);
    } else if (c.movement === 'track_between') {
      const a = primary?.position || c.target;
      const b = secondary?.position || a;
      const mid = midpoint(a,b);
      const push = p*p;
      position = addVec3(mid, lerpVec3(c.start,c.end,p));
      target = lerpVec3(addVec3(mid,[0,1.35,2]), addVec3(a,[0,1.4,2.5]), push);
    } else if (c.movement === 'orbit') {
      const center = primary?.position ? (secondary?.position ? midpoint(primary.position,secondary.position) : primary.position) : c.target;
      const angle = lerp(-.8,.8,p);
      const radius = Math.max(2.5,c.distance || 6);
      position = addVec3(center,[Math.sin(angle)*radius,2.1,Math.cos(angle)*radius]);
      target = addVec3(center,[0,1.35,0]);
    } else if (primary) {
      target = addVec3(primary.position,[0,1.35,0]);
    }
  }

  if (!options.ignoreHandheld && (c.movement === 'handheld_follow' || c.handheldAmount > 0)) {
    const a = c.handheldAmount || .25;
    position = addVec3(position,[
      Math.sin(time*13.3)*.055*a,
      Math.sin(time*17.1+1.2)*.04*a,
      Math.sin(time*11.7+.3)*.035*a,
    ]);
    target = addVec3(target,[Math.sin(time*9.2)*.025*a,Math.sin(time*12.5)*.018*a,0]);
  }

  return { shot, progress:p, position, target, lens:c.lens, archetype };
}

export function outputAspect(doc) {
  const w = Number(doc?.sequence?.width) || 16;
  const h = Number(doc?.sequence?.height) || 9;
  return w / Math.max(1, h);
}

export function fitAspectRect(width, height, aspect) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const a = Math.max(.1, Number(aspect) || (16/9));
  if (w / h > a) {
    const stageWidth = h * a;
    return { width:stageWidth, height:h, left:(w-stageWidth)/2, top:0 };
  }
  const stageHeight = w / a;
  return { width:w, height:stageHeight, left:0, top:(h-stageHeight)/2 };
}

export function deriveEditOverview(doc) {
  const actors = doc?.actors || [];
  if (!actors.length) return { position:[7.5,8.5,-15], target:[0,1,0], forward:[0,0,1] };
  const duration = Number(doc?.sequence?.duration) || 20;
  const sampleTime = Math.min(7, Math.max(2, duration * .32));
  const firstShot = doc?.shots?.[0];
  const forward = actorTravelBasis(doc, actors[0], 0).forward;
  const right = rightFromForward(forward);
  const actorPoints = [];
  for (const actor of actors) {
    const start = evaluateActorAtTime(doc, actor, 0)?.position || actor.position;
    const future = evaluateActorAtTime(doc, actor, sampleTime)?.position || start;
    actorPoints.push(start, future);
  }
  const contextPoints=[...actorPoints];
  if (firstShot) {
    const a = evaluateCameraAtTime(doc, Math.min(firstShot.end, firstShot.start + .001));
    const b = evaluateCameraAtTime(doc, Math.max(firstShot.start, firstShot.end - .001));
    if (a?.position) contextPoints.push(a.position);
    if (b?.position) contextPoints.push(b.position);
  }
  const actorXs=actorPoints.map(p=>p[0]), actorZs=actorPoints.map(p=>p[2]);
  const xs=contextPoints.map(p=>p[0]), zs=contextPoints.map(p=>p[2]);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minZ=Math.min(...zs), maxZ=Math.max(...zs);
  const actorMinX=Math.min(...actorXs), actorMaxX=Math.max(...actorXs), actorMinZ=Math.min(...actorZs), actorMaxZ=Math.max(...actorZs);
  const spanX=Math.max(2,maxX-minX), spanZ=Math.max(5,maxZ-minZ), span=Math.max(spanX,spanZ);
  const center=[(actorMinX+actorMaxX)/2, .9, (actorMinZ+actorMaxZ)/2];
  const lead=0;
  const target=[center[0]+forward[0]*lead, center[1], center[2]+forward[2]*lead];
  const isRoad=doc?.scene?.environment?.type==='road';
  const side=isRoad ? Math.min(4.9, Math.max(4.4, spanX*.40)) : Math.min(8,Math.max(4.8,span*.34));
  const back=isRoad ? Math.min(20,Math.max(16,span*.86)) : Math.min(18,Math.max(12.5,span*.78));
  const height=isRoad ? Math.min(12,Math.max(9.5,span*.50)) : Math.min(11.5,Math.max(8.2,span*.48));
  const position=[
    target[0] + right[0]*side - forward[0]*back,
    target[1] + height,
    target[2] + right[2]*side - forward[2]*back,
  ];
  return { position, target, forward, bounds:{minX,maxX,minZ,maxZ}, sampleTime };
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

export function cameraKeyTime(doc, shotIndex, key='start') {
  const shot=doc?.shots?.[shotIndex];
  if(!shot)return 0;
  const eps=1/Math.max(1,doc.sequence?.fps||24);
  return key==='end' ? Math.max(shot.start,shot.end-eps) : Math.min(shot.end,shot.start+eps);
}

export function cameraEditSnapshot(doc, shotIndex, key='start') {
  const shot=doc?.shots?.[shotIndex];
  if(!shot)return null;
  const c=shot.camera, manual=c.manual;
  const time=cameraKeyTime(doc,shotIndex,key);
  const evaluated=evaluateCameraAtTime(doc,time);
  const position=manual?.enabled ? [...(key==='end'?manual.end:manual.start)] : [...evaluated.position];
  const target=[...evaluated.target];
  const distance=Math.hypot(target[0]-position[0],target[1]-position[1],target[2]-position[2]);
  return {shotIndex,key,time,position,target,distance,targetMode:manual?.enabled?(manual.targetMode||'free'):'free',targetActorId:manual?.targetActorId||c.targetActorId||doc.actors?.[0]?.id||'',targetOffset:[...(manual?.targetOffset||[0,0,0])],manualEnabled:Boolean(manual?.enabled)};
}

export function ensureManualCamera(doc, shotIndex) {
  const shot=doc?.shots?.[shotIndex];
  if(!shot)return null;
  if(shot.camera.manual?.enabled)return shot.camera.manual;
  const fps=Math.max(1,doc.sequence?.fps||24),eps=1/fps;
  const startState=evaluateCameraAtTime(doc,Math.min(shot.end,shot.start+eps),{ignoreHandheld:true});
  const endState=evaluateCameraAtTime(doc,Math.max(shot.start,shot.end-eps),{ignoreHandheld:true});
  shot.camera.manual={
    enabled:true,
    start:[...startState.position],end:[...endState.position],
    targetMode:'free',targetActorId:shot.camera.targetActorId||doc.actors?.[0]?.id||'',
    targetStart:[...startState.target],targetEnd:[...endState.target],targetOffset:[0,0,0]
  };
  return shot.camera.manual;
}

export function resetManualCamera(doc, shotIndex) {
  const shot=doc?.shots?.[shotIndex];
  if(shot?.camera?.manual)delete shot.camera.manual;
}

export function translateActorPath(doc, actorId, delta) {
  const actor=doc?.actors?.find(a=>a.id===actorId);if(!actor)return;
  const add=p=>p?[p[0]+delta[0],p[1]+delta[1],p[2]+delta[2]]:p;
  actor.position=add(actor.position);
  for(const a of actor.actions||[]){if(a.from)a.from=add(a.from);if(a.to)a.to=add(a.to);}
}

export function rotateActorPath(doc, actorId, rotationY) {
  const actor=doc?.actors?.find(a=>a.id===actorId);if(!actor)return;
  const oldRotation=actor.rotationY||0,delta=rotationY-oldRotation;actor.rotationY=rotationY;
  for(const a of actor.actions||[]){
    const oldFrom=Number.isFinite(a.rotationFrom)?a.rotationFrom:oldRotation;
    const oldTo=Number.isFinite(a.rotationTo)?a.rotationTo:oldFrom;
    a.rotationFrom=oldFrom+delta;a.rotationTo=oldTo+delta;
  }
}
