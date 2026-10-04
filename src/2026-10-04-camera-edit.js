import { ensureManualCamera, cameraEditSnapshot } from './sequence.js';
const add=(p,d)=>p.map((v,i)=>v+d[i]);
// Mutates the shared scene document; automatic paths become endpoint-based manual paths.
export function translateShotCamera(doc,index,key,nextPosition){
  const manual=ensureManualCamera(doc,index);if(!manual)return null;
  const position=key==='end'?manual.end:manual.start;
  const delta=nextPosition.map((v,i)=>v-position[i]);
  manual.start=add(manual.start,delta);manual.end=add(manual.end,delta);
  return {type:'camera',shotIndex:index,scope:'wholeShot',delta};
}
export function translateShotTarget(doc,index,key,nextTarget){
  const manual=ensureManualCamera(doc,index);if(!manual)return null;
  const snap=cameraEditSnapshot(doc,index,key),base=manual.targetMode==='free'?(key==='end'?manual.targetEnd:manual.targetStart):snap.target,delta=nextTarget.map((v,i)=>v-base[i]);
  if(manual.targetMode==='free'){manual.targetStart=add(manual.targetStart,delta);manual.targetEnd=add(manual.targetEnd,delta);}
  else manual.targetOffset=add(manual.targetOffset||[0,0,0],delta);
  return {type:'camera',shotIndex:index,scope:'wholeShot',delta};
}
export function copyCameraToShot(doc,index,camera){
  const manual=ensureManualCamera(doc,index);if(!manual)return null;
  manual.start=[...camera.position];manual.end=[...camera.position];manual.targetStart=[...camera.target];manual.targetEnd=[...camera.target];manual.targetMode='free';manual.targetOffset=[0,0,0];
  doc.shots[index].camera.lens=camera.lens;
  return {type:'camera',shotIndex:index,scope:'wholeShot',source:'director'};
}
