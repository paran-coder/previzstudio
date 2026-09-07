import { directPromptFallback } from './director-fallback.js';
import { cloneSceneDocument, validateSceneDocument } from './scene-schema.js';
import { activeShotAtTime, buildTimelineRows } from './sequence.js';
import { CanvasSceneEngine } from './renderer-canvas.js';
import { exportSequenceVideo } from './video-exporter.js';

const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const els={
  viewport:$('#viewport'),prompt:$('#prompt'),generate:$('#generate'),play:$('#play'),reset:$('#reset'),timeline:$('#timeline'),timelineTime:$('#timeline-time'),progressReadout:$('#progress-readout'),
  sceneTree:$('#scene-tree'),continuity:$('#continuity-label'),environment:$('#environment-label'),camera:$('#camera-label'),renderer:$('#renderer-status'),tracks:$('#timeline-tracks'),
  shotIndex:$('#shot-index-label'),intentTitle:$('#intent-title'),intentCopy:$('#intent-copy'),shotIntent:$('#shot-intent'),lens:$('#lens'),movement:$('#movement-label'),renderDuration:$('#render-duration'),
  renderVideo:$('#render-video'),renderBar:$('#render-progress-bar'),renderText:$('#render-progress-text'),showJson:$('#show-json'),exportJson:$('#export-json'),dialog:$('#json-dialog'),closeJson:$('#close-json'),json:$('#json-output'),toast:$('#toast'),safeFrame:$('#safe-frame')
};

const movementLabels={static:'고정',dolly_in:'돌리 인',dolly_out:'돌리 아웃',track_follow:'팔로우 트래킹',track_between:'사이 트래킹',orbit:'오비트',handheld_follow:'핸드헬드 팔로우'};
const actionLabels={idle:'대기',walk:'걷기',run:'달리기',chase:'추격',turn:'회전',stop:'멈춤'};
const envLabels={road:'도로',urban_alley:'도시 골목',warehouse:'창고',corridor:'복도',office:'사무실',studio:'스튜디오'};
let sceneDoc=directPromptFallback(els.prompt.value), engine=null, currentShotIndex=0, toastTimer=0, rendering=false;

function formatTime(sec){const s=Math.max(0,sec),m=Math.floor(s/60),whole=Math.floor(s%60),tenth=Math.floor((s-Math.floor(s))*10);return `${String(m).padStart(2,'0')}:${String(whole).padStart(2,'0')}.${tenth}`;}
function showToast(msg,ms=2200){els.toast.textContent=msg;els.toast.classList.add('보임');clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.classList.remove('보임'),ms);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);}

async function initEngine(){
  try{const {createThreeSceneEngine}=await import('./renderer-three.js');const e=await createThreeSceneEngine(els.viewport);els.renderer.textContent=e.rendererLabel;els.renderer.classList.add('온라인');return e;}
  catch(error){console.info('[Previz] Three.js를 사용할 수 없어 Canvas 렌더러로 전환합니다.',error?.message||error);const e=new CanvasSceneEngine(els.viewport);els.renderer.textContent=e.rendererLabel;els.renderer.classList.add('대체');return e;}
}

function shotIndexAtTime(time){const shot=activeShotAtTime(sceneDoc,time);return Math.max(0,sceneDoc.shots.findIndex(s=>s.id===shot.id));}
function renderSceneTree(){
  const env=sceneDoc.scene.environment;
  const actors=sceneDoc.actors.map((a,i)=>`<div class="트리아이템"><span class="트리아이콘">${i+1}</span><span><b>${a.id.toUpperCase()}</b><small>${a.actions.map(x=>actionLabels[x.type]||x.type).join(' → ')}</small></span></div>`).join('');
  const shots=sceneDoc.shots.map((s,i)=>`<button class="트리아이템" data-jump-shot="${i}"><span class="트리아이콘">⌁</span><span>${String(i+1).padStart(2,'0')} · ${s.title}</span></button>`).join('');
  els.sceneTree.innerHTML=`<div class="트리그룹"><div class="트리제목">환경</div><div class="트리아이템"><span class="트리아이콘">◇</span><span>${envLabels[env.type]||env.type} · ${env.time==='night'?'밤':'낮'}</span></div></div><div class="트리그룹"><div class="트리제목">배우</div>${actors}</div><div class="트리그룹"><div class="트리제목">카메라 / 샷</div>${shots}</div>`;
  $$('[data-jump-shot]').forEach(b=>b.addEventListener('click',()=>engine.selectShot(Number(b.dataset.jumpShot))));
}

function renderTracks(){
  const rows=buildTimelineRows(sceneDoc),d=sceneDoc.sequence.duration;
  const clip=(item,extra='')=>{const left=item.start/d*100,width=(item.end-item.start)/d*100;return `<button class="타임클립 ${extra}" data-jump="${item.start}" style="left:${left}%;width:${width}%"><span>${item.label}</span></button>`};
  const actorRows=rows.actors.map((row,i)=>`<div class="트랙행"><div class="트랙라벨">배우 ${i+1}</div><div class="트랙레인">${row.clips.map(x=>clip(x,`액션 ${x.type}`)).join('')}</div></div>`).join('');
  els.tracks.innerHTML=`<div class="트랙행"><div class="트랙라벨">샷</div><div class="트랙레인">${rows.shots.map((x,i)=>clip(x,`샷클립 shot-${i}`)).join('')}</div></div>${actorRows}<div class="트랙행"><div class="트랙라벨">카메라</div><div class="트랙레인">${rows.camera.map(x=>clip(x,'카메라클립')).join('')}</div></div>`;
  $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>engine.seek(Number(b.dataset.jump)+.001)));
}

function syncShotUI(time=engine?.time||0){
  currentShotIndex=shotIndexAtTime(time);const shot=sceneDoc.shots[currentShotIndex],env=sceneDoc.scene.environment;
  els.shotIndex.textContent=`샷 ${String(currentShotIndex+1).padStart(2,'0')}`;els.intentTitle.textContent=shot.title;els.intentCopy.textContent=shot.intent;els.shotIntent.textContent=shot.intent;
  els.lens.value=shot.camera.lens;els.movement.textContent=movementLabels[shot.camera.movement]||shot.camera.movement;els.environment.textContent=`${envLabels[env.type]||env.type} · ${env.time==='night'?'밤':'낮'}`;els.camera.textContent=`${shot.camera.lens}mm · ${movementLabels[shot.camera.movement]||shot.camera.movement}`;
  $$('.샷클립').forEach((el,i)=>el.classList.toggle('활성',i===currentShotIndex));
}
function updateTimeUI(time=0,playing=false){const d=sceneDoc.sequence.duration;els.timeline.max=String(d);els.timeline.value=String(time);els.timelineTime.textContent=formatTime(time);els.progressReadout.textContent=`${formatTime(time)} / ${formatTime(d)}`;els.play.textContent=playing?'Ⅱ':'▶';syncShotUI(time);}

async function loadScene(doc){const check=validateSceneDocument(doc);if(!check.ok){showToast(check.errors[0]);throw new Error(check.errors.join(' '));}sceneDoc=doc;await engine.loadDocument(sceneDoc);engine.onTime=(time,playing)=>updateTimeUI(time,playing);els.continuity.textContent=sceneDoc.scene.continuityKey;els.renderDuration.textContent=`${sceneDoc.sequence.duration.toFixed(1)}초`;els.json.textContent=JSON.stringify(sceneDoc,null,2);renderSceneTree();renderTracks();updateTimeUI(0,false);}

function selectedShot(){return sceneDoc.shots[currentShotIndex];}
function referenceManifest(){return {format:'previz-reference-pack',version:'1.2.0',sourcePrompt:sceneDoc.sourcePrompt,sequence:sceneDoc.sequence,continuityKey:sceneDoc.scene.continuityKey,environment:sceneDoc.scene.environment,actors:sceneDoc.actors.map(a=>({id:a.id,role:a.role,actions:a.actions})),shots:sceneDoc.shots.map((s,i)=>({id:s.id,title:s.title,start:s.start,end:s.end,lens:s.camera.lens,movement:s.camera.movement,referenceFrames:[['start',s.start],['mid',(s.start+s.end)/2],['end',Math.max(s.start,s.end-1/sceneDoc.sequence.fps)]].map(([role,time])=>({role,time,suggestedFilename:`previz-shot${String(i+1).padStart(2,'0')}-${role}.png`}))})),referenceIntent:'카메라 구도, 인물 동선, 움직임과 샷 연속성을 AI 영상 생성에 전달한다.'};}
async function captureRole(role){const shot=selectedShot(),t=role==='start'?shot.start:role==='mid'?(shot.start+shot.end)/2:Math.max(shot.start,shot.end-1/sceneDoc.sequence.fps);const blob=await engine.captureAtTime(t);if(!blob)return showToast('프레임 캡처 실패');downloadBlob(blob,`previz-shot${String(currentShotIndex+1).padStart(2,'0')}-${role}.png`);showToast(`${role} PNG를 저장했습니다.`);}

els.generate.addEventListener('click',async()=>{if(rendering)return;const prompt=els.prompt.value.trim();if(!prompt)return;els.generate.disabled=true;els.generate.querySelector('span').textContent='블로킹 중…';try{await loadScene(directPromptFallback(prompt));showToast('표현 가능한 동작과 카메라를 프리비즈로 만들었습니다.');}finally{els.generate.disabled=false;els.generate.querySelector('span').textContent='장면 만들기';}});
els.prompt.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')els.generate.click();});
els.play.addEventListener('click',()=>{if(engine.time>=sceneDoc.sequence.duration-.001)engine.seek(0);engine.setPlaying(!engine.playing);updateTimeUI(engine.time,engine.playing);});
els.reset.addEventListener('click',()=>engine.reset());
els.timeline.addEventListener('input',()=>engine.seek(Number(els.timeline.value)));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{$$('[data-view]').forEach(b=>b.classList.toggle('활성',b===button));engine.setViewMode(button.dataset.view);els.safeFrame.classList.toggle('렌더',button.dataset.view==='render');}));
els.lens.addEventListener('change',()=>{const next=cloneSceneDocument(sceneDoc),v=Math.max(18,Math.min(120,Number(els.lens.value)||35));next.shots[currentShotIndex].camera.lens=v;sceneDoc=next;engine.document=sceneDoc;engine.applyTime(engine.time);syncShotUI(engine.time);});
$('#ref-start').addEventListener('click',()=>captureRole('start'));$('#ref-mid').addEventListener('click',()=>captureRole('mid'));$('#ref-end').addEventListener('click',()=>captureRole('end'));$('#ref-manifest').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(referenceManifest(),null,2)],{type:'application/json'}),'previz-reference-pack-v1.2.0.json'));
els.showJson.addEventListener('click',()=>{els.json.textContent=JSON.stringify(sceneDoc,null,2);els.dialog.showModal();});els.closeJson.addEventListener('click',()=>els.dialog.close());els.dialog.addEventListener('click',e=>{if(e.target===els.dialog)els.dialog.close();});els.exportJson.addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(sceneDoc,null,2)],{type:'application/json'}),'previz-scene-v1.2.0.json'));

els.renderVideo.addEventListener('click',async()=>{if(rendering)return;rendering=true;els.renderVideo.disabled=true;engine.setPlaying(false);const priorView=engine.viewMode;engine.setViewMode('render');els.renderBar.style.width='0%';els.renderText.textContent='렌더 준비 중…';try{const result=await exportSequenceVideo(engine,sceneDoc,(p,label)=>{els.renderBar.style.width=`${Math.round(p*100)}%`;els.renderText.textContent=`${label} · ${Math.round(p*100)}%`;});const ext=result.format==='mp4'?'mp4':'webm';downloadBlob(result.blob,`previz-road-chase-20s-v1.2.0.${ext}`);els.renderText.textContent=`완료 · ${ext.toUpperCase()} · ${(result.blob.size/1024/1024).toFixed(1)} MB`;showToast(result.format==='mp4'?'20초 MP4 프리비즈를 저장했습니다.':'MP4 인코더가 없어 WebM으로 저장했습니다.',3500);}catch(error){console.error(error);els.renderText.textContent=`렌더 실패 · ${error.message||error}`;showToast('영상 렌더에 실패했습니다.',3000);}finally{engine.setViewMode(priorView);rendering=false;els.renderVideo.disabled=false;}});

engine=await initEngine();await loadScene(sceneDoc);window.__PREVIZ__={getScene:()=>sceneDoc,getEngine:()=>engine,loadPrompt:async p=>{els.prompt.value=p;await loadScene(directPromptFallback(p));},exportSequenceVideo:()=>exportSequenceVideo(engine,sceneDoc)};showToast('Previz Studio v1.2.0 · 20초 추격 시퀀스 준비 완료');
