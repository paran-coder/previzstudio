import { SCENE_VERSION, CAMERA_MOVES, ENVIRONMENTS, validateSceneDocument } from './scene-schema.js';
const copy=x=>structuredClone(x);
const vec=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<=50)&&v[1]===0;
const segment=(type,start,end,from,to,rotationY)=>({type,start,end,from:[...from],to:[...to],rotationFrom:rotationY,rotationTo:rotationY});

/** Deterministic blocking from explicit controls. No language-model or text inference. */
export function createBlockingScene(options={}){
 const {setting='storefront',duration=8,roles=['남자','여자'],mover=1,target=0,motion='approach',prop='umbrella',holder=0,camera='static',atmosphere='',startTime=1,arrivalTime=duration*.75}=options;
 if(!ENVIRONMENTS.includes(setting)||!Number.isFinite(duration)||duration<4||duration>60)throw Error('장소 또는 길이를 확인해주세요.');
 if(!Array.isArray(roles)||roles.length<1||roles.length>4||roles.some(r=>typeof r!=='string'||!r.trim()||r.length>40))throw Error('배우 역할은 1~4명, 각각 1~40자입니다.');
 if(!['idle','approach','walk','run'].includes(motion)||!CAMERA_MOVES.includes(camera)||!['none','umbrella','knife'].includes(prop))throw Error('지원하지 않는 구성입니다.');
 const validIndex=n=>Number.isInteger(n)&&n>=0&&n<roles.length;
 if(motion!=='idle'&&!validIndex(mover))throw Error('이동 배우를 선택해주세요.');
 if(motion==='approach'&&(!validIndex(target)||target===mover))throw Error('접근 대상은 다른 배우여야 합니다.');
 if(prop!=='none'&&!validIndex(holder))throw Error('소품을 들 배우를 선택해주세요.');
 if(typeof atmosphere!=='string'||atmosphere.length>4000)throw Error('분위기 설명은 4000자 이내로 입력해주세요.');
 if(motion!=='idle'&&(!Number.isFinite(startTime)||!Number.isFinite(arrivalTime)||startTime<0||arrivalTime<=startTime||arrivalTime>=duration))throw Error('이동 시작 < 도착 < 전체 길이가 되도록 설정해주세요.');
 const positions=roles.map((_,i)=>[(i-(roles.length-1)/2)*2.4,0,0]);
 if(motion==='approach'){positions[target]=[-1.2,0,0];positions[mover]=[5.2,0,2];positions.forEach((v,i)=>{if(i!==target&&i!==mover)v[2]=-2.5;});}
 const actors=roles.map((role,i)=>({id:`actor_${String(i+1).padStart(2,'0')}`,role:role.trim(),assetId:'actor_neutral',position:positions[i],rotationY:0,actions:[]}));
 for(let i=0;i<actors.length;i++){
  const a=actors[i],from=a.position;
  if(i!==mover||motion==='idle'){a.rotationY=motion==='approach'&&i===target?Math.atan2(positions[mover][0]-from[0],positions[mover][2]-from[2]):0;a.actions=[segment('idle',0,duration,from,from,a.rotationY)];continue;}
  const to=motion==='approach'?[positions[target][0]+2.4,0,positions[target][2]]:[from[0],0,from[2]-5];
  a.rotationY=Math.atan2(to[0]-from[0],to[2]-from[2]);
  a.actions=[...(startTime>0?[segment('idle',0,startTime,from,from,a.rotationY)]:[]),segment(motion==='run'?'run':'walk',startTime,arrivalTime,from,to,a.rotationY),{...segment('stop',arrivalTime,duration,to,to,a.rotationY),rotationTo:motion==='approach'?-Math.PI/2:a.rotationY}];
 }
 const center=[1,1.2,0],camStart=[1,3,12];
 const doc={version:SCENE_VERSION,sourcePrompt:'구조화된 선택 입력',supplementaryPrompt:atmosphere.trim(),sequence:{duration,fps:30,width:1920,height:1080},scene:{id:'blocking_scene',continuityKey:`${setting}:blocking:v1.5.0`,environment:{type:setting,time:'day',weather:'clear',assetId:setting+'_procedural'}},actors,
 props:prop==='none'?[]:[{id:prop+'_01',type:prop,assetId:prop+'_blockout',actorId:actors[holder].id,hand:'right',position:[0,-.7,0],rotationY:0}],
 lights:[{id:'key_01',type:'directional',intensity:2.8,position:[-8,12,6]}],shots:[{id:'shot_01',title:'동선 레퍼런스',intent:'인물의 위치와 행동 순서를 전달합니다.',start:0,end:duration,camera:{movement:camera,archetype:'free',lens:28,distance:12,start:camStart,end:camera==='dolly_in'?[1,3,9]:camera==='dolly_out'?[1,3,15]:[...camStart],target:center,handheldAmount:0}}],
 interpretation:{mode:'structured',summary:`${actors.length}명 · ${motion} · ${prop} · ${camera}`,assumptions:['배경은 공간 관계를 보여주는 단순 구조물입니다.','날씨·조명 분위기는 영상 생성용 보조 설명에 보관합니다.'],warnings:[]}};
 const result=validateSceneDocument(doc);if(!result.ok)throw Error(result.errors.join(' '));return doc;
}

/** Adjust one segment while keeping neighboring segment boundaries connected. */
export function editActionPath(doc,actorId,index,patch){
 const next=copy(doc),actor=next.actors.find(a=>a.id===actorId),action=actor?.actions[index];
 if(!action)throw Error('수정할 동작이 없습니다.');
 for(const key of Object.keys(patch))if(!['start','end','from','to'].includes(key))throw Error('지원하지 않는 동작 수정입니다.');
 Object.assign(action,copy(patch));
 if(!vec(action.from)||!vec(action.to)||!Number.isFinite(action.start)||!Number.isFinite(action.end)||action.start<0||action.end<=action.start||action.end>next.sequence.duration)throw Error('경로 좌표 또는 시간을 확인해주세요.');
 if(['idle','stop','turn'].includes(action.type)&&action.from.some((v,i)=>Math.abs(v-action.to[i])>1e-9))throw Error('대기·멈춤·회전 구간의 출발과 도착 위치는 같아야 합니다.');
 const prev=actor.actions[index-1],after=actor.actions[index+1];
 if(prev){if(action.start<=prev.start)throw Error('앞 동작의 길이가 필요합니다.');prev.end=action.start;prev.to=[...action.from];if(['idle','stop'].includes(prev.type))prev.from=[...action.from];}
 else if(action.start!==0)throw Error('첫 동작은 0초에 시작해야 합니다.');
 if(after){if(action.end>=after.end)throw Error('뒤 동작의 길이가 필요합니다.');after.start=action.end;after.from=[...action.to];if(['idle','stop'].includes(after.type))after.to=[...action.to];}
 else if(action.end!==next.sequence.duration)throw Error('마지막 동작은 장면 끝까지 이어져야 합니다.');
 if(['walk','run','chase'].includes(action.type)){action.rotationFrom=action.rotationTo=Math.atan2(action.to[0]-action.from[0],action.to[2]-action.from[2]);if(prev)prev.rotationTo=action.rotationFrom;if(after)after.rotationFrom=action.rotationTo;}
 actor.position=[...actor.actions[0].from];actor.rotationY=actor.actions[0].rotationFrom||0;
 const result=validateSceneDocument(next);if(!result.ok)throw Error(result.errors.join(' '));return next;
}


