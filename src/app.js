import { translateShotCamera, translateShotTarget } from './2026-10-04-camera-edit.js';
import { createBlockingScene, editActionPath } from './2026-10-04-blocking-plan.js';
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
  fpsSelect:$('#fps-select'),timelineSummary:$('#timeline-summary'),timelineFrameCount:$('#timeline-frame-count'),renderFrameCount:$('#render-frame-count'),renderResolution:$('#render-resolution')
};

const movementLabels={static:'고정',dolly_in:'돌리 인',dolly_out:'돌리 아웃',track_follow:'팔로우 트래킹',track_between:'사이 트래킹',orbit:'오비트',handheld_follow:'핸드헬드 팔로우'};
const movementShort={static:'STATIC',dolly_in:'DOLLY IN',dolly_out:'DOLLY OUT',track_follow:'TRACK FOLLOW',track_between:'TRACK BETWEEN',orbit:'ORBIT',handheld_follow:'HANDHELD FOLLOW'};
const archetypeLabels={free:'FREE CAMERA',rear_three_quarter:'REAR 3/4 WIDE',side_track:'SIDE TRACK',rear_follow:'REAR FOLLOW',between_push:'BETWEEN PUSH'};
const actionLabels={idle:'대기',walk:'걷기',run:'달리기',chase:'추격',fight:'격투',knife_action:'나이프 블로킹',turn:'회전',stop:'멈춤'};
const envLabels={storefront:'가게 앞',building:'건물 앞',road:'도로',urban_alley:'도시 골목',warehouse:'창고',corridor:'복도',office:'사무실',studio:'스튜디오'};
let captureBusy=false,interactionLock=null;
function lockInteractions(){if(interactionLock)return;const controls=$$('button,input,select,textarea');const regions=[$('.작업공간'),$('.프롬프트독'),$('.mobile-view-toggle')].filter(Boolean);interactionLock={controls:controls.map(el=>[el,el.disabled]),regions:regions.map(el=>[el,el.inert])};controls.forEach(el=>el.disabled=true);regions.forEach(el=>el.inert=true);els.app.setAttribute('aria-busy','true');}
function unlockInteractions(){if(!interactionLock)return;for(const [el,value] of interactionLock.controls)el.disabled=value;for(const [el,value] of interactionLock.regions)el.inert=value;interactionLock=null;els.app.removeAttribute('aria-busy');}
function syncExportStatus(text){$('#export-status').textContent=text;}
let sceneDoc=createBlockingScene({}),engine=null,currentShotIndex=0,toastTimer=0,rendering=false,currentView='edit',editTarget='camera',cameraEditKey='start',cameraEditScope='wholeShot',transformMode='translate';

function editorSnapshot(){return JSON.stringify({document:sceneDoc,description:$('#scene-description').value,atmosphere:$('#blocking-atmosphere').value});}
const history=[];let lastSnapshot=editorSnapshot(),manualEdits=false,engineEditTimer=0,engineEditGrouped=false;
function rememberEdit(){const now=editorSnapshot();if(now!==lastSnapshot){history.push(lastSnapshot);if(history.length>24)history.shift();lastSnapshot=now;manualEdits=true;$('#undo-edit').disabled=false;}}
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function formatTime(sec){const s=Math.max(0,sec),m=Math.floor(s/60),whole=Math.floor(s%60),tenth=Math.floor((s-Math.floor(s))*10);return `${String(m).padStart(2,'0')}:${String(whole).padStart(2,'0')}.${tenth}`;}
function showToast(msg,ms=2200){els.toast.textContent=msg;els.toast.classList.add('보임');clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.classList.remove('보임'),ms);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);}

function syncSequenceUI(){
  const seq=sceneDoc.sequence,fps=seq.fps,totalFrames=Math.round(seq.duration*fps);
  if(els.fpsSelect)els.fpsSelect.value=String(fps);
  if(els.timelineSummary)els.timelineSummary.textContent=`${Number(seq.duration.toFixed(1))}초 · ${fps} FPS`;
  if(els.timelineFrameCount)els.timelineFrameCount.textContent=`${totalFrames} frames`;
  if(els.renderDuration)els.renderDuration.textContent=`${seq.duration.toFixed(1)}초`;
  if(els.renderFrameCount)els.renderFrameCount.textContent=String(totalFrames);
  if(els.renderResolution)els.renderResolution.textContent=`${seq.width} × ${seq.height}`;
  if(els.timeline){els.timeline.max=String(seq.duration);els.timeline.step=String(1/fps);els.timeline.setAttribute('aria-label',`${seq.duration}초 마스터 타임라인`);}
  $$('#timeline-ruler span').forEach((el,i)=>{const value=Number((seq.duration*i/4).toFixed(2));el.textContent=String(value)+(i===4?'s':'');});
}
function setProjectFps(value){
  const fps=Number(value);
  if(!SUPPORTED_FPS.includes(fps)){showToast('지원 FPS는 24 / 25 / 30 / 60입니다.');syncSequenceUI();return;}
  if(sceneDoc.sequence.fps===fps){syncSequenceUI();return;}
  const next=cloneSceneDocument(sceneDoc);next.sequence.fps=fps;const check=validateSceneDocument(next);
  if(!check.ok){showToast(check.errors[0]);syncSequenceUI();return;}
  sceneDoc=next;rememberEdit();engine.document=sceneDoc;engine.refreshEditing?.();els.json.textContent=JSON.stringify(sceneDoc,null,2);showInterpretation(sceneDoc);syncSequenceUI();renderTracks();updateTimeUI(Math.min(engine.time,sceneDoc.sequence.duration),false);syncTransformUI();
  showToast(`${fps} FPS · ${Math.round(sceneDoc.sequence.duration*fps)}프레임으로 변경했습니다.`);
}

function showInterpretation(doc){
  const box=document.querySelector('#interpretation');if(!box)return;
  const info=doc.interpretation;
  box.textContent=info?['구성 결과: '+info.summary,...info.assumptions.map(x=>'기본값: '+x),...info.warnings.map(x=>'미지원/확인: '+x),doc.interpretation.mode==='structured'?'구조화 선택으로 구성 · 분위기는 보조 프롬프트에 포함':'지원 구문 기반 구성 · 외부 AI 연결 없음'].join('\n'):'기존 장면';
  if(engine instanceof CanvasSceneEngine && doc.props.some(p=>p.type==='knife'))box.textContent+='\nCanvas 대체 모드에서는 나이프 소품 표시를 지원하지 않습니다. WebGL 브라우저를 사용해주세요.';
}
async function initEngine(){
  const forceCanvas=new URLSearchParams(location.search).get('renderer')==='canvas';
  if(forceCanvas){const e=new CanvasSceneEngine(els.viewport);els.renderer.textContent='Canvas 검증 렌더러';els.renderer.classList.add('대체');return e;}
  try{const {createThreeSceneEngine}=await import('./renderer-three.js');const e=await createThreeSceneEngine(els.viewport);els.renderer.textContent=e.rendererLabel;els.renderer.classList.add('온라인');return e;}
  catch(error){console.info('[Previz] Three.js를 사용할 수 없어 Canvas 렌더러로 전환합니다.',error?.message||error);const e=new CanvasSceneEngine(els.viewport);els.renderer.textContent=e.rendererLabel;els.renderer.classList.add('대체');return e;}
}

function shotIndexAtTime(time){const shot=activeShotAtTime(sceneDoc,time);return Math.max(0,sceneDoc.shots.findIndex(s=>s.id===shot.id));}
function renderSceneTree(){
  const env=sceneDoc.scene.environment;
  const actors=sceneDoc.actors.map((a,i)=>`<button data-select-actor="${escapeHtml(a.id)}" class="트리아이템"><span class="트리아이콘">${i+1}</span><span><b>${escapeHtml(a.role)}</b><small>${escapeHtml(a.actions.map(x=>actionLabels[x.type]||x.type).join(' → '))}</small></span></button>`).join('');
  const shots=sceneDoc.shots.map((s,i)=>`<button class="트리아이템" data-jump-shot="${i}"><span class="트리아이콘">⌁</span><span>${String(i+1).padStart(2,'0')} · ${escapeHtml(s.title)}</span></button>`).join('');
  els.sceneTree.innerHTML=`<div class="트리그룹"><div class="트리제목">환경</div><button data-context-select="environment" class="트리아이템"><span class="트리아이콘">◇</span><span>${escapeHtml(envLabels[env.type]||env.type)} · ${env.time==='night'?'밤':'낮'}</span></button></div><div class="트리그룹"><div class="트리제목">배우</div>${actors}</div><div class="트리그룹"><div class="트리제목">카메라 / 샷</div>${shots}</div><div class="트리그룹"><div class="트리제목">소품</div>${sceneDoc.props.map(p=>`<button class="트리아이템" data-context-select="prop:${escapeHtml(p.id)}">${escapeHtml(({umbrella:'우산',knife:'나이프',car:'자동차'})[p.type]||p.type)}</button>`).join('')}</div>`;
  $$('[data-context-select]').forEach(b=>b.addEventListener('click',()=>{editTarget=b.dataset.contextSelect;els.editTarget.value=editTarget;syncTransformUI();}));
  $$('[data-select-actor]').forEach(b=>b.addEventListener('click',()=>selectActor(b.dataset.selectActor)));
  $$('[data-jump-shot]').forEach(b=>b.addEventListener('click',()=>{editTarget='camera';els.editTarget.value='camera';engine.selectShot(Number(b.dataset.jumpShot));syncTransformUI();}));
}

function selectActor(id){editTarget=id;els.editTarget.value=id;$('#action-actor').value=id;populateActionSegments();const actor=sceneDoc.actors.find(a=>a.id===id),index=actor?.actions.findIndex(a=>!['idle','stop'].includes(a.type));if(index>=0){$('#action-index').value=String(index);syncActionInputs();}syncTransformUI();}
function renderTracks(){
  const rows=buildTimelineRows(sceneDoc),d=sceneDoc.sequence.duration;
  const clip=(item,extra='',label=item.label)=>{const left=item.start/d*100,width=(item.end-item.start)/d*100;return `<button class="타임클립 ${escapeHtml(extra)}" data-jump="${item.start}" data-track-actor="${escapeHtml(item.actorId||'')}" data-track-action="${item.actionIndex??''}" style="left:${left}%;width:${width}%"><span>${escapeHtml(label)}</span></button>`};
  const actorRows=rows.actors.map((row,i)=>`<div class="트랙행"><div class="트랙라벨">배우 ${i+1}</div><div class="트랙레인">${row.clips.map((x,actionIndex)=>clip({...x,actorId:sceneDoc.actors[i]?.id,actionIndex},`액션 ${x.type}`,`${actionLabels[x.type]||x.type} · ${x.type.toUpperCase()}`)).join('')}</div></div>`).join('');
  els.tracks.innerHTML=`<div class="트랙행"><div class="트랙라벨">샷</div><div class="트랙레인">${rows.shots.map((x,i)=>clip(x,`샷클립 shot-${i}`)).join('')}</div></div>${actorRows}<div class="트랙행"><div class="트랙라벨">카메라</div><div class="트랙레인">${rows.camera.map(x=>clip(x,'카메라클립',`${movementLabels[x.type]||x.type} · ${movementShort[x.type]||x.type.toUpperCase()}`)).join('')}</div></div>`;
  $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.trackActor){selectActor(b.dataset.trackActor);$('#action-index').value=b.dataset.trackAction;syncActionInputs();}engine.seek(Number(b.dataset.jump)+.001);}));
}

function num(el,fallback=0){const v=Number(el?.value);return Number.isFinite(v)?v:fallback;}
function setNum(el,v,digits=2){if(el)el.value=Number(v||0).toFixed(digits).replace(/\.00$/,'');}
function populateTransformTargets(){
  if(!els.editTarget)return;
  const current=editTarget;
  els.editTarget.innerHTML='<option value="camera">카메라</option>'+sceneDoc.actors.map((a,i)=>`<option value="${escapeHtml(a.id)}">배우 ${i+1} · ${escapeHtml(a.role)}</option>`).join('')+'<option value="environment">공간</option>'+sceneDoc.props.map(p=>`<option value="prop:${escapeHtml(p.id)}">소품 · ${escapeHtml(p.type==='umbrella'?'우산':p.type==='knife'?'나이프':'자동차')}</option>`).join('');
  els.targetActor.innerHTML=sceneDoc.actors.map((a,i)=>`<option value="${escapeHtml(a.id)}">배우 ${i+1}</option>`).join('');
  editTarget=current==='camera'||current==='environment'||current.startsWith('prop:')||sceneDoc.actors.some(a=>a.id===current)?current:'camera';els.editTarget.value=editTarget;
}
function syncTransformUI(){
  if(interactionLock)return;
  if(!engine||!sceneDoc?.shots?.length||!els.editTarget)return;
  const isCamera=editTarget==='camera',isActor=sceneDoc.actors.some(a=>a.id===editTarget);if(!isCamera&&!isActor){syncContextInspector();return;}$('#context-controls').hidden=true;$('#action-editor').hidden=isCamera;$('.현재샷섹션').hidden=!isCamera;$('#inspector-title').textContent=isCamera?'촬영 카메라':(sceneDoc.actors.find(a=>a.id===editTarget)?.role||'배우')+' · 동작과 동선';$$('[data-select-actor]').forEach(b=>b.classList.toggle('selected',b.dataset.selectActor===editTarget));if(!isCamera&&transformMode==='target')transformMode='translate';els.cameraTransform.hidden=!isCamera;els.actorTransform.hidden=isCamera;
  $$('.기즈모버튼').forEach(b=>{b.classList.toggle('활성',b.dataset.transformMode===transformMode);b.disabled=!isCamera&&b.dataset.transformMode==='target';});
  $$('[data-camera-key]').forEach(b=>b.classList.toggle('활성',b.dataset.cameraKey===cameraEditKey));
  if(isCamera){
    const snap=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey);if(!snap)return;
    const manual=sceneDoc.shots[currentShotIndex].camera.manual;
    els.manualState.textContent=manual?.enabled?'사용자 수정':'자동 구도';els.manualState.classList.toggle('수동',Boolean(manual?.enabled));
    [els.camX,els.camY,els.camZ].forEach((el,i)=>setNum(el,snap.position[i]));setNum(els.camHeight,snap.position[1]);setNum(els.camDistance,snap.distance);
    els.targetMode.value=snap.targetMode||'free';els.targetActor.value=snap.targetActorId||sceneDoc.actors[0]?.id||'';els.targetActorRow.hidden=els.targetMode.value!=='actor';
    const targetValues=manual?.enabled&&manual.targetMode==='free'?(cameraEditKey==='end'?manual.targetEnd:manual.targetStart):snap.target;[els.targetX,els.targetY,els.targetZ].forEach((el,i)=>setNum(el,targetValues[i]));[els.targetOffsetX,els.targetOffsetY,els.targetOffsetZ].forEach((el,i)=>setNum(el,snap.targetOffset[i]));
    const free=els.targetMode.value==='free';[els.targetX,els.targetY,els.targetZ].forEach(el=>el.disabled=!free);
    engine.setEditSelection?.('camera','camera');engine.setCameraEditScope?.(cameraEditScope);engine.setCameraEditKey?.(cameraEditKey);engine.setTransformMode?.(transformMode);
  } else {
    const actor=sceneDoc.actors.find(a=>a.id===editTarget)||sceneDoc.actors[0];if(!actor)return;$('#selected-actor-role').value=actor.role;
    els.manualState.textContent='배우 편집';els.manualState.classList.remove('수동');
    [els.actorX,els.actorY,els.actorZ].forEach((el,i)=>setNum(el,actor.position[i]));setNum(els.actorRotation,(actor.rotationY||0)*180/Math.PI,1);
    engine.setEditSelection?.('actor',actor.id);engine.setActorEditEndpoint?.($('#actor-edit-endpoint').value,Number($('#action-index').value));engine.setTransformMode?.(transformMode);
  }
}
function afterDocumentEdit(message='수정했습니다.'){
  const check=validateSceneDocument(sceneDoc);if(!check.ok){sceneDoc=JSON.parse(lastSnapshot).document;engine.document=sceneDoc;engine.refreshEditing?.();syncTransformUI();showToast('수정 취소: '+check.errors[0],4000);return;}rememberEdit();engine.document=sceneDoc;engine.refreshEditing?.();els.json.textContent=JSON.stringify(sceneDoc,null,2);syncSequenceUI();renderSceneTree();renderTracks();syncShotUI(engine.time);syncTransformUI();populateActionEditor();if(message)showToast(message,1400);
}
function editCameraPosition(position){
  const wasAutomatic=!selectedShot().camera.manual?.enabled;
  if(cameraEditScope==='wholeShot')translateShotCamera(sceneDoc,currentShotIndex,cameraEditKey,position.map(Number));else{const m=ensureManualCamera(sceneDoc,currentShotIndex);m[cameraEditKey]=position.map(Number);}afterDocumentEdit(wasAutomatic?'자동 경로를 시작/끝 기반 수동 경로로 전환했습니다.':'카메라 위치를 수정했습니다.');
}
function editCameraTargetFree(target){
  if(cameraEditScope==='wholeShot')translateShotTarget(sceneDoc,currentShotIndex,cameraEditKey,target.map(Number));else{const m=ensureManualCamera(sceneDoc,currentShotIndex);m.targetMode='free';m[cameraEditKey==='end'?'targetEnd':'targetStart']=target.map(Number);m.targetOffset=[0,0,0];}afterDocumentEdit('카메라 타겟을 수정했습니다.');
}
function editCameraDistance(distance){
  const snap=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey),d=Math.max(.5,Math.min(50,distance));if(!snap)return;
  const dx=snap.position[0]-snap.target[0],dy=snap.position[1]-snap.target[1],dz=snap.position[2]-snap.target[2],len=Math.hypot(dx,dy,dz)||1;
  editCameraPosition([snap.target[0]+dx/len*d,snap.target[1]+dy/len*d,snap.target[2]+dz/len*d]);
}
function editActorPosition(){
  const actor=sceneDoc.actors.find(a=>a.id===editTarget);if(!actor)return;const next=[num(els.actorX,actor.position[0]),num(els.actorY,actor.position[1]),num(els.actorZ,actor.position[2])];
  translateActorPath(sceneDoc,actor.id,[next[0]-actor.position[0],next[1]-actor.position[1],next[2]-actor.position[2]]);afterDocumentEdit('배우 위치를 수정했습니다.');
}
function syncFromEngineEdit(){sceneDoc=engine.document;if(!engineEditGrouped)rememberEdit();els.json.textContent=JSON.stringify(sceneDoc,null,2);syncShotUI(engine.time);syncTransformUI();syncActionInputs();}

function syncShotOverlay(shot,time){
  const idx=currentShotIndex+1,elapsed=Math.max(0,time-shot.start),show=currentView==='preview'&&elapsed<1.25;
  els.overlayShot.textContent=`SHOT ${String(idx).padStart(2,'0')}`;
  els.overlayTitle.textContent=shot.title;
  els.overlayMeta.textContent=`${shot.camera.lens}mm · ${archetypeLabels[shot.camera.archetype||'free']}`;
  els.shotOverlay.classList.toggle('보임',show);
}

function syncShotUI(time=engine?.time||0){
  currentShotIndex=shotIndexAtTime(time);const shot=sceneDoc.shots[currentShotIndex],env=sceneDoc.scene.environment;
  els.shotIndex.textContent=`샷 ${String(currentShotIndex+1).padStart(2,'0')}`;
  els.viewportShotId.textContent=`SHOT ${String(currentShotIndex+1).padStart(2,'0')}`;
  els.viewportShotTitle.textContent=shot.title;
  els.intentTitle.textContent=shot.title;els.intentCopy.textContent=shot.intent;els.shotIntent.textContent=shot.intent;
  els.lens.value=shot.camera.lens;els.movement.textContent=movementLabels[shot.camera.movement]||shot.camera.movement;
  els.environment.textContent=`${envLabels[env.type]||env.type} · ${env.time==='night'?'밤':'낮'}`;
  els.camera.textContent=`${shot.camera.lens}mm · ${movementLabels[shot.camera.movement]||shot.camera.movement}`;
  $$('.샷클립').forEach((el,i)=>el.classList.toggle('활성',i===currentShotIndex));
  syncShotOverlay(shot,time);
}
function updateTimeUI(time=0,playing=false){if(cameraEditScope!=='wholeShot'){const shot=activeShotAtTime(sceneDoc,time),expected=cameraEditScope==='end'?Math.max(shot.start,shot.end-1/sceneDoc.sequence.fps):shot.start;if(Math.abs(time-expected)>1/sceneDoc.sequence.fps){cameraEditScope='wholeShot';cameraEditKey='start';$('#camera-edit-scope').value='wholeShot';engine?.setCameraEditScope?.('wholeShot');}$('#camera-scope-time').textContent=cameraEditScope==='wholeShot'?'샷 전체 경로에 같은 이동량을 적용합니다.':`${cameraEditScope==='end'?'끝':'시작'} 지점 · ${time.toFixed(2)}초 편집`;}const d=sceneDoc.sequence.duration;els.timeline.max=String(d);els.timeline.value=String(time);els.timelineTime.textContent=formatTime(time);els.progressReadout.textContent=`${formatTime(time)} / ${formatTime(d)}`;els.play.textContent=playing?'Ⅱ':'▶';syncShotUI(time);if(!playing&&engine)syncTransformUI();}

function setView(view){
  currentView=view==='preview'?'preview':'edit';
  els.app.dataset.view=currentView;
  $$('[data-view]').forEach(b=>b.classList.toggle('활성',b.dataset.view===currentView));
  engine?.setViewMode(currentView);
  if(currentView==='preview') els.viewStatus.innerHTML='<strong>카메라 프리뷰 · 16:9 OUTPUT</strong><span>최종 영상과 동일한 프레임입니다.</span>';
  else els.viewStatus.innerHTML='<strong>편집 작업 시점</strong><span>최종 출력 화면이 아닙니다.</span>';
  syncShotUI(engine?.time||0);if(engine)syncTransformUI();
}

async function loadScene(doc){
  const check=validateSceneDocument(doc);if(!check.ok){showToast(check.errors[0]);throw new Error(check.errors.join(' '));}
  sceneDoc=doc;await engine.loadDocument(sceneDoc);engine.onTime=(time,playing)=>updateTimeUI(time,playing);engine.onDocumentEdit=syncFromEngineEdit;engine.onEditTransaction=phase=>{if(phase==='begin')engineEditGrouped=true;else if(phase==='end'){engineEditGrouped=false;sceneDoc=engine.document;rememberEdit();}};engine.onSelectionChange=selection=>{if(selection.type==='actor')selectActor(selection.id);else if(selection.type==='camera'){editTarget='camera';els.editTarget.value='camera';syncTransformUI();}else if(selection.type==='prop'||selection.type==='environment'){editTarget=selection.type==='prop'?'prop:'+selection.id:'environment';els.editTarget.value=editTarget;syncTransformUI();}};
  els.continuity.textContent=sceneDoc.scene.continuityKey;els.json.textContent=JSON.stringify(sceneDoc,null,2);showInterpretation(sceneDoc);
  syncSequenceUI();populateTransformTargets();populateActionEditor();renderSceneTree();renderTracks();updateTimeUI(0,false);setView(currentView);syncTransformUI();
}

function selectedShot(){return sceneDoc.shots[currentShotIndex];}
function referenceManifest(){return {format:'previz-reference-pack',version:APP_VERSION,build:BUILD_INFO,sourcePrompt:sceneDoc.sourcePrompt,supplementaryPrompt:sceneDoc.supplementaryPrompt||'',props:sceneDoc.props,sequence:sceneDoc.sequence,continuityKey:sceneDoc.scene.continuityKey,environment:sceneDoc.scene.environment,actors:sceneDoc.actors.map(a=>({id:a.id,role:a.role,actions:a.actions})),shots:sceneDoc.shots.map((s,i)=>({id:s.id,title:s.title,start:s.start,end:s.end,lens:s.camera.lens,movement:s.camera.movement,archetype:s.camera.archetype||'free',manualCamera:s.camera.manual||null,referenceFrames:[['start',s.start],['mid',(s.start+s.end)/2],['end',Math.max(s.start,s.end-1/sceneDoc.sequence.fps)]].map(([role,time])=>({role,time,suggestedFilename:`previz-shot${String(i+1).padStart(2,'0')}-${role}.png`}))})),referenceIntent:'카메라 구도, 인물 동선, 움직임과 샷 연속성을 AI 영상 생성에 전달한다.'};}
function exportSceneSlug(){const actions=sceneDoc.actors.flatMap(a=>a.actions||[]).map(a=>a.type);if(actions.includes('fight'))return 'fight';if(actions.includes('chase'))return 'chase';return sceneDoc.scene.environment.type||'scene';}
function exportBaseName(){return `previz-${exportSceneSlug()}-${Math.round(sceneDoc.sequence.duration)}s-v${APP_VERSION}`;}
async function captureRole(role){if(rendering||captureBusy)return;captureBusy=true;lockInteractions();try{const shot=selectedShot(),t=role==='start'?shot.start:role==='mid'?(shot.start+shot.end)/2:Math.max(shot.start,shot.end-1/sceneDoc.sequence.fps);const blob=await engine.captureAtTime(t);if(!blob)return showToast('프레임 캡처 실패');downloadBlob(blob,`previz-shot${String(currentShotIndex+1).padStart(2,'0')}-${role}.png`);showToast(`${role} PNG를 저장했습니다.`);}catch(error){showToast('프레임 캡처 실패: '+error.message);}finally{captureBusy=false;unlockInteractions();}}


function syncBlockingActors(){
  const count=Number($('#blocking-count').value),old=$$('[data-blocking-role]').map(x=>x.value);
  $('#blocking-roles').innerHTML=Array.from({length:count},(_,i)=>`<label class="필드 세로필드">배우 ${i+1} 역할<input id="blocking-role-${i}" data-blocking-role="${i}" class="선택입력" maxlength="40" value="${escapeHtml(old[i]??['남자','여자','배우 3','배우 4'][i])}"></label>`).join('');
  refreshBlockingActorOptions();
}
function refreshBlockingActorOptions(){
  const roles=$$('[data-blocking-role]').map((x,i)=>x.value.trim()||`배우 ${i+1}`);
  for(const [id,fallback] of [['blocking-mover',1],['blocking-target',0],['blocking-holder',0]]){
    const el=$('#'+id),previous=el.value===''?fallback:Number(el.value);
    el.innerHTML=roles.map((r,i)=>`<option value="${i}">${i+1} · ${escapeHtml(r)}</option>`).join('');el.value=String(Math.min(previous,roles.length-1));
  }
  const motion=$('#blocking-motion');motion.querySelector('[value="approach"]').disabled=roles.length<2;
  if(roles.length<2&&motion.value==='approach')motion.value='walk';
  $('#blocking-target').disabled=motion.value!=='approach';$('#blocking-mover').disabled=motion.value==='idle';$('#blocking-holder').disabled=$('#blocking-prop').value==='none';
}
function readBlockingInput(){
  const duration=Number($('#blocking-duration').value);
  if(!Number.isFinite(duration)||duration<4||duration>60)throw new Error('영상 길이는 4~60초로 입력해주세요.');
  return {setting:$('#blocking-setting').value,duration,roles:$$('[data-blocking-role]').map((x,i)=>x.value.trim()||`배우 ${i+1}`),mover:Number($('#blocking-mover').value),target:Number($('#blocking-target').value),motion:$('#blocking-motion').value,prop:$('#blocking-prop').value,holder:Number($('#blocking-holder').value),camera:$('#blocking-camera').value,atmosphere:[$('#scene-description').value.trim(),$('#blocking-atmosphere').value.trim()].filter(Boolean).join('\n'),startTime:Math.min(1,duration*.15),arrivalTime:duration*.75};
}
function populateActionEditor(){
  const actorSelect=$('#action-actor'),old=actorSelect.value;
  actorSelect.innerHTML=sceneDoc.actors.map(a=>`<option value="${escapeHtml(a.id)}">${escapeHtml(a.role)}</option>`).join('');
  if(sceneDoc.actors.some(a=>a.id===editTarget))actorSelect.value=editTarget;else if(sceneDoc.actors.some(a=>a.id===old))actorSelect.value=old;
  populateActionSegments();
}
function populateActionSegments(){
  const actor=sceneDoc.actors.find(a=>a.id===$('#action-actor').value);if(!actor)return;
  const el=$('#action-index'),old=el.value;
  el.innerHTML=actor.actions.map((a,i)=>`<option value="${i}">${i+1} · ${escapeHtml(actionLabels[a.type]||a.type)} (${a.start}–${a.end}초)</option>`).join('');
  el.value=old!==''&&actor.actions[Number(old)]?old:'0';syncActionInputs();
}
function syncActionInputs(){
  const actor=sceneDoc.actors.find(a=>a.id===$('#action-actor').value),a=actor?.actions[Number($('#action-index').value)];if(!a)return;
  engine?.setActorEditEndpoint?.($('#actor-edit-endpoint').value,Number($('#action-index').value));$('#selected-actor-motion').value=a.type;const from=a.from||actor.position,to=a.to||from;
  for(const [id,v] of [['action-start',a.start],['action-end',a.end],['action-from-x',from[0]],['action-from-z',from[2]],['action-to-x',to[0]],['action-to-z',to[2]]])setNum($('#'+id),v);
}
$('#blocking-count').addEventListener('change',syncBlockingActors);
$('#blocking-roles').addEventListener('input',refreshBlockingActorOptions);
$('#blocking-motion').addEventListener('change',refreshBlockingActorOptions);$('#blocking-prop').addEventListener('change',refreshBlockingActorOptions);
$('#input-mode').addEventListener('change',()=>{const structured=$('#input-mode').value==='structured';$('#structured-fields').hidden=!structured;$('#legacy-fields').hidden=structured;$('#blocking-summary').textContent=structured?'선택을 조정하고 장면 만들기를 누르세요.':'기존 규칙 기반 문장 모드 · 지원 구문만 구성';});
$('#action-actor').addEventListener('change',()=>selectActor($('#action-actor').value));$('#action-index').addEventListener('change',syncActionInputs);
$('#apply-action').addEventListener('click',async()=>{if(rendering)return;try{const read=id=>{const el=$('#'+id);if(el.value.trim()===''||!Number.isFinite(Number(el.value)))throw new Error('동선 좌표와 시간을 숫자로 입력해주세요.');return Number(el.value);};const next=editActionPath(sceneDoc,$('#action-actor').value,Number($('#action-index').value),{start:read('action-start'),end:read('action-end'),from:[read('action-from-x'),0,read('action-from-z')],to:[read('action-to-x'),0,read('action-to-z')]});const time=engine.time;sceneDoc=next;rememberEdit();await loadScene(next);engine.seek(time);showToast('동선과 인접 구간 연결을 수정했습니다.');}catch(error){showToast(error.message,4500);}});
$('#export-prompt').addEventListener('click',()=>{const text=[`Previz Studio v${APP_VERSION} · 영상 생성 보조 프롬프트`,sceneDoc.sourcePrompt,`분위기: ${sceneDoc.supplementaryPrompt||'별도 지정 없음'}`,'',`공간: ${envLabels[sceneDoc.scene.environment.type]||sceneDoc.scene.environment.type}`,`길이: ${sceneDoc.sequence.duration}초`,...sceneDoc.actors.map(a=>`${a.role} (${a.id}): ${a.actions.map(x=>`${actionLabels[x.type]||x.type} ${x.start}~${x.end}초, ${JSON.stringify(x.from||a.position)} → ${JSON.stringify(x.to||x.from||a.position)}`).join('; ')}`),...sceneDoc.props.map(p=>`소품: ${p.type} · ${sceneDoc.actors.find(a=>a.id===p.actorId)?.role||"공간 소품"}`),...sceneDoc.shots.map(s=>`카메라: ${movementLabels[s.camera.movement]||s.camera.movement}, ${s.camera.lens}mm`),'','첨부 레퍼런스의 인물 동선, 구도, 시간과 연결을 유지하세요.'].join('\n');downloadBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),`2026-10-04-previz-studio-v${APP_VERSION}-supplemental-prompt.txt`);});
syncBlockingActors();
els.generate.addEventListener('click',async()=>{if(rendering)return;const projectFps=sceneDoc.sequence.fps;els.generate.disabled=true;els.generate.querySelector('span').textContent='블로킹 중…';try{if($('#input-mode').value!=='structured'&&!els.prompt.value.trim())throw Error('장면 설명을 입력해주세요.');const next=$('#input-mode').value==='structured'?createBlockingScene(readBlockingInput()):directPromptFallback(els.prompt.value.trim());next.sequence.fps=projectFps;next.supplementaryPrompt=[$('#scene-description').value.trim(),$('#blocking-atmosphere').value.trim()].filter(Boolean).join('\n');const summary=`공간: ${envLabels[next.scene.environment.type]} · 배우 ${next.actors.length}명 · ${next.sequence.duration}초\n${next.interpretation?.summary||''}\n${(next.interpretation?.warnings||[]).join('\n')}`;if((manualEdits||$('#input-mode').value!=='structured')&&!confirm(summary+'\n\n현재 장면을 이 구성으로 교체할까요?'))return;sceneDoc=next;rememberEdit();await loadScene(next);$('#blocking-summary').textContent=`${envLabels[next.scene.environment.type]} · 배우 ${next.actors.length}명 · ${next.sequence.duration}초 · 구성 완료`;showToast(next.interpretation?.warnings.length?'일부 요청을 반영하지 못했습니다. 구성 결과를 확인해주세요.':'장면을 구성했습니다.');}catch(error){showToast('장면 구성 실패: '+error.message,4500);}finally{els.generate.disabled=false;els.generate.querySelector('span').textContent='장면 만들기';}});
document.addEventListener('keydown',e=>{if(rendering||captureBusy)return;if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();els.generate.click();}});
els.play.addEventListener('click',()=>{if(engine.time>=sceneDoc.sequence.duration-.001)engine.seek(0);engine.setPlaying(!engine.playing);updateTimeUI(engine.time,engine.playing);});
els.reset.addEventListener('click',()=>engine.reset());
els.timeline.addEventListener('input',()=>engine.seek(Number(els.timeline.value)));
els.fpsSelect?.addEventListener('change',()=>setProjectFps(els.fpsSelect.value));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
els.lens.addEventListener('change',()=>{const next=cloneSceneDocument(sceneDoc),v=Math.max(18,Math.min(120,Number(els.lens.value)||35));next.shots[currentShotIndex].camera.lens=v;sceneDoc=next;rememberEdit();engine.document=sceneDoc;engine.refreshEditing?.();els.json.textContent=JSON.stringify(sceneDoc,null,2);syncShotUI(engine.time);syncTransformUI();});
els.editTarget?.addEventListener('change',()=>{editTarget=els.editTarget.value;if(sceneDoc.actors.some(a=>a.id===editTarget)){selectActor(editTarget);return;}if(editTarget!=='camera'&&transformMode==='target')transformMode='translate';syncTransformUI();});
$$('[data-transform-mode]').forEach(b=>b.addEventListener('click',()=>{transformMode=b.dataset.transformMode;if(editTarget!=='camera'&&transformMode==='target')transformMode='translate';syncTransformUI();}));
$$('[data-camera-key]').forEach(b=>b.addEventListener('click',()=>{cameraEditKey=b.dataset.cameraKey==='end'?'end':'start';engine.setCameraEditKey?.(cameraEditKey);syncTransformUI();}));
[els.camX,els.camY,els.camZ].forEach(el=>el?.addEventListener('change',()=>editCameraPosition([num(els.camX),num(els.camY),num(els.camZ)])));
els.camHeight?.addEventListener('change',()=>{const snap=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey);editCameraPosition([snap.position[0],num(els.camHeight,snap.position[1]),snap.position[2]]);});
els.camDistance?.addEventListener('change',()=>editCameraDistance(num(els.camDistance,6)));
els.targetMode?.addEventListener('change',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex),previous=cameraEditSnapshot(sceneDoc,currentShotIndex,cameraEditKey);m.targetMode=els.targetMode.value;m.targetActorId=els.targetActor.value||sceneDoc.actors[0]?.id||'';if(m.targetMode==='free'){const k=cameraEditKey==='end'?'targetEnd':'targetStart';m[k]=[...previous.target];m.targetOffset=[0,0,0];}afterDocumentEdit('타겟 방식을 변경했습니다.');});
els.targetActor?.addEventListener('change',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex);m.targetMode='actor';m.targetActorId=els.targetActor.value;afterDocumentEdit('타겟 배우를 변경했습니다.');});
[els.targetX,els.targetY,els.targetZ].forEach(el=>el?.addEventListener('change',()=>editCameraTargetFree([num(els.targetX),num(els.targetY),num(els.targetZ)])));
[els.targetOffsetX,els.targetOffsetY,els.targetOffsetZ].forEach(el=>el?.addEventListener('change',()=>{const m=ensureManualCamera(sceneDoc,currentShotIndex);m.targetOffset=[num(els.targetOffsetX),num(els.targetOffsetY),num(els.targetOffsetZ)];afterDocumentEdit('타겟 오프셋을 수정했습니다.');}));
els.resetCameraAuto?.addEventListener('click',()=>{resetManualCamera(sceneDoc,currentShotIndex);afterDocumentEdit('자동 카메라 구도로 되돌렸습니다.');});
[els.actorX,els.actorY,els.actorZ].forEach(el=>el?.addEventListener('change',editActorPosition));
els.actorRotation?.addEventListener('change',()=>{const actor=sceneDoc.actors.find(a=>a.id===editTarget);if(!actor)return;rotateActorPath(sceneDoc,actor.id,num(els.actorRotation,0)*Math.PI/180);afterDocumentEdit('배우 회전을 수정했습니다.');});
document.addEventListener('keydown',e=>{if(rendering||captureBusy)return;if(currentView!=='edit'||e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;const key=e.key.toLowerCase();if(key==='w')transformMode='translate';else if(key==='e')transformMode='rotate';else if(key==='t'&&editTarget==='camera')transformMode='target';else return;e.preventDefault();syncTransformUI();});

$('#ref-start').addEventListener('click',()=>captureRole('start'));$('#ref-mid').addEventListener('click',()=>captureRole('mid'));$('#ref-end').addEventListener('click',()=>captureRole('end'));$('#ref-manifest').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(referenceManifest(),null,2)],{type:'application/json'}),`previz-reference-pack-v${APP_VERSION}.json`));
els.showJson.addEventListener('click',()=>{els.json.textContent=JSON.stringify(sceneDoc,null,2);els.dialog.showModal();});els.closeJson.addEventListener('click',()=>els.dialog.close());els.dialog.addEventListener('click',e=>{if(e.target===els.dialog)els.dialog.close();});els.exportJson.addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(sceneDoc,null,2)],{type:'application/json'}),`previz-scene-v${APP_VERSION}.json`));

els.renderVideo.addEventListener('click',async()=>{
  if(rendering||captureBusy)return;rendering=true;lockInteractions();els.renderVideo.disabled=true;engine.setPlaying(false);setView('preview');els.renderBar.style.width='0%';els.renderText.textContent='렌더 준비 중…';syncExportStatus('영상 준비 중…');
  try{const result=await exportSequenceVideo(engine,sceneDoc,(p,label)=>{els.renderBar.style.width=`${Math.round(p*100)}%`;els.renderText.textContent=`${label} · ${Math.round(p*100)}%`;syncExportStatus(els.renderText.textContent);});const ext=result.format==='mp4'?'mp4':'webm';downloadBlob(result.blob,`${exportBaseName()}.${ext}`);els.renderText.textContent=`완료 · ${ext.toUpperCase()} · ${(result.blob.size/1024/1024).toFixed(1)} MB`;syncExportStatus(els.renderText.textContent);showToast(result.format==='mp4'?'프리비즈 MP4를 저장했습니다.':'MP4 인코더가 없어 WebM으로 저장했습니다.',3500);}
  catch(error){console.error(error);els.renderText.textContent=`렌더 실패 · ${error.message||error}`;syncExportStatus(els.renderText.textContent);showToast('영상 렌더에 실패했습니다.',3000);}
  finally{rendering=false;unlockInteractions();}
});

engine=await initEngine();engine.setPreviewContainer?.($('#shot-preview'));await loadScene(sceneDoc);window.__PREVIZ__={getScene:()=>sceneDoc,getEngine:()=>engine,loadPrompt:async p=>{els.prompt.value=p;const next=directPromptFallback(p);next.sequence.fps=sceneDoc.sequence.fps;await loadScene(next);},setView,setFps:setProjectFps,exportSequenceVideo:()=>exportSequenceVideo(engine,sceneDoc)};els.build.textContent=`APP v${APP_VERSION} · ${BUILD_ID}`;
window.__PREVIZ__={...window.__PREVIZ__,build:BUILD_INFO};
showToast(`Previz Studio v${APP_VERSION} · Canonical Frame 준비 완료`);



$('#undo-edit').addEventListener('click',async()=>{if(rendering||!history.length)return;const saved=JSON.parse(history.pop()),next=saved.document;$('#scene-description').value=saved.description;$('#blocking-atmosphere').value=saved.atmosphere;sceneDoc=next;lastSnapshot=editorSnapshot();engineEditGrouped=false;clearTimeout(engineEditTimer);await loadScene(next);$('#undo-edit').disabled=!history.length;showToast('이전 문서 상태로 되돌렸습니다.');});
$('#copy-director-camera').addEventListener('click',()=>{engine.copyDirectorToShot?.();sceneDoc=engine.document;afterDocumentEdit('현재 작업 시점을 샷 전체의 고정 촬영 구도로 적용했습니다.');});
$('#camera-edit-scope').addEventListener('change',()=>{cameraEditScope=$('#camera-edit-scope').value;cameraEditKey=cameraEditScope==='end'?'end':'start';engine.setCameraEditScope?.(cameraEditScope);if(cameraEditScope!=='wholeShot'){const shot=selectedShot();engine.seek(cameraEditScope==='end'?Math.max(shot.start,shot.end-1/sceneDoc.sequence.fps):shot.start);}$('#camera-scope-time').textContent=cameraEditScope==='wholeShot'?'샷 전체 경로에 같은 이동량을 적용합니다.':`${cameraEditScope==='end'?'끝':'시작'} 지점 · ${engine.time.toFixed(2)}초 편집`;syncTransformUI();});
$('#toggle-tracks').addEventListener('click',()=>{const open=$('#timeline-tracks').classList.toggle('expanded');$('#toggle-tracks').textContent=open?'동선 트랙 접기':'동선 트랙 펼치기';});
function updateChips(){const fields=[['blocking-setting','공간'],['blocking-count','배우'],['blocking-motion','동작'],['blocking-prop','소품'],['blocking-duration','길이'],['blocking-camera','카메라']];$('#input-chips').innerHTML=fields.map(([id,label])=>{const el=$('#'+id),value=el.selectedOptions?.[0]?.textContent||el.value;return `<button class="input-chip" data-input-focus="${id}">${label} · ${escapeHtml(value)}${id==='blocking-duration'?'초':''}</button>`}).join('');$$('[data-input-focus]').forEach(b=>b.addEventListener('click',()=>{$('#scene-input-options').open=true;const focus=b.dataset.inputFocus,groups={'blocking-setting':['blocking-setting','blocking-atmosphere'],'blocking-count':['blocking-count','blocking-roles'],'blocking-motion':['blocking-motion','blocking-mover','blocking-target'],'blocking-prop':['blocking-prop','blocking-holder'],'blocking-duration':['blocking-duration'],'blocking-camera':['blocking-camera']};for(const child of $('#structured-fields').children){const ids=[child.id,...[...child.querySelectorAll('[id]')].map(x=>x.id)];child.hidden=!ids.some(id=>groups[focus].includes(id));}$('#'+focus).focus();}));}
$('#structured-fields').addEventListener('change',updateChips);updateChips();
$('#scene-description').addEventListener('input',()=>{sceneDoc.supplementaryPrompt=[$('#scene-description').value.trim(),$('#blocking-atmosphere').value.trim()].filter(Boolean).join('\n');els.json.textContent=JSON.stringify(sceneDoc,null,2);});

function syncContextInspector(){
 $('#context-controls').onchange=null;engine.setEditSelection?.(editTarget==='environment'?'environment':'prop',editTarget.startsWith('prop:')?editTarget.slice(5):'');
 const environment=editTarget==='environment',prop=sceneDoc.props.find(p=>'prop:'+p.id===editTarget);$('#action-editor').hidden=true;$('.현재샷섹션').hidden=true;els.cameraTransform.hidden=true;els.actorTransform.hidden=true;$('#context-controls').hidden=false;$('#inspector-title').textContent=environment?'공간 · 단순 배경':'소품 · 소유와 위치';
 if(environment){$('#context-controls').innerHTML=`<label class="필드 세로필드">배경 종류<select id="context-environment" class="선택입력">${Object.entries(envLabels).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><p class="도움말">공간 관계를 보여주는 절차적 구조물입니다. 개별 벽과 건물의 정밀 편집은 지원하지 않습니다.</p>`;$('#context-environment').value=sceneDoc.scene.environment.type;$('#context-environment').addEventListener('change',async()=>{const time=engine.time;sceneDoc.scene.environment.type=$('#context-environment').value;sceneDoc.scene.environment.assetId=sceneDoc.scene.environment.type+'_procedural';rememberEdit();await engine.loadDocument(sceneDoc);engine.seek(time);afterDocumentEdit('공간 종류를 변경했습니다.');});}
 else if(prop){$('#context-controls').innerHTML=`<label class="필드 세로필드">소유 배우<select id="context-owner" class="선택입력"><option value="">공간 소품</option>${sceneDoc.actors.map(a=>`<option value="${escapeHtml(a.id)}">${escapeHtml(a.role)}</option>`).join('')}</select></label><label class="필드 세로필드">손<select id="context-hand" class="선택입력"><option value="right">오른손</option><option value="left">왼손</option></select></label><div class="좌표그리드">${['X','Y','Z'].map((axis,i)=>`<label>${axis}<input id="context-position-${i}" type="number" step="0.1" value="${prop.position[i]}"></label>`).join('')}</div><p class="도움말">소유 배우가 있으면 손 기준 위치 보정입니다. 정교한 파지와 접촉은 지원하지 않습니다.</p>`;$('#context-owner').value=prop.actorId||'';$('#context-hand').value=prop.hand||'right';$('#context-controls').onchange=async()=>{const next=cloneSceneDocument(sceneDoc),p=next.props.find(p=>p.id===prop.id),owner=$('#context-owner').value;if(owner)p.actorId=owner;else delete p.actorId;p.hand=$('#context-hand').value;p.position=[0,1,2].map(i=>num($('#context-position-'+i)));const check=validateSceneDocument(next);if(!check.ok)return showToast(check.errors[0]);const time=engine.time;sceneDoc=next;rememberEdit();await engine.loadDocument(sceneDoc);engine.seek(time);afterDocumentEdit('소품 설정을 수정했습니다.');};}
}

$('#selected-actor-role').addEventListener('change',()=>{const actor=sceneDoc.actors.find(a=>a.id===editTarget);if(!actor)return;actor.role=$('#selected-actor-role').value.trim()||'배우';afterDocumentEdit('역할 이름을 수정했습니다.');});
$('#mobile-work-view').addEventListener('click',()=>{els.app.dataset.mobileView='work';engine.resize?.();});
$('#mobile-shot-view').addEventListener('click',()=>{els.app.dataset.mobileView='shot';engine.resize?.();});

$('#scene-description').addEventListener('change',rememberEdit);$('#blocking-atmosphere').addEventListener('change',()=>{sceneDoc.supplementaryPrompt=[$('#scene-description').value.trim(),$('#blocking-atmosphere').value.trim()].filter(Boolean).join('\n');rememberEdit();});

$('#selected-actor-motion').addEventListener('change',async()=>{try{const actor=sceneDoc.actors.find(a=>a.id===editTarget),index=Number($('#action-index').value),action=actor?.actions[index],type=$('#selected-actor-motion').value;if(!action)return;const other=sceneDoc.actors.find(a=>a.id!==actor.id);if(['chase','fight'].includes(type)&&!other)throw Error('이 동작은 다른 배우가 필요합니다.');if(type==='knife_action'&&!sceneDoc.props.some(p=>p.type==='knife'&&p.actorId===actor.id))throw Error('나이프를 소유한 배우에게 적용해주세요.');const from=action.from||actor.position,to=['idle','stop','turn'].includes(type)?from:(action.to||from);const next=editActionPath(sceneDoc,actor.id,index,{start:action.start,end:action.end,from:[...from],to:[...to]});const changed=next.actors.find(a=>a.id===actor.id).actions[index];changed.type=type;if(['chase','fight'].includes(type))changed.targetId=other.id;else delete changed.targetId;const check=validateSceneDocument(next);if(!check.ok)throw Error(check.errors[0]);const time=engine.time;sceneDoc=next;rememberEdit();await loadScene(next);engine.seek(time);showToast('기본 동작과 인접 동선을 수정했습니다.');}catch(error){showToast(error.message,4000);syncActionInputs();}});

$('#actor-edit-endpoint').addEventListener('change',()=>{const actor=sceneDoc.actors.find(a=>a.id===editTarget),index=Number($('#action-index').value),action=actor?.actions[index],endpoint=$('#actor-edit-endpoint').value;if(!action)return;engine.setActorEditEndpoint?.(endpoint,index);if(endpoint!=='wholePath')engine.seek(endpoint==='from'?action.start:Math.max(action.start,action.end-1/sceneDoc.sequence.fps));syncTransformUI();showToast(endpoint==='to'?'작업 화면의 이동 핸들로 도착 위치를 조정하세요.':endpoint==='from'?'작업 화면의 이동 핸들로 출발 위치를 조정하세요.':'배우의 전체 동선을 이동합니다.');});
