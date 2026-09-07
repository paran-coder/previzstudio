import { evaluateActorAtTime, evaluateCameraAtTime } from './sequence.js';

const THREE_VERSION = '0.185.1';
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));

export async function createThreeSceneEngine(container) {
  const THREE = await import('three');
  return new ThreeSceneEngine(container, THREE);
}

function makeTextSprite(T, text, color='#dfe7ee') {
  const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=128;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,512,128); ctx.font='600 42px ui-monospace, monospace';
  ctx.fillStyle='rgba(4,7,10,.72)'; ctx.fillRect(8,24,496,72); ctx.fillStyle=color; ctx.fillText(text,24,74);
  const texture=new T.CanvasTexture(canvas); texture.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false})); sprite.scale.set(2.8,.7,1); return sprite;
}

export class ThreeSceneEngine {
  constructor(container, T) {
    this.THREE=T; this.container=container; this.document=null; this.time=0; this.playing=false; this.viewMode='edit'; this.onTime=null;
    this.actorRigs=new Map(); this.lastTime=performance.now(); this.exportState=null;
    this.scene=new T.Scene(); this.scene.background=new T.Color(0x070a0e); this.scene.fog=new T.Fog(0x070a0e,24,80);
    this.world=new T.Group(); this.guides=new T.Group(); this.scene.add(this.world,this.guides);
    this.directorCamera=new T.PerspectiveCamera(43,1,.05,180); this.shotCamera=new T.PerspectiveCamera(50,1,.05,180);
    this.directorTarget=new T.Vector3(0,1.1,2); this.orbitYaw=.6; this.orbitPitch=.34; this.orbitRadius=22;
    this.dragging=false; this.dragStart=null;
    this.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    this.renderer.setClearColor(0x070a0e,1); this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.outputColorSpace=T.SRGBColorSpace; this.renderer.toneMapping=T.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.15;
    this.renderer.domElement.className='three-canvas'; this.renderer.domElement.setAttribute('aria-label','3D 프리비즈 렌더러');
    container.replaceChildren(this.renderer.domElement);
    this.bindControls(); this.resizeObserver=new ResizeObserver(()=>this.resize()); this.resizeObserver.observe(container); this.resize();
    this.renderer.setAnimationLoop((time)=>this.loop(time));
  }
  get rendererLabel(){return `Three.js r${THREE_VERSION.replace('0.','')} · WebGL2`;}
  get canvas(){return this.renderer.domElement;}

  bindControls(){
    const c=this.canvas;
    c.addEventListener('pointerdown',e=>{if(this.viewMode!=='edit')return;this.dragging=true;this.dragStart={x:e.clientX,y:e.clientY,yaw:this.orbitYaw,pitch:this.orbitPitch};c.setPointerCapture?.(e.pointerId)});
    c.addEventListener('pointermove',e=>{if(!this.dragging||!this.dragStart)return;this.orbitYaw=this.dragStart.yaw-(e.clientX-this.dragStart.x)*.006;this.orbitPitch=clamp(this.dragStart.pitch+(e.clientY-this.dragStart.y)*.004,.08,1.05)});
    const stop=()=>{this.dragging=false;this.dragStart=null}; c.addEventListener('pointerup',stop);c.addEventListener('pointercancel',stop);
    c.addEventListener('wheel',e=>{if(this.viewMode!=='edit')return;e.preventDefault();this.orbitRadius=clamp(this.orbitRadius+Math.sign(e.deltaY)*1,8,42)},{passive:false});
  }
  resize(){ if(this.exportState)return; const w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight); this.renderer.setSize(w,h,false); this.updateAspect(w,h); }
  updateAspect(w,h){ for(const cam of [this.directorCamera,this.shotCamera]){cam.aspect=w/h;cam.updateProjectionMatrix();} }
  disposeObject(obj){obj.geometry?.dispose?.();const m=obj.material;if(Array.isArray(m))m.forEach(x=>x.dispose?.());else m?.dispose?.();obj.material?.map?.dispose?.();}
  clearWorld(){for(const g of [this.world,this.guides]){g.traverse(o=>this.disposeObject(o));g.clear();}this.actorRigs.clear();}
  mat(color,rough=.72,metal=.05){return new this.THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
  addBox(size,pos,color,parent=this.world){const T=this.THREE,m=new T.Mesh(new T.BoxGeometry(...size),this.mat(color));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

  createMannequin(index){
    const T=this.THREE, root=new T.Group(); root.name=`actor-rig-${index}`;
    const bodyColor=index===0?0xc9d0d7:0x9ea8b1, jointColor=0x6f7a84, skin=0xd2d7dc;
    const bodyMat=this.mat(bodyColor,.82), jointMat=this.mat(jointColor,.9), skinMat=this.mat(skin,.88);
    const pelvis=new T.Mesh(new T.BoxGeometry(.5,.28,.32),jointMat); pelvis.position.y=1.0; root.add(pelvis);
    const torsoPivot=new T.Group(); torsoPivot.position.y=1.08; root.add(torsoPivot);
    const torso=new T.Mesh(new T.BoxGeometry(.72,.86,.36),bodyMat); torso.position.y=.42; torso.castShadow=true; torsoPivot.add(torso);
    const neck=new T.Mesh(new T.CylinderGeometry(.11,.11,.16,10),jointMat);neck.position.y=.95;torsoPivot.add(neck);
    const head=new T.Mesh(new T.SphereGeometry(.28,18,14),skinMat);head.position.y=1.18;head.scale.y=1.08;head.castShadow=true;torsoPivot.add(head);
    const limbs={};
    const makeLimb=(name,x,y,isArm)=>{const pivot=new T.Group();pivot.position.set(x,y,0);root.add(pivot);const len=isArm?.82:.98;const mesh=new T.Mesh(new T.CylinderGeometry(isArm?.095:.12,isArm?.085:.105,len,10),bodyMat);mesh.position.y=-len/2;mesh.castShadow=true;pivot.add(mesh);const end=new T.Mesh(new T.SphereGeometry(isArm?.105:.13,10,8),skinMat);end.position.y=-len;end.castShadow=true;pivot.add(end);limbs[name]=pivot;};
    makeLimb('armL',-.47,1.78,true);makeLimb('armR',.47,1.78,true);makeLimb('legL',-.19,.94,false);makeLimb('legR',.19,.94,false);
    const label=makeTextSprite(T,`ACTOR_${String(index+1).padStart(2,'0')}`,index===0?'#dce7f0':'#aebac4');label.position.set(0,2.85,0);this.guides.add(label);label.userData.actorIndex=index;
    return {root,torsoPivot,...limbs,label};
  }

  buildRoad(){
    const T=this.THREE;
    this.addBox([10,.18,72],[0,-.09,4],0x20252a); this.addBox([3,.24,72],[-6.5,.02,4],0x343a40); this.addBox([3,.24,72],[6.5,.02,4],0x343a40);
    for(let z=-28;z<36;z+=5){this.addBox([.16,.012,2.2],[0,.015,z],0xcac7b7);}
    for(const x of [-9.2,9.2]) for(let z=-28;z<=32;z+=12){this.addBox([4.5,7+((z+28)/12)%3,9],[x,3.5,z],x<0?0x1b2026:0x20252b);const pole=this.addBox([.12,4.8,.12],[x<0?-4.8:4.8,2.4,z],0x39414a);const light=new T.PointLight(0xffc37e,20,15,2);light.position.set(x<0?-4.8:4.8,4.7,z);this.world.add(light);}
    const roadGloss=new T.Mesh(new T.PlaneGeometry(10,72),new T.MeshStandardMaterial({color:0x171b1f,roughness:.28,metalness:.08}));roadGloss.rotation.x=-Math.PI/2;roadGloss.position.set(0,.015,4);roadGloss.receiveShadow=true;this.world.add(roadGloss);
  }
  buildGeneric(env){
    this.addBox([22,.2,32],[0,-.1,0],0x252b31);
    if(env==='warehouse'){this.addBox([22,8,.35],[0,4,-13],0x1d2228);for(const x of [-8,-4,4,8])this.addBox([.35,7,.35],[x,3.5,-5],0x3a424a);}
    else if(env==='corridor'){this.addBox([.3,6,36],[-4.5,3,4],0x242a30);this.addBox([.3,6,36],[4.5,3,4],0x242a30);this.addBox([9,.2,36],[0,6,4],0x1d2228);}
    else {this.addBox([5,8,28],[-7,4,2],0x20262c);this.addBox([5,9,28],[7,4.5,2],0x1c2228);}
  }
  createCar(index,pos,rot){
    const T=this.THREE,g=new T.Group(),col=index%2?0x48515a:0x38424b;const body=new T.Mesh(new T.BoxGeometry(3.7,.72,1.7),this.mat(col,.45,.18));body.position.y=.65;body.castShadow=true;g.add(body);const cabin=new T.Mesh(new T.BoxGeometry(1.9,.58,1.5),this.mat(0x28313a,.32,.12));cabin.position.set(.15,1.18,0);cabin.castShadow=true;g.add(cabin);for(const x of [-1.25,1.25])for(const z of [-.82,.82]){const w=new T.Mesh(new T.CylinderGeometry(.32,.32,.2,14),this.mat(0x111416,.95));w.rotation.x=Math.PI/2;w.position.set(x,.35,z);g.add(w);}g.position.set(...pos);g.rotation.y=rot;this.world.add(g);return g;
  }

  async loadDocument(doc){this.document=doc;this.time=0;this.playing=false;this.clearWorld();this.buildWorld();this.buildGuides();this.applyTime(0);}
  buildWorld(){
    const T=this.THREE,env=this.document.scene.environment;this.scene.background=new T.Color(env.time==='night'?0x06090d:0x8d9aa7);this.scene.fog=new T.Fog(env.time==='night'?0x06090d:0x8d9aa7,28,88);
    const hemi=new T.HemisphereLight(env.time==='night'?0x7f9abd:0xdbe8f5,0x18130f,env.time==='night'?.55:1.6);this.world.add(hemi);
    const moon=new T.DirectionalLight(env.time==='night'?0xc9dcff:0xffffff,env.time==='night'?2.1:2.8);moon.position.set(-8,12,-6);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-24;moon.shadow.camera.right=24;moon.shadow.camera.top=24;moon.shadow.camera.bottom=-24;this.world.add(moon);
    if(env.type==='road')this.buildRoad();else this.buildGeneric(env.type);
    this.document.props.forEach((p,i)=>{if(p.type==='car')this.createCar(i,p.position,p.rotationY);else this.addBox([2,1.2,1.6],[p.position[0],.6,p.position[2]],0x4b535a);});
    this.document.actors.forEach((actor,i)=>{const rig=this.createMannequin(i);rig.root.position.set(...actor.position);rig.root.rotation.y=actor.rotationY;this.world.add(rig.root);this.actorRigs.set(actor.id,rig);});
  }
  buildGuides(){
    const T=this.THREE;const grid=new T.GridHelper(70,70,0x64717e,0x2b3239);grid.material.opacity=.25;grid.material.transparent=true;grid.position.y=.025;this.guides.add(grid);
    for(const actor of this.document.actors){const pts=[];for(const a of actor.actions){if(a.from)pts.push(new T.Vector3(...a.from));if(a.to)pts.push(new T.Vector3(...a.to));}if(pts.length>1){const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineDashedMaterial({color:actor.id==='actor_01'?0x62c4ff:0xffb665,dashSize:.5,gapSize:.28,transparent:true,opacity:.72}));line.computeLineDistances();this.guides.add(line);}}
    for(const shot of this.document.shots){const pts=[];for(let i=0;i<=18;i++){const tm=shot.start+(shot.end-shot.start)*(i/18);const c=evaluateCameraAtTime(this.document,tm);pts.push(new T.Vector3(...c.position));}const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineDashedMaterial({color:0xc6ff4a,dashSize:.45,gapSize:.25,transparent:true,opacity:.62}));line.computeLineDistances();this.guides.add(line);}
  }
  updateLabels(){this.guides.children.filter(o=>o.isSprite&&Number.isInteger(o.userData.actorIndex)).forEach(sprite=>{const actor=this.document.actors[sprite.userData.actorIndex],state=evaluateActorAtTime(this.document,actor,this.time);sprite.position.set(state.position[0],state.position[1]+2.85,state.position[2]);});}
  applyActorPose(actor,state){const rig=this.actorRigs.get(actor.id);if(!rig)return;rig.root.position.set(state.position[0],state.position[1]+state.bob,state.position[2]);rig.root.rotation.y=state.rotationY;rig.torsoPivot.rotation.x=-state.lean;rig.legL.rotation.x=state.stride;rig.legR.rotation.x=-state.stride;rig.armL.rotation.x=-state.stride*.75;rig.armR.rotation.x=state.stride*.75;}
  applyTime(time){if(!this.document)return;this.time=clamp(time,0,this.document.sequence.duration);for(const actor of this.document.actors)this.applyActorPose(actor,evaluateActorAtTime(this.document,actor,this.time));this.updateLabels();const c=evaluateCameraAtTime(this.document,this.time);this.shotCamera.position.set(...c.position);this.shotCamera.lookAt(new this.THREE.Vector3(...c.target));this.shotCamera.fov=2*Math.atan(36/(2*c.lens))*180/Math.PI;this.shotCamera.updateProjectionMatrix();this.activeShot=c.shot;return c;}
  updateDirectorCamera(){const cp=Math.cos(this.orbitPitch);this.directorCamera.position.set(this.directorTarget.x+Math.sin(this.orbitYaw)*cp*this.orbitRadius,this.directorTarget.y+Math.sin(this.orbitPitch)*this.orbitRadius,this.directorTarget.z+Math.cos(this.orbitYaw)*cp*this.orbitRadius);this.directorCamera.lookAt(this.directorTarget);}
  setViewMode(mode){this.viewMode=mode==='render'?'render':'edit';this.guides.visible=this.viewMode==='edit';}
  setPlaying(v){this.playing=Boolean(v);}
  seek(t){this.playing=false;this.applyTime(t);this.onTime?.(this.time,false,this.activeShot);}
  selectShot(index){const shot=this.document?.shots?.[index];if(shot)this.seek(shot.start+.001);}
  reset(){this.seek(0);}
  loop(now){const dt=Math.min((now-this.lastTime)/1000,.08);this.lastTime=now;if(this.playing&&this.document){let next=this.time+dt;if(next>=this.document.sequence.duration){next=this.document.sequence.duration;this.playing=false;}this.applyTime(next);this.onTime?.(this.time,this.playing,this.activeShot);}this.updateDirectorCamera();this.renderer.render(this.scene,this.viewMode==='render'?this.shotCamera:this.directorCamera);}
  async captureAtTime(time){const oldMode=this.viewMode,oldTime=this.time;this.setViewMode('render');this.applyTime(time);this.renderer.render(this.scene,this.shotCamera);const blob=await new Promise(r=>this.canvas.toBlob(r,'image/png'));this.setViewMode(oldMode);this.applyTime(oldTime);return blob;}
  beginExport(width,height){if(this.exportState)return;this.exportState={width:this.container.clientWidth,height:this.container.clientHeight,pixelRatio:this.renderer.getPixelRatio(),mode:this.viewMode,time:this.time,playing:this.playing};this.playing=false;this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false);this.updateAspect(width,height);this.setViewMode('render');}
  renderExportFrame(time){this.applyTime(time);this.renderer.render(this.scene,this.shotCamera);}
  endExport(){if(!this.exportState)return;const s=this.exportState;this.renderer.setPixelRatio(s.pixelRatio);this.renderer.setSize(Math.max(1,s.width),Math.max(1,s.height),false);this.updateAspect(Math.max(1,s.width),Math.max(1,s.height));this.setViewMode(s.mode);this.applyTime(s.time);this.playing=s.playing;this.exportState=null;}
  dispose(){this.renderer.setAnimationLoop(null);this.resizeObserver.disconnect();this.clearWorld();this.renderer.dispose();}
}
