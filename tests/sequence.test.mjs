import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { activeShotAtTime, evaluateActorAtTime, evaluateCameraAtTime, deriveEditOverview, fitAspectRect, outputAspect, ensureManualCamera, cameraEditSnapshot, resetManualCamera, translateActorPath, rotateActorPath, validateCameraStateBasic, cameraTargetDistance } from '../src/sequence.js';

const doc=directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다. 카메라는 역동적으로 두 사람 사이를 오가며 추격한다.');

test('도망자와 추격자는 시간에 따라 실제 월드 위치가 이동한다',()=>{
  const a0=evaluateActorAtTime(doc,'actor_01',0);
  const a10=evaluateActorAtTime(doc,'actor_01',10);
  const b0=evaluateActorAtTime(doc,'actor_02',0);
  const b10=evaluateActorAtTime(doc,'actor_02',10);
  assert.ok(a10.position[2]>a0.position[2]+10);
  assert.ok(b10.position[2]>b0.position[2]+10);
  assert.equal(a10.action,'run');
  assert.equal(b10.action,'chase');
});

test('20초 마스터 타임라인에서 활성 샷이 올바르게 바뀐다',()=>{
  assert.equal(activeShotAtTime(doc,1).id,'shot_01');
  assert.equal(activeShotAtTime(doc,5).id,'shot_02');
  assert.equal(activeShotAtTime(doc,11).id,'shot_03');
  assert.equal(activeShotAtTime(doc,18).id,'shot_04');
});

test('카메라 위치는 샷 종류와 시간에 따라 실제로 이동한다',()=>{
  const c4=evaluateCameraAtTime(doc,4.1);
  const c8=evaluateCameraAtTime(doc,8.8);
  const c15=evaluateCameraAtTime(doc,15);
  const c19=evaluateCameraAtTime(doc,19);
  assert.notDeepEqual(c4.position,c8.position);
  assert.equal(c4.shot.camera.movement,'track_follow');
  assert.equal(c15.shot.camera.movement,'track_between');
  assert.notDeepEqual(c15.position,c19.position);
});

test('첫 샷 카메라는 배우의 진행 방향 뒤쪽 3/4 위치에서 낮게 시작한다',()=>{
  const actor=evaluateActorAtTime(doc,'actor_01',0);
  const cam=evaluateCameraAtTime(doc,0);
  assert.equal(cam.archetype,'rear_three_quarter');
  assert.ok(cam.position[1] < 2.0);
  assert.ok(cam.position[2] < actor.position[2] - 5);
  assert.ok(cam.position[0] > actor.position[0] + 3);
  assert.ok(cam.target[2] > actor.position[2]);
});

test('샷 경계 양쪽에서 카메라 evaluator가 정확한 활성 샷을 선택한다',()=>{
  const before=evaluateCameraAtTime(doc,3.999);
  const after=evaluateCameraAtTime(doc,4.001);
  assert.equal(before.shot.id,'shot_01');
  assert.equal(after.shot.id,'shot_02');
  assert.notDeepEqual(before.position,after.position);
});

test('600개 30fps 프레임 전체에서 카메라 transform이 유한하고 샷 컷이 유지된다',()=>{
  assert.equal(doc.sequence.fps,30);
  const counts=new Map();
  const totalFrames=Math.round(doc.sequence.duration*doc.sequence.fps);
  assert.equal(totalFrames,600);
  for(let i=0;i<totalFrames;i++){
    const t=i/doc.sequence.fps,cam=evaluateCameraAtTime(doc,t);
    for(const v of [...cam.position,...cam.target,cam.lens]) assert.ok(Number.isFinite(v));
    counts.set(cam.shot.id,(counts.get(cam.shot.id)||0)+1);
  }
  assert.deepEqual([...counts.entries()],[['shot_01',120],['shot_02',150],['shot_03',150],['shot_04',180]]);
});

test('지원 FPS 24/25/30/60은 20초 길이를 유지하고 frame count만 변경한다',()=>{
  const expected=new Map([[24,480],[25,500],[30,600],[60,1200]]);
  const shotTimes=doc.shots.map(s=>[s.start,s.end]);
  for(const [fps,frames] of expected){
    const local=structuredClone(doc);local.sequence.fps=fps;
    assert.equal(Math.round(local.sequence.duration*local.sequence.fps),frames);
    assert.deepEqual(local.shots.map(s=>[s.start,s.end]),shotTimes);
    const last=evaluateCameraAtTime(local,(frames-1)/fps);
    for(const v of [...last.position,...last.target,last.lens]) assert.ok(Number.isFinite(v));
  }
});


test('출력 스테이지는 UI 패널 비율과 무관하게 16:9로 맞춘다',()=>{
  assert.equal(outputAspect(doc),1920/1080);
  const wide=fitAspectRect(1200,500,outputAspect(doc));
  assert.ok(Math.abs(wide.width/wide.height-16/9)<1e-9);
  assert.ok(wide.left>100);
  assert.equal(wide.top,0);
  const tall=fitAspectRect(700,700,outputAspect(doc));
  assert.ok(Math.abs(tall.width/tall.height-16/9)<1e-9);
  assert.equal(tall.left,0);
  assert.ok(tall.top>100);
});

test('첫 편집 카메라는 도로 위 3/4 오버뷰로 블로킹을 프레이밍한다',()=>{
  const view=deriveEditOverview(doc);
  const starts=doc.actors.map(a=>a.position);
  const minStartZ=Math.min(...starts.map(p=>p[2]));
  assert.ok(view.position[1]>7.5);
  assert.ok(view.position[2]<view.target[2]-10);
  assert.ok(Math.abs(view.position[0])<6.5);
  assert.ok(view.target[2]>minStartZ);
  assert.ok(view.sampleTime>=2);
});

test('1150×480 production viewport에서도 canonical preview stage는 정확히 16:9 중앙 배치다',()=>{
  const rect=fitAspectRect(1150,480,outputAspect(doc));
  assert.ok(Math.abs(rect.width-853.3333333333333)<1e-6);
  assert.equal(rect.height,480);
  assert.ok(Math.abs(rect.left-148.33333333333337)<1e-6);
  assert.equal(rect.top,0);
});


test('fight action은 격투 상태와 타격 위상을 생성한다',()=>{
  const fight=directPromptFallback('두 사람이 격렬하게 싸운다. 카메라는 다양한 각도로 따라간다.');
  const a=evaluateActorAtTime(fight,'actor_01',3.2);
  const b=evaluateActorAtTime(fight,'actor_02',3.2);
  assert.equal(a.action,'fight');
  assert.equal(b.action,'fight');
  assert.ok(Number.isFinite(a.fightSwing));
  assert.ok(Number.isFinite(b.fightSwing));
  assert.notEqual(a.fightSwing,b.fightSwing);
});

test('manual camera override는 자동 카메라보다 우선하고 reset 가능하다',()=>{
  const local=directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다.');
  const before=cameraEditSnapshot(local,0,'start');
  const manual=ensureManualCamera(local,0);
  manual.start=[10,3,-20];manual.targetMode='free';manual.targetStart=[0,1,0];
  const cam=evaluateCameraAtTime(local,local.shots[0].start+1/local.sequence.fps);
  assert.ok(Math.abs(cam.position[0]-10)<.1);
  assert.ok(Math.abs(cam.position[1]-3)<.1);
  resetManualCamera(local,0);
  const after=cameraEditSnapshot(local,0,'start');
  assert.equal(Boolean(local.shots[0].camera.manual),false);
  assert.ok(Math.abs(after.position[0]-before.position[0])<.01);
});

test('actor transform helper는 전체 action path와 회전을 보존하며 이동한다',()=>{
  const local=directPromptFallback('두 사람이 격렬하게 싸운다.');
  const actor=local.actors[0],oldFrom=[...actor.actions[0].from],oldTo=[...actor.actions[0].to];
  translateActorPath(local,actor.id,[2,0,-1]);
  assert.deepEqual(actor.position,[oldFrom[0]+2,oldFrom[1],oldFrom[2]-1]);
  assert.deepEqual(actor.actions[0].from,[oldFrom[0]+2,oldFrom[1],oldFrom[2]-1]);
  assert.deepEqual(actor.actions[0].to,[oldTo[0]+2,oldTo[1],oldTo[2]-1]);
  rotateActorPath(local,actor.id,Math.PI);
  assert.ok(Math.abs(actor.rotationY-Math.PI)<1e-9);
});


test('Camera Safety 기본 검증은 NaN, 지면 침투, 극단 좌표, 너무 가까운 Target을 차단한다',()=>{
  assert.equal(validateCameraStateBasic({position:[0,1.6,-5],target:[0,1.3,0],lens:35}).ok,true);
  assert.equal(validateCameraStateBasic({position:[NaN,1.6,-5],target:[0,1.3,0],lens:35}).code,'non_finite');
  assert.equal(validateCameraStateBasic({position:[0,.05,-5],target:[0,1.3,0],lens:35}).code,'below_ground');
  assert.equal(validateCameraStateBasic({position:[999,1.6,-5],target:[0,1.3,0],lens:35}).code,'out_of_bounds');
  assert.equal(validateCameraStateBasic({position:[0,1.6,-5],target:[0,1.6,-4.7],lens:35}).code,'target_too_close');
  assert.ok(cameraTargetDistance([0,1.6,-5],[0,1.6,0])>=5);
});

test('기본 30fps 600프레임 Camera state는 Camera Safety 기본 규칙을 모두 통과한다',()=>{
  const total=Math.round(doc.sequence.duration*doc.sequence.fps);
  assert.equal(total,600);
  for(let frame=0;frame<total;frame++){
    const state=evaluateCameraAtTime(doc,frame/doc.sequence.fps);
    const result=validateCameraStateBasic(state);
    assert.equal(result.ok,true,`frame ${frame}: ${result.message}`);
  }
});

test('manual Camera endpoint가 지면 아래로 편집되면 safety validator가 즉시 실패한다',()=>{
  const local=directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다.');
  const manual=ensureManualCamera(local,0);
  manual.start=[manual.start[0],0.05,manual.start[2]];
  const state=evaluateCameraAtTime(local,local.shots[0].start+1/local.sequence.fps,{ignoreHandheld:true});
  const result=validateCameraStateBasic(state);
  assert.equal(result.ok,false);
  assert.equal(result.code,'below_ground');
});
