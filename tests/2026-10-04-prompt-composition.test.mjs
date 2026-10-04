import test from 'node:test';
import assert from 'node:assert/strict';
import {directPromptFallback as direct} from '../src/director-fallback.js';
import {validateSceneDocument} from '../src/scene-schema.js';
import {evaluateActorAtTime, evaluateCameraAtTime} from '../src/sequence.js';

test('spacing variants produce two facing actors with held knife blockouts',()=>{
 for(const count of ['두사람','두 사람','두 명','2명']){
  const d=direct(`마주한 ${count}의 나이프액션신.`);
  assert.equal(d.actors.length,2);assert.equal(d.props.length,2);
  assert.ok(d.actors.every(a=>a.actions[0].type==='knife_action'));
  assert.ok(d.props.every(p=>p.type==='knife'&&p.hand==='right'&&d.actors.some(a=>a.id===p.actorId)));
  assert.equal(validateSceneDocument(d).ok,true);
  assert.ok(Math.sin(d.actors[0].rotationY)>0);assert.ok(Math.sin(d.actors[1].rotationY)<0);
  assert.ok(d.interpretation.assumptions.length>0);
 }
});
test('explicit static camera has constant position and target throughout fight',()=>{
 const d=direct('두 사람이 마주 보고 격투한다. 역동적인 액션. 카메라는 고정.');
 const first=evaluateCameraAtTime(d,0);assert.equal(d.shots.length,1);
 for(let t=0;t<=d.sequence.duration;t+=.25){const s=evaluateCameraAtTime(d,t);assert.deepEqual(s.position,first.position);assert.deepEqual(s.target,first.target);}
 assert.equal(d.shots[0].camera.movement,'static');
});
test('orbit is explicit and negative camera instruction is honored',()=>{
 assert.equal(direct('두 사람 나이프 액션. 카메라 오비트.').shots[0].camera.movement,'orbit');
 assert.equal(direct('두 사람 격투. 카메라는 회전하지 말고 고정.').shots[0].camera.movement,'static');
 assert.equal(direct('두 사람 격투. 카메라는 고정하지 말고 오비트.').shots[0].camera.movement,'orbit');
});
test('knife actors animate differently over time without changing camera',()=>{
 const d=direct('두 사람이 마주한 나이프 액션');const a=d.actors[0];
 assert.notEqual(evaluateActorAtTime(d,a,.1).fightSwing,evaluateActorAtTime(d,a,.5).fightSwing);
 assert.notEqual(evaluateActorAtTime(d,d.actors[1],.1).fightSwing,evaluateActorAtTime(d,a,.1).fightSwing);
 assert.equal(d.shots[0].camera.movement,'static');
});
test('explicit knife ownership and negation do not add weapons to everyone',()=>{
 const d=direct('두 사람이 마주 보고 첫 번째 사람만 나이프를 들고 액션');
 assert.equal(d.props.length,1);assert.equal(d.props[0].actorId,'actor_01');
 assert.equal(direct('두 사람은 나이프 없이 격투한다').props.length,0);
 assert.equal(direct('두 사람이 싸우지 않고 마주 서 있다').actors[0].actions[0].type,'idle');
});
test('unsupported and ambiguous requests disclose limits instead of silent success',()=>{
 const d=direct('두 사람이 공중제비를 하며 춤춘다');assert.ok(d.interpretation.warnings.length>0);
 assert.ok(direct('다섯 사람이 나이프 액션').interpretation.warnings.length>0);
});
test('prop references and finite offsets are validated; legacy docs remain valid',()=>{
 const d=direct('두 사람 나이프 액션');d.props[0].actorId='missing';assert.equal(validateSceneDocument(d).ok,false);
 const e=direct('두 사람 나이프 액션');e.props[0].position=[NaN,0,0];assert.equal(validateSceneDocument(e).ok,false);
 const legacy=direct('두 사람이 걷는다');legacy.version='1.3.5';delete legacy.interpretation;
 assert.equal(validateSceneDocument(legacy).ok,true);
});
