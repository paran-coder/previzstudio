export const VERSION='1.0.0';
// Keep the v1 JSON format stable while the application receives patch releases.
export const APP_VERSION='1.0.1';
export const POSE_LIMITS={position:[-1000,1000],rotation:[-1000,1000],scale:[.01,100]};
export const clone=v=>JSON.parse(JSON.stringify(v));
export function constrainPose(pose,fallback){
 return Object.fromEntries(Object.entries(POSE_LIMITS).map(([field,[min,max]])=>[field,
  fallback[field].map((previous,i)=>{const value=pose[field]?.[i];return Number.isFinite(value)?Math.max(min,Math.min(max,value)):previous;})
 ]));
}
export function duplicateObject(source){
 const copy=clone(source);copy.id=crypto.randomUUID();copy.name=(copy.name+' 복사').slice(0,80);
 // Use one offset for the entire animation; clamping keys individually distorts motion.
 const poses=[copy,...copy.keys];const offset=Math.min(1,POSE_LIMITS.position[1]-Math.max(...poses.map(p=>p.position[0])));
 for(const pose of poses)pose.position[0]+=offset;
 return copy;
}
export function object(kind,name,position=[0,0,0],color='#d7bda1',scale=[1,1,1]){return {id:crypto.randomUUID(),kind,name,position:[...position],rotation:[0,0,0],scale:[...scale],color,keys:[]};}
export function lookRotation(position,target=[0,1,0]){const [x,y,z]=target.map((v,i)=>v-position[i]);return [Math.atan2(y,Math.hypot(x,z))||0,Math.atan2(-x,-z)||0,0];}
export function makePreset(name='dialogue'){
 const p={version:VERSION,name:({dialogue:'A quiet conversation',product:'The hero product',walk:'Across the frame',blank:'Untitled scene'})[name]||'Untitled scene',duration:6,aspect:'16:9',background:'#252b32',ground:'#646c70',light:3,fov:45,objects:[],camera:object('camera','Camera 01',[5,3.2,7],'#c4f283')};
 if(name==='dialogue'){
  p.objects=[object('person','인물 A',[-1.15,0,0],'#dfb99b'),object('person','인물 B',[1.15,0,0],'#aabbb0'),object('box','벤치',[0,0.25,-1.5],'#82756b',[3,.5,.55]),object('cylinder','플랜터',[-3,.45,-1.8],'#667f6d',[.6,.9,.6])];p.objects[0].rotation[1]=Math.PI/3;p.objects[1].rotation[1]=-Math.PI/3;
 }else if(name==='product'){
  p.objects=[object('cylinder','제품',[0,1.45,0],'#e0b995',[.7,1.3,.7]),object('cylinder','디스플레이 받침',[0,.4,0],'#949f91',[2,.8,2]),object('sphere','배경 오브젝트',[-2,.6,-1],'#b5b7ca',[1.2,1.2,1.2])];p.camera.position=[4,2.8,6];
 }else if(name==='walk'){
  const actor=object('person','이동하는 인물',[-3,0,0],'#dfb99b');actor.rotation[1]=Math.PI/2;putKey(actor,0,actor);putKey(actor,6,{...actor,position:[3,0,0]});p.objects=[actor,object('box','배경 벽',[0,1,-2],'#7c8983',[8,2,.3])];p.camera.position=[0,2.6,9];
 }
 p.camera.rotation=lookRotation(p.camera.position);return p;
}
export function sample(o,time){
 const keys=o.keys||[];const pose=k=>({position:[...k.position],rotation:[...k.rotation],scale:[...k.scale]});
 if(!keys.length)return pose(o);if(time<=keys[0].time)return pose(keys[0]);if(time>=keys.at(-1).time)return pose(keys.at(-1));
 const b=keys.findIndex(k=>k.time>time),a=keys[b-1],z=keys[b],f=(time-a.time)/(z.time-a.time);
 const out={};for(const field of ['position','rotation','scale'])out[field]=a[field].map((v,i)=>{let d=z[field][i]-v;if(field==='rotation')d=Math.atan2(Math.sin(d),Math.cos(d));return v+d*f;});return out;
}
export function keyIndexAt(o,time){
 let index=-1,distance=1/60+1e-9;
 for(let i=0;i<o.keys.length;i++){const delta=Math.abs(o.keys[i].time-time);if(delta<distance){index=i;distance=delta;}}
 return index;
}
export function putKey(o,time,transform){
 const index=keyIndexAt(o,time);
 // Duration changes can put multiple keys inside one frame. Preserve neighboring keys
 // and the matched key's precise timestamp instead of deleting an entire time window.
 const k={time:index<0?Math.round(time*30)/30:o.keys[index].time,...constrainPose(transform,o)};
 if(index<0)o.keys.push(k);else o.keys[index]=k;
 o.keys.sort((a,b)=>a.time-b.time);
}
export function cameraMotion(p,motion){
 const c=p.camera;c.keys=[];const base=clone(c.position);const target=[0,1,0];
 if(motion==='orbit'){const r=Math.max(3,Math.hypot(base[0],base[2])),start=Math.atan2(base[0],base[2]);for(let i=0;i<=12;i++){const a=start+(i/12)*Math.PI*.85;const pos=[Math.sin(a)*r,base[1],Math.cos(a)*r];putKey(c,p.duration*i/12,{...c,position:pos,rotation:lookRotation(pos,target)});}}
 else{putKey(c,0,c);if(motion!=='static'){const pos=motion==='truck'?base.map((v,i)=>i===0?v+3:v):base.map((v,i)=>v+(target[i]-v)*.4);putKey(c,p.duration,{...c,position:pos,rotation:lookRotation(pos,target)});}}
}
export function validateProject(p){
 const fail=()=>{throw new Error('올바른 Previz Studio v1 프로젝트 파일이 아닙니다.');};
 const num=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const vec=(v,min,max)=>Array.isArray(v)&&v.length===3&&v.every(x=>num(x,min,max));
 const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 const pose=o=>o&&Object.entries(POSE_LIMITS).every(([field,[min,max]])=>vec(o[field],min,max));
 if(!p||p.version!==VERSION||typeof p.name!=='string'||p.name.length>120||!num(p.duration,1,30)||!['16:9','9:16','1:1'].includes(p.aspect)||!color(p.background)||!color(p.ground)||!num(p.light,0,10)||!num(p.fov,15,100)||!Array.isArray(p.objects)||p.objects.length>80)fail();
 const ids=new Set();for(const [index,o] of [p.camera,...p.objects].entries()){
  if(!pose(o)||typeof o.id!=='string'||o.id.length>100||ids.has(o.id)||typeof o.name!=='string'||o.name.length>80||!color(o.color)||!Array.isArray(o.keys)||o.keys.length>1000||(index===0?o.kind!=='camera':!['person','box','sphere','cylinder'].includes(o.kind)))fail();
  ids.add(o.id);let last=-1;for(const k of o.keys){if(!pose(k)||!num(k.time,0,p.duration)||k.time<=last)fail();last=k.time;}
 }
 return clone(p);
}
