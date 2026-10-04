import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlockingScene, editActionPath } from '../src/2026-10-04-blocking-plan.js';
import { evaluateActorAtTime,evaluateCameraAtTime } from '../src/sequence.js';
import { validateSceneDocument } from '../src/scene-schema.js';
test('approach scene separates atmosphere and creates editable two actor paths',()=>{
 const d=createBlockingScene({setting:'storefront',duration:8,roles:['남자','여자'],mover:1,target:0,prop:'umbrella',holder:0,atmosphere:'비가 내리는 한밤'});
 assert.equal(d.actors.length,2);assert.equal(d.scene.environment.type,'storefront');assert.equal(d.scene.environment.weather,'clear');assert.equal(d.supplementaryPrompt,'비가 내리는 한밤');assert.equal(d.props[0].actorId,d.actors[0].id);
 const a=evaluateActorAtTime(d,d.actors[1],0),b=evaluateActorAtTime(d,d.actors[1],6),c=evaluateActorAtTime(d,d.actors[1],8);
 assert.ok(a.position[0]>b.position[0]);assert.ok(b.position.every((v,i)=>Math.abs(v-c.position[i])<1e-9));assert.equal(c.action,'stop');assert.ok(validateSceneDocument(d).ok);
 assert.deepEqual(evaluateCameraAtTime(d,0).position,evaluateCameraAtTime(d,8).position);
});
test('actor ownership and movement can be reversed without sentence-specific rules',()=>{
 const d=createBlockingScene({setting:'building',roles:['여자','남자'],mover:0,target:1,holder:1,prop:'umbrella'});
 assert.equal(d.actors[0].actions[1].type,'walk');assert.equal(d.actors[1].actions[0].type,'idle');assert.equal(d.props[0].actorId,'actor_02');
});
test('editing arrival and path retains continuous stop position',()=>{
 const d=createBlockingScene({});const n=editActionPath(d,'actor_02',1,{start:2,end:7,to:[0,0,2]});
 assert.equal(n.actors[1].actions[0].end,2);assert.equal(n.actors[1].actions[2].start,7);assert.deepEqual(n.actors[1].actions[2].from,[0,0,2]);assert.deepEqual(d.actors[1].actions[2].from,[1.2,0,0]);
});
test('invalid actor references, paths and times rejected before rendering',()=>{
 assert.throws(()=>createBlockingScene({mover:8}));assert.throws(()=>createBlockingScene({duration:NaN}));
 const d=createBlockingScene({});assert.throws(()=>editActionPath(d,'actor_02',1,{end:30}));assert.throws(()=>editActionPath(d,'actor_02',1,{to:[NaN,0,0]}));
});


test('all supported counts, sets and camera choices compile valid finite scenes',()=>{
 for(const count of [1,2,3,4])for(const setting of ['storefront','building','studio','road','urban_alley','warehouse','corridor','office'])for(const camera of ['static','dolly_in','dolly_out','orbit']){
  const d=createBlockingScene({roles:Array.from({length:count},(_,i)=>'배우 '+i),setting,camera,mover:count-1,target:0,motion:count===1?'walk':'approach',prop:'none'});
  assert.ok(validateSceneDocument(d).ok);for(const t of [0,4,8])assert.ok(evaluateCameraAtTime(d,t).position.every(Number.isFinite));
 }
});
test('movement ends at stop boundary and a held scene is time deterministic',()=>{
 const d=createBlockingScene({});assert.equal(evaluateActorAtTime(d,'actor_02',6).action,'stop');assert.deepEqual(evaluateActorAtTime(d,'actor_02',7),evaluateActorAtTime(d,'actor_02',7));
});

test('stationary segment cannot create a teleport at the next boundary',()=>{
 const d=createBlockingScene({});assert.throws(()=>editActionPath(d,'actor_02',0,{to:[9,0,9]}),/같아야/);
 const n=editActionPath(d,'actor_02',0,{from:[9,0,9],to:[9,0,9]});
 const a=evaluateActorAtTime(n,'actor_02',.99999),b=evaluateActorAtTime(n,'actor_02',1);
 assert.ok(a.position.every((v,i)=>Math.abs(v-b.position[i])<.0001));
});
test('approach orientation does not jump at arrival',()=>{
 const d=createBlockingScene({});const a=evaluateActorAtTime(d,'actor_02',5.99999),b=evaluateActorAtTime(d,'actor_02',6);
 assert.ok(Math.abs(a.rotationY-b.rotationY)<.0001);
});
