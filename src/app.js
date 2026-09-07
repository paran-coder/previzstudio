import { directPromptFallback } from './director-fallback.js';
import { cloneSceneDocument, validateSceneDocument, SUPPORTED_FPS } from './scene-schema.js';
import { activeShotAtTime, buildTimelineRows, cameraEditSnapshot, ensureManualCamera, resetManualCamera, translateActorPath, rotateActorPath } from './sequence.js';
import { CanvasSceneEngine } from './renderer-canvas.js';
import { exportSequenceVideo } from './video-exporter.js';
import { APP_VERSION, BUILD_ID, BUILD_INFO } from './build-info.js';

const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const els={
  app:$('#app'),viewport:$('#viewport'),prompt:$('#prompt'),generate:$('#generate'),play:$('#play'),reset:$('#reset'),timeline:$('#timeline'),timelineTime:$('#timeline-time'),progressReadout:$('#progress-readout'),
  sceneTree:$('#scene-tree'),continuity:$('#continuity-label'),environment:$('#environment-label'),camera:$('#camera-label'),renderer:$('#renderer-status'),tracks:$('#timeline-tracks'),
  shotIndex:$('#shot-index-label'),intentTitle:$('#intent-title'),intentCopy:$('#intent-copy'),shotIntent:$('#shot-intent'),lens:$('#lens'),movement:$('#movement-label'),renderDuration:$('#render-duration'),
  renderVideo:$('#render-video'),renderBar:$('#render-progress-bar'),renderText:$('#render-progress-text'),showJson:$('#show-json'),exportJson:$('#export-json'),dialog:$('#json-dialog'),closeJson:$('#close-json'),json:$('#json-output'),toast:$('#toast'),safeFrame:$('#safe-frame'),
  viewportShotId:$('#viewport-shot-id'),viewportShotTitle:$('#viewport-shot-title'),viewStatus:$('#view-status'),shotOverlay:$('#shot-overlay'),overlayShot:$('#overlay-shot'),overlayTitle:$('#overlay-title'),overlayMeta:$('#overlay-meta'),build:$('#build-status'),
  editTarget:$('#edit-target'),manualState:$('#manual-state'),cameraTransform:$('#camera-transform-controls'),actorTransform:$('#actor-transform-controls'),
  camX:$('#cam-x'),camY:$('#cam-y'),camZ:$('#cam-z'),camHeight:$('#cam-height'),camDistance:$('#cam-distance'),targetMode:$('#target-mode'),targetActor:$('#target-actor'),targetActorRow:$('#target-actor-row'),
  targetX:$('#target-x'),targetY:$('#target-y'),targetZ:$('#target-z'),targetOffsetX:$('#target-offset-x'),targetOffsetY:$('#target-offset-y'),targetOffsetZ:$('#target-offset-z'),resetCameraAuto:$('#reset-camera-auto'),
  actorX:$('#actor-x'),actorY:$('#actor-y'),actorZ:$('#actor-z'),actorRotation:$('#actor-rotation'),
  fpsSelect:$('#fps-select'),timelineSummary:$('#timeline-summary'),timelineFrameCount:$('#timeline-frame-count'),renderFrameCount:$('#render-frame-count'),renderResolution:$('#render-resolution'),
  inspectorKind:$('#inspector-kind'),selectedObjectIcon:$('#selected-object-icon'),selectedObjectTitle:$('#selected-object-title'),selectedObjectSubtitle:$('#selected-object-subtitle'),currentShotSection:$('#current-shot-section'),transformSectionTitle:$('#transform-section-title'),
  hudObject:$('#hud-object'),hudMode:$('#hud-mode'),undo:$('#undo-edit'),redo:$('#redo-edit'),promptDock:$('#prompt-dock'),promptToggle:$('#prompt-toggle'),
  cameraSafetyCard:$('#camera-safety-card'),cameraSafetyLabel:$('#camera-safety-label'),cameraSafetyCode:$('#camera-safety-code'),cameraSafetyMessage:$('#camera-safety-message'),cameraSafetyDetail:$('#camera-safety-detail'),recoverCamera:$('#recover-camera')
};

const movementLabels={static:'고정',dolly_in:'돌리 인',dolly_out:'돌리 아웃',track_follow:'팔로우 트래킹',track_between:'사이 트래킹',orbit:'오비트',handheld_follow:'핸드헬드 팔로우'};
const movementShort={static:'STATIC',dolly_in:'DOLLY IN',dolly_out:'DOLLY OUT',track_follow:'TRACK FOLLOW',track_between:'TRACK BETWEEN',orbit:'ORBIT',handheld_follow:'HANDHELD FOLLOW'};
const archetypeLabels={free:'FREE CAMERA',rear_three_quarter:'REAR 3/4 WIDE',side_track:'SIDE TRACK',rear_follow:'REAR FOLLOW',between_push:'BETWEEN PUSH'};
const actionLabels={idle:'대기',walk:'걷기',run:'달리기',chase:'추격',fight:'격투',turn:'회전',stop:'멈춤'};
const envLabels={road:'도로',urban_alley:'도시 골목',warehouse:'창고',corridor:'복도',office:'사무실',studio:'스튜디오'};
let sceneDoc=directPromptFallback(els.prompt.value),engine=null,currentShotIndex=0,toastTimer=0,rendering=false,currentView='edit',editTarget='camera',cameraEditKey='start',transformMode='translate',transformSpace='world',promptCollapsed=false;
let undoStack=[],redoStack=[],gizmoHistoryBefore=null,lastShotForTransformSync=-1;const HISTORY_LIMIT=60;

function formatTime(sec){const s=Math.max(0,sec),m=Math.floor(s/60),whole=Math.floor(s%60),tenth=Math.floor((s-Math.floor(s))*10);return `${String(m).padStart(2,'0')}:${String(whole).padStart(2,'0')}.${tenth}`;}
function showToast(msg,ms=2200){els.toast.textContent=msg;els.toast.classList.add('보임');clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.classList.remove('보임'),ms);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);}

function sceneSnapshot(){return cloneSceneDocument(sceneDoc);}
function sameScene(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function syncHistoryUI(){if(els.undo)els.undo.disabled=undoStack.length===0;if(els.redo)els.redo.disabled=redoStack.length===0;}
function recordHistory(before,label='편집'){const after=sceneSnapshot();if(!before||sameScene(before,after))return false;undoStack.push({before,after,label});if(undoStack.length>HISTORY_LIMIT)undoStack.shift();redoStack=[];syncHistoryUI();return true;}
function clearHistory(){undoStack=[];redoStack=[];gizmoHistoryBefore=null;syncHistoryUI();}
function restoreHistory(doc,label){sceneDoc=cloneSceneDocument(doc);engine.document=sceneDoc;afterDocumentEdit('',false);showToast(label,1200);}
function undoEdit(){const item=undoStack.pop();if(!item)return;redoStack.push(item);restoreHistory(item.before,`실행 취소 · ${item.label}`);syncHistoryUI();}
function redoEdit(){const item=redoStack.pop();if(!item)return;undoStack.push(item);restoreHistory(item.after,`다시 실행 · ${item.label}`);syncHistoryUI();}
function mutateWithHistory(label,mutator,message=label){const before=sceneSnapshot();mutator();const safety=afterDocumentEdit('',false);const changed=recordHistory(before,label);if(safety?.recovered)showToast(safety.message,2600);else if(message&&changed)showToast(message,1400);return {safety,changed};}
function setPromptCollapsed(collapsed){promptCollapsed=Boolean(collapsed);els.app.classList.toggle('프롬프트접힘',promptCollapsed);els.promptDock?.classList.toggle('접힘',promptCollapsed);if(els.promptToggle){els.promptToggle.textContent=promptCollapsed?'⌃':'⌄';els.promptToggle.title=promptCollapsed?'프롬프트 펼치기':'프롬프트 접기';els.promptToggle.setAttribute('aria-expanded',String(!promptCollapsed));}}
function syncCameraSafetyUI(status=engine?.getCameraSafety?.()){
  if(!status||!els.cameraSafetyCard)return;
  const level=status.level==='warning'?'경고':status.level==='recovered'?'복구':status.level==='danger'?'위험':'안전';
  els.cameraSafetyCard.classList.remove('안전','경고','복구','위험');els.cameraSafetyCard.classList.add(level);
  els.cameraSafetyLabel.textContent=level==='안전'?'카메라 안전':level==='경고'?'카메라 경고':level==='복구'?'카메라 복구됨':'카메라 위험';
  els.cameraSafetyCode.textContent=String(status.code||'ok').toUpperCase();els.cameraSafetyMessage.textContent=status.message||'안전 · 프레임 유효';
  const snap=editTarget==='camera'&&sceneDoc?.shots?.length?cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey):null;
  els.cameraSafetyDetail.textContent=snap?`POS ${snap.position.map(v=>Number(v).toFixed(1)).join(' / ')} · DIST ${snap.distance.toFixed(1)}m`:(status.detail||'Camera validation');
  if(els.recoverCamera){const manualEnabled=Boolean(sceneDoc?.shots?.[currentShotIndex]?.camera?.manual?.enabled);els.recoverCamera.disabled=!manualEnabled&&level!=='복구'&&level!=='위험';}
  if(currentView==='preview'&&els.viewStatus){els.viewStatus.classList.toggle('카메라경고',level==='경고'||level==='위험');els.viewStatus.classList.toggle('카메라복구',level==='복구');if(level==='경고'||level==='복구'||level==='위험')els.viewStatus.innerHTML=`<strong>카메라 프리뷰 · ${level}</strong><span>${status.message||''}</span>`;else els.viewStatus.innerHTML='<strong>카메라 프리뷰 · 16:9 OUTPUT</strong><span>최종 영상과 동일한 프레임입니다.</span>'; }
}

function syncSequenceUI(){
  const seq=sceneDoc.sequence,fps=seq.fps,totalFrames=Math.round(seq.duration*fps);
  if(els.fpsSelect)els.fpsSelect.value=String(fps);
  if(els.timelineSummary)els.timelineSummary.textContent=`${Number(seq.duration.toFixed(1))}초 · ${fps} FPS`;
  if(els.timelineFrameCount)els.timelineFrameCount.textContent=`${totalFrames} frames`;
  if(els.renderDuration)els.renderDuration.textContent=`${seq.duration.toFixed(1)}초`;
  if(els.renderFrameCount)els.renderFrameCount.textContent=String(totalFrames);
  if(els.renderResolution)els.renderResolution.textContent=`${seq.width} × ${seq.height}`;
  if(els.timeline){els.timeline.max=String(seq.duration);els.timeline.step=String(1/fps);}
}
function setProjectFps(value){
  const fps=Number(value);
  if(!SUPPORTED_FPS.includes(fps)){showToast('지원 FPS는 24 / 25 / 30 / 60입니다.');syncSequenceUI();return;}
  if(sceneDoc.sequence.fps===fps){syncSequenceUI();return;}
  const next=cloneSceneDocument(sceneDoc);next.sequence.fps=fps;const check=validateSceneDocument(next);
  if(!check.ok){showToast(check.errors[0]);syncSequenceUI();return;}
  sceneDoc=next;engine.document=sceneDoc;engine.refreshEditing?.();els.json.textContent=JSON.stringify(sceneDoc,null,2);syncSequenceUI();renderTracks();updateTimeUI(Math.min(engine.time,sceneDoc.sequence.duration),false);syncTransformUI();
  showToast(`${fps} FPS · ${Math.round(sceneDoc.sequence.duration*fps)}프레임으로 변경했습니다.`);
}

async function initEngine(){
  const forceCanvas=new URLSearchParams(location.search).get('renderer')==='canvas';
  if(forceCanvas){const e=new CanvasSceneEngine(els.viewport);els.renderer.textContent='Canvas 검증 렌더러';els.renderer.classList.add('대체');return e;}
  try{const {createThreeSceneEngine}=await import('./renderer-three.js');const e=await createThreeSceneEngine(els.viewport);els.renderer.textContent=e.rendererLabel;els.renderer.classList.add('온라인');return e;}
  catch(error){console.info('[Previz] Three.js를 사용할 수 없어 Canvas 렌더러로 전환합니다.',error?.message||error);const e=new CanvasSceneEngine(els.viewport);els.renderer.textContent=e.rendererLabel;els.renderer.classList.add('대체');return e;}
}

function shotIndexAtTime(time){const shot=activeShotAtTime(sceneDoc,time);return Math.max(0,sceneDoc.shots.findIndex(s=>s.id===shot.id));}
function selectEditTarget(target,{jumpShot=null}={}){
  editTarget=target==='camera'||sceneDoc.actors.some(a=>a.id===target)?target:'camera';
  if(editTarget!=='camera'&&transformMode==='target')transformMode='translate';
  if(Number.isInteger(jumpShot))engine.selectShot(jumpShot);
  if(currentView!=='edit')setView('edit');
  if(els.editTarget)els.editTarget.value=editTarget;
  renderSceneTree();syncTransformUI();
}
function renderSceneTree(){
  const env=sceneDoc.scene.environment;
  const actors=sceneDoc.actors.map((a,i)=>`<button class="트리아이템 선택가능 ${editTarget===a.id?'선택됨':''}" data-select-target="${a.id}"><span class="트리아이콘 배우아이콘">${i+1}</span><span><b>${a.id.toUpperCase()}</b><small>${a.actions.map(x=>actionLabels[x.type]||x.type).join(' → ')}</small></span></button>`).join('');
  const shots=sceneDoc.shots.map((s,i)=>`<button class="트리아이템 선택가능 ${editTarget==='camera'&&i===currentShotIndex?'선택됨 카메라선택':''} ${i===currentShotIndex?'현재샷':''}" data-jump-shot="${i}"><span class="트리아이콘 카메라아이콘">⌁</span><span><b>${String(i+1).padStart(2,'0')} · ${s.title}</b><small>${s.camera.lens}mm · ${movementLabels[s.camera.movement]||s.camera.movement}</small></span></button>`).join('');
  els.sceneTree.innerHTML=`<div class="트리그룹"><div class="트리제목">환경</div><div class="트리아이템"><span class="트리아이콘">◇</span><span>${envLabels[env.type]||env.type} · ${env.time==='night'?'밤':'낮'}</span></div></div><div class="트리그룹"><div class="트리제목">배우</div>${actors}</div><div class="트리그룹"><div class="트리제목">카메라 / 샷</div>${shots}</div>`;
  $$('[data-select-target]').forEach(b=>b.addEventListener('click',()=>selectEditTarget(b.dataset.selectTarget)));
  $$('[data-jump-shot]').forEach(b=>b.addEventListener('click',()=>selectEditTarget('camera',{jumpShot:Number(b.dataset.jumpShot)})));
}

function renderTracks(){
  const rows=buildTimelineRows(sceneDoc),d=sceneDoc.sequence.duration;
  const clip=(item,extra='',label=item.label)=>{const left=item.start/d*100,width=(item.end-item.start)/d*100;return `<button class="타임클립 ${extra}" data-jump="${item.start}" style="left:${left}%;width:${width}%"><span>${label}</span></button>`};
  const actorRows=rows.actors.map((row,i)=>`<div class="트랙행"><div class="트랙라벨">배우 ${i+1}</div><div class="트랙레인">${row.clips.map(x=>clip(x,`액션 ${x.type}`,`${actionLabels[x.type]||x.type} · ${x.type.toUpperCase()}`)).join('')}</div></div>`).join('');
  els.tracks.innerHTML=`<div class="트랙행"><div class="트랙라벨">샷</div><div class="트랙레인">${rows.shots.map((x,i)=>clip(x,`샷클립 shot-${i}`)).join('')}</div></div>${actorRows}<div class="트랙행"><div class="트랙라벨">카메라</div><div class="트랙레인">${rows.camera.map(x=>clip(x,'카메라클립',`${movementLabels[x.type]||x.type} · ${movementShort[x.type]||x.type.toUpperCase()}`)).join('')}</div></div>`;
  $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>engine.seek(Number(b.dataset.jump)+.001)));
}

function num(el,fallback=0){const v=Number(el?.value);return Number.isFinite(v)?v:fallback;}
function setNum(el,v,digits=2){if(el)el.value=Number(v||0).toFixed(digits).replace(/\.00$/,'');}
function populateTransformTargets(){
  if(!els.editTarget)return;
  const current=editTarget;
  els.editTarget.innerHTML='<option value="camera">카메라</option>'+sceneDoc.actors.map((a,i)=>`<option value="${a.id}">배우 ${i+1} · ${a.id.toUpperCase()}</option>`).join('');
  els.targetActor.innerHTML=sceneDoc.actors.map((a,i)=>`<option value="${a.id}">배우 ${i+1}</option>`).join('');
  editTarget=current==='camera'||sceneDoc.actors.some(a=>a.id===current)?current:'camera';els.editTarget.value=editTarget;
}
function syncTransformUI(){
  if(!engine||!sceneDoc?.shots?.length||!els.editTarget)return;
  const isCamera=editTarget==='camera';
  if(!isCamera&&transformMode==='target')transformMode='translate';
  els.cameraTransform.hidden=!isCamera;els.actorTransform.hidden=isCamera;if(els.currentShotSection)els.currentShotSection.hidden=!isCamera;
  $$('.기즈모버튼').forEach(b=>{b.classList.toggle('활성',b.dataset.transformMode===transformMode);b.disabled=!isCamera&&b.dataset.transformMode==='target';});
  const effectiveSpace=transformMode==='target'?'world':transformSpace;
  $$('[data-transform-space]').forEach(b=>{b.classList.toggle('활성',b.dataset.transformSpace===effectiveSpace);b.disabled=transformMode==='target'&&b.dataset.transformSpace==='local';});
  $$('[data-camera-key]').forEach(b=>b.classList.toggle('활성',b.dataset.cameraKey===cameraEditKey));
  engine.setTransformSpace?.(effectiveSpace);
  const modeLabel=transformMode==='translate'?'이동':transformMode==='rotate'?'회전':'타겟';
  if(isCamera){
    const shot=sceneDoc.shots[currentShotIndex],snap=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey);if(!snap)return;
    const manual=shot.camera.manual;
    els.manualState.textContent=manual?.enabled?'사용자 수정':'자동 구도';els.manualState.classList.toggle('수동',Boolean(manual?.enabled));
    if(els.inspectorKind)els.inspectorKind.textContent='CAMERA';
    if(els.selectedObjectIcon){els.selectedObjectIcon.textContent='CAM';els.selectedObjectIcon.classList.add('카메라');els.selectedObjectIcon.classList.remove('배우');}
    if(els.selectedObjectTitle)els.selectedObjectTitle.textContent=`Camera · SHOT ${String(currentShotIndex+1).padStart(2,'0')}`;
    if(els.selectedObjectSubtitle)els.selectedObjectSubtitle.textContent=`${shot.title} · ${shot.camera.lens}mm · ${movementLabels[shot.camera.movement]||shot.camera.movement}`;
    if(els.transformSectionTitle)els.transformSectionTitle.textContent='Camera Transform';
    if(els.hudObject)els.hudObject.textContent=`CAMERA · SHOT ${String(currentShotIndex+1).padStart(2,'0')}`;
    [els.camX,els.camY,els.camZ].forEach((el,i)=>setNum(el,snap.position[i]));setNum(els.camHeight,snap.position[1]);setNum(els.camDistance,snap.distance);
    els.targetMode.value=snap.targetMode||'free';els.targetActor.value=snap.targetActorId||sceneDoc.actors[0]?.id||'';els.targetActorRow.hidden=els.targetMode.value!=='actor';
    [els.targetX,els.targetY,els.targetZ].forEach((el,i)=>setNum(el,snap.target[i]));[els.targetOffsetX,els.targetOffsetY,els.targetOffsetZ].forEach((el,i)=>setNum(el,snap.targetOffset[i]));
    const free=els.targetMode.value==='free';[els.targetX,els.targetY,els.targetZ].forEach(el=>el.disabled=!free);
    engine.setEditSelection?.('camera','camera');engine.setCameraEditKey?.(cameraEditKey);engine.setTransformMode?.(transformMode);
  } else {
    const actor=sceneDoc.actors.find(a=>a.id===editTarget)||sceneDoc.actors[0];if(!actor)return;
    const actorIndex=Math.max(0,sceneDoc.actors.indexOf(actor));
    els.manualState.textContent='배우 편집';els.manualState.classList.remove('수동');
    if(els.inspectorKind)els.inspectorKind.textContent='ACTOR';
    if(els.selectedObjectIcon){els.selectedObjectIcon.textContent=`A${actorIndex+1}`;els.selectedObjectIcon.classList.remove('카메라');els.selectedObjectIcon.classList.add('배우');}
    if(els.selectedObjectTitle)els.selectedObjectTitle.textContent=`Actor ${String(actorIndex+1).padStart(2,'0')} · ${actor.id.toUpperCase()}`;
    if(els.selectedObjectSubtitle)els.selectedObjectSubtitle.textContent=(actor.actions||[]).map(a=>`${actionLabels[a.type]||a.type} · ${a.type.toUpperCase()}`).join(' → ');
    if(els.transformSectionTitle)els.transformSectionTitle.textContent='Actor Transform';
    if(els.hudObject)els.hudObject.textContent=`ACTOR ${String(actorIndex+1).padStart(2,'0')} · ${actor.id.toUpperCase()}`;
    [els.actorX,els.actorY,els.actorZ].forEach((el,i)=>setNum(el,actor.position[i]));setNum(els.actorRotation,(actor.rotationY||0)*180/Math.PI,1);
    engine.setEditSelection?.('actor',actor.id);engine.setTransformMode?.(transformMode);
  }
  if(els.hudMode)els.hudMode.textContent=`${modeLabel} · ${effectiveSpace.toUpperCase()}`;
  syncCameraSafetyUI();syncHistoryUI();
}

function afterDocumentEdit(message='수정했습니다.',showMessage=true){
  engine.document=sceneDoc;const safety=engine.refreshEditing?.();sceneDoc=engine.document;els.json.textContent=JSON.stringify(sceneDoc,null,2);syncSequenceUI();renderSceneTree();renderTracks();syncShotUI(engine.time);syncTransformUI();syncCameraSafetyUI(safety);if(message&&showMessage&&!safety?.recovered)showToast(message,1400);return safety;
}
function editCameraPosition(position){
  mutateWithHistory('카메라 위치',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex),key=cameraEditKey==='end'?'end':'start';m[key]=position.map(Number);},'카메라 위치를 수정했습니다.');
}
function editCameraTargetFree(target){
  mutateWithHistory('카메라 타겟',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex),key=cameraEditKey==='end'?'targetEnd':'targetStart';m.targetMode='free';m[key]=target.map(Number);m.targetOffset=[0,0,0];},'카메라 타겟을 수정했습니다.');
}
function editCameraDistance(distance){
  const snap=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey),d=Math.max(.5,Math.min(50,distance));if(!snap)return;
  const dx=snap.position[0]-snap.target[0],dy=snap.position[1]-snap.target[1],dz=snap.position[2]-snap.target[2],len=Math.hypot(dx,dy,dz)||1;
  editCameraPosition([snap.target[0]+dx/len*d,snap.target[1]+dy/len*d,snap.target[2]+dz/len*d]);
}
function editActorPosition(){
  const actor=sceneDoc.actors.find(a=>a.id===editTarget);if(!actor)return;const next=[num(els.actorX,actor.position[0]),num(els.actorY,actor.position[1]),num(els.actorZ,actor.position[2])];
  mutateWithHistory('배우 위치',()=>translateActorPath(sceneDoc,actor.id,[next[0]-actor.position[0],next[1]-actor.position[1],next[2]-actor.position[2]]),'배우 위치를 수정했습니다.');
}
function syncFromEngineEdit(event){sceneDoc=engine.document;els.json.textContent=JSON.stringify(sceneDoc,null,2);syncShotUI(engine.time);syncTransformUI();syncCameraSafetyUI(event?.safety||engine.getCameraSafety?.());}
function beginGizmoHistory(){if(!gizmoHistoryBefore)gizmoHistoryBefore=sceneSnapshot();}
function endGizmoHistory(){if(!gizmoHistoryBefore)return;const before=gizmoHistoryBefore;gizmoHistoryBefore=null;const changed=recordHistory(before,editTarget==='camera'?'카메라 Gizmo':'배우 Gizmo');const safety=engine.getCameraSafety?.();if(safety?.recovered)showToast(safety.message,2400);else if(changed)showToast('Transform을 수정했습니다.',1000);}


function syncShotOverlay(shot,time){
  const idx=currentShotIndex+1,elapsed=Math.max(0,time-shot.start),show=currentView==='preview'&&elapsed<1.25;
  els.overlayShot.textContent=`SHOT ${String(idx).padStart(2,'0')}`;
  els.overlayTitle.textContent=shot.title;
  els.overlayMeta.textContent=`${shot.camera.lens}mm · ${archetypeLabels[shot.camera.archetype||'free']}`;
  els.shotOverlay.classList.toggle('보임',show);
}

function syncShotUI(time=engine?.time||0){
  const previousShot=currentShotIndex;currentShotIndex=shotIndexAtTime(time);const shot=sceneDoc.shots[currentShotIndex],env=sceneDoc.scene.environment;
  els.shotIndex.textContent=`샷 ${String(currentShotIndex+1).padStart(2,'0')}`;
  els.viewportShotId.textContent=`SHOT ${String(currentShotIndex+1).padStart(2,'0')}`;
  els.viewportShotTitle.textContent=shot.title;
  els.intentTitle.textContent=shot.title;els.intentCopy.textContent=shot.intent;els.shotIntent.textContent=shot.intent;
  els.lens.value=shot.camera.lens;els.movement.textContent=movementLabels[shot.camera.movement]||shot.camera.movement;
  els.environment.textContent=`${envLabels[env.type]||env.type} · ${env.time==='night'?'밤':'낮'}`;
  els.camera.textContent=`${shot.camera.lens}mm · ${movementLabels[shot.camera.movement]||shot.camera.movement}`;
  $$('.샷클립').forEach((el,i)=>el.classList.toggle('활성',i===currentShotIndex));
  $$('[data-jump-shot]').forEach((el,i)=>{el.classList.toggle('현재샷',i===currentShotIndex);el.classList.toggle('선택됨',editTarget==='camera'&&i===currentShotIndex);el.classList.toggle('카메라선택',editTarget==='camera'&&i===currentShotIndex);});
  syncShotOverlay(shot,time);
  if(previousShot!==currentShotIndex&&lastShotForTransformSync!==currentShotIndex){lastShotForTransformSync=currentShotIndex;engine?.setCameraEditKey?.(cameraEditKey);engine?.setEditSelection?.(editTarget==='camera'?'camera':'actor',editTarget==='camera'?'camera':editTarget);engine?.applyTime?.(time);if(!engine?.playing)syncTransformUI();}
  syncCameraSafetyUI();
}
function updateTimeUI(time=0,playing=false){const d=sceneDoc.sequence.duration;els.timeline.max=String(d);els.timeline.value=String(time);els.timelineTime.textContent=formatTime(time);els.progressReadout.textContent=`${formatTime(time)} / ${formatTime(d)}`;els.play.textContent=playing?'Ⅱ':'▶';syncShotUI(time);if(!playing&&engine)syncTransformUI();}

function setView(view){
  currentView=view==='preview'?'preview':'edit';
  els.app.dataset.view=currentView;
  $$('[data-view]').forEach(b=>b.classList.toggle('활성',b.dataset.view===currentView));
  engine?.setViewMode(currentView);
  els.viewStatus.classList.remove('카메라경고','카메라복구');
  if(currentView==='preview') els.viewStatus.innerHTML='<strong>카메라 프리뷰 · 16:9 OUTPUT</strong><span>최종 영상과 동일한 프레임입니다.</span>';
  else els.viewStatus.innerHTML='<strong>편집 작업 시점</strong><span>최종 출력 화면이 아닙니다.</span>';
  engine?.applyTime?.(engine?.time||0);syncShotUI(engine?.time||0);if(engine)syncTransformUI();syncCameraSafetyUI();
}

async function loadScene(doc){
  const check=validateSceneDocument(doc);if(!check.ok){showToast(check.errors[0]);throw new Error(check.errors.join(' '));}
  sceneDoc=doc;engine.onTime=(time,playing)=>updateTimeUI(time,playing);engine.onDocumentEdit=syncFromEngineEdit;engine.onTransformStart=beginGizmoHistory;engine.onTransformEnd=endGizmoHistory;engine.onCameraSafety=(status)=>syncCameraSafetyUI(status);await engine.loadDocument(sceneDoc);sceneDoc=engine.document;clearHistory();lastShotForTransformSync=-1;
  els.continuity.textContent=sceneDoc.scene.continuityKey;els.json.textContent=JSON.stringify(sceneDoc,null,2);
  syncSequenceUI();populateTransformTargets();renderSceneTree();renderTracks();updateTimeUI(0,false);setView(currentView);syncTransformUI();
}

function selectedShot(){return sceneDoc.shots[currentShotIndex];}
function referenceManifest(){return {format:'previz-reference-pack',version:APP_VERSION,build:BUILD_INFO,sourcePrompt:sceneDoc.sourcePrompt,sequence:sceneDoc.sequence,continuityKey:sceneDoc.scene.continuityKey,environment:sceneDoc.scene.environment,actors:sceneDoc.actors.map(a=>({id:a.id,role:a.role,actions:a.actions})),shots:sceneDoc.shots.map((s,i)=>({id:s.id,title:s.title,start:s.start,end:s.end,lens:s.camera.lens,movement:s.camera.movement,archetype:s.camera.archetype||'free',manualCamera:s.camera.manual||null,referenceFrames:[['start',s.start],['mid',(s.start+s.end)/2],['end',Math.max(s.start,s.end-1/sceneDoc.sequence.fps)]].map(([role,time])=>({role,time,suggestedFilename:`previz-shot${String(i+1).padStart(2,'0')}-${role}.png`}))})),referenceIntent:'카메라 구도, 인물 동선, 움직임과 샷 연속성을 AI 영상 생성에 전달한다.'};}
function exportSceneSlug(){const actions=sceneDoc.actors.flatMap(a=>a.actions||[]).map(a=>a.type);if(actions.includes('fight'))return 'fight';if(actions.includes('chase'))return 'chase';return sceneDoc.scene.environment.type||'scene';}
function exportBaseName(){return `previz-${exportSceneSlug()}-${Math.round(sceneDoc.sequence.duration)}s-v${APP_VERSION}`;}
async function captureRole(role){const shot=selectedShot(),t=role==='start'?shot.start:role==='mid'?(shot.start+shot.end)/2:Math.max(shot.start,shot.end-1/sceneDoc.sequence.fps);const blob=await engine.captureAtTime(t);if(!blob)return showToast('프레임 캡처 실패');downloadBlob(blob,`previz-shot${String(currentShotIndex+1).padStart(2,'0')}-${role}.png`);showToast(`${role} PNG를 저장했습니다.`);}

els.generate.addEventListener('click',async()=>{if(rendering)return;const prompt=els.prompt.value.trim();if(!prompt)return;const projectFps=sceneDoc.sequence.fps;els.generate.disabled=true;els.generate.querySelector('span').textContent='블로킹 중…';try{const next=directPromptFallback(prompt);next.sequence.fps=projectFps;await loadScene(next);showToast('표현 가능한 동작과 카메라를 프리비즈로 만들었습니다.');}finally{els.generate.disabled=false;els.generate.querySelector('span').textContent='장면 만들기';}});
els.prompt.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')els.generate.click();});
els.play.addEventListener('click',()=>{if(engine.time>=sceneDoc.sequence.duration-.001)engine.seek(0);engine.setPlaying(!engine.playing);updateTimeUI(engine.time,engine.playing);});
els.reset.addEventListener('click',()=>engine.reset());
els.timeline.addEventListener('input',()=>engine.seek(Number(els.timeline.value)));
els.fpsSelect?.addEventListener('change',()=>setProjectFps(els.fpsSelect.value));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
els.lens.addEventListener('change',()=>{const v=Math.max(18,Math.min(120,Number(els.lens.value)||35));mutateWithHistory('렌즈',()=>{sceneDoc.shots[currentShotIndex].camera.lens=v;},'렌즈를 수정했습니다.');});
els.editTarget?.addEventListener('change',()=>selectEditTarget(els.editTarget.value));
$$('[data-transform-mode]').forEach(b=>b.addEventListener('click',()=>{transformMode=b.dataset.transformMode;if(editTarget!=='camera'&&transformMode==='target')transformMode='translate';syncTransformUI();}));
$$('[data-transform-space]').forEach(b=>b.addEventListener('click',()=>{transformSpace=b.dataset.transformSpace==='local'?'local':'world';syncTransformUI();}));
$$('[data-camera-key]').forEach(b=>b.addEventListener('click',()=>{cameraEditKey=b.dataset.cameraKey==='end'?'end':'start';engine.setCameraEditKey?.(cameraEditKey);syncTransformUI();}));
[els.camX,els.camY,els.camZ].forEach(el=>el?.addEventListener('change',()=>editCameraPosition([num(els.camX),num(els.camY),num(els.camZ)])));
els.camHeight?.addEventListener('change',()=>{const snap=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey);editCameraPosition([snap.position[0],num(els.camHeight,snap.position[1]),snap.position[2]]);});
els.camDistance?.addEventListener('change',()=>editCameraDistance(num(els.camDistance,6)));
els.targetMode?.addEventListener('change',()=>mutateWithHistory('타겟 방식',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex),previous=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey);m.targetMode=els.targetMode.value;m.targetActorId=els.targetActor.value||sceneDoc.actors[0]?.id||'';if(m.targetMode==='free'){const k=cameraEditKey==='end'?'targetEnd':'targetStart';m[k]=[...previous.target];m.targetOffset=[0,0,0];}},'타겟 방식을 변경했습니다.'));
els.targetActor?.addEventListener('change',()=>mutateWithHistory('타겟 배우',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex);m.targetMode='actor';m.targetActorId=els.targetActor.value;},'타겟 배우를 변경했습니다.'));
[els.targetX,els.targetY,els.targetZ].forEach(el=>el?.addEventListener('change',()=>editCameraTargetFree([num(els.targetX),num(els.targetY),num(els.targetZ)])));
[els.targetOffsetX,els.targetOffsetY,els.targetOffsetZ].forEach(el=>el?.addEventListener('change',()=>mutateWithHistory('타겟 오프셋',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex);m.targetOffset=[num(els.targetOffsetX),num(els.targetOffsetY),num(els.targetOffsetZ)];},'타겟 오프셋을 수정했습니다.')));
els.recoverCamera?.addEventListener('click',()=>{const before=sceneSnapshot();const status=engine.recoverCameraEdit?.(currentShotIndex);sceneDoc=engine.document;afterDocumentEdit('',false);recordHistory(before,'카메라 복구');syncCameraSafetyUI(status);showToast(status?.message||'카메라를 복구했습니다.',2200);});
els.resetCameraAuto?.addEventListener('click',()=>mutateWithHistory('자동 카메라 복귀',()=>resetManualCamera(sceneDoc,currentShotIndex),'자동 카메라 구도로 되돌렸습니다.'));
[els.actorX,els.actorY,els.actorZ].forEach(el=>el?.addEventListener('change',editActorPosition));
els.actorRotation?.addEventListener('change',()=>{const actor=sceneDoc.actors.find(a=>a.id===editTarget);if(!actor)return;mutateWithHistory('배우 회전',()=>rotateActorPath(sceneDoc,actor.id,num(els.actorRotation,0)*Math.PI/180),'배우 회전을 수정했습니다.');});
els.undo?.addEventListener('click',undoEdit);els.redo?.addEventListener('click',redoEdit);
els.promptToggle?.addEventListener('click',()=>setPromptCollapsed(!promptCollapsed));
document.addEventListener('keydown',e=>{
  const editable=/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'');
  if((e.metaKey||e.ctrlKey)&&!e.altKey&&!editable&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redoEdit();else undoEdit();return;}
  if(currentView!=='edit'||e.metaKey||e.ctrlKey||e.altKey||editable)return;
  const key=e.key.toLowerCase();if(key==='w')transformMode='translate';else if(key==='e')transformMode='rotate';else if(key==='t'&&editTarget==='camera')transformMode='target';else return;e.preventDefault();syncTransformUI();
});

$('#ref-start').addEventListener('click',()=>captureRole('start'));$('#ref-mid').addEventListener('click',()=>captureRole('mid'));$('#ref-end').addEventListener('click',()=>captureRole('end'));$('#ref-manifest').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(referenceManifest(),null,2)],{type:'application/json'}),`previz-reference-pack-v${APP_VERSION}.json`));
els.showJson.addEventListener('click',()=>{els.json.textContent=JSON.stringify(sceneDoc,null,2);els.dialog.showModal();});els.closeJson.addEventListener('click',()=>els.dialog.close());els.dialog.addEventListener('click',e=>{if(e.target===els.dialog)els.dialog.close();});els.exportJson.addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(sceneDoc,null,2)],{type:'application/json'}),`previz-scene-v${APP_VERSION}.json`));

els.renderVideo.addEventListener('click',async()=>{
  if(rendering)return;rendering=true;els.renderVideo.disabled=true;engine.setPlaying(false);setView('preview');els.renderBar.style.width='0%';els.renderText.textContent='렌더 준비 중…';
  try{const result=await exportSequenceVideo(engine,sceneDoc,(p,label)=>{els.renderBar.style.width=`${Math.round(p*100)}%`;els.renderText.textContent=`${label} · ${Math.round(p*100)}%`;});const ext=result.format==='mp4'?'mp4':'webm';downloadBlob(result.blob,`${exportBaseName()}.${ext}`);els.renderText.textContent=`완료 · ${ext.toUpperCase()} · ${(result.blob.size/1024/1024).toFixed(1)} MB`;showToast(result.format==='mp4'?'프리비즈 MP4를 저장했습니다.':'MP4 인코더가 없어 WebM으로 저장했습니다.',3500);}
  catch(error){console.error(error);els.renderText.textContent=`렌더 실패 · ${error.message||error}`;showToast('영상 렌더에 실패했습니다.',3000);}
  finally{rendering=false;els.renderVideo.disabled=false;}
});

engine=await initEngine();setPromptCollapsed(false);syncHistoryUI();await loadScene(sceneDoc);window.__PREVIZ__={getScene:()=>sceneDoc,getEngine:()=>engine,loadPrompt:async p=>{els.prompt.value=p;const next=directPromptFallback(p);next.sequence.fps=sceneDoc.sequence.fps;await loadScene(next);},setView,setFps:setProjectFps,exportSequenceVideo:()=>exportSequenceVideo(engine,sceneDoc)};els.build.textContent=`APP v${APP_VERSION} · ${BUILD_ID}`;
window.__PREVIZ__={...window.__PREVIZ__,build:BUILD_INFO};
showToast(`Previz Studio v${APP_VERSION} · Canonical Frame 준비 완료`);
