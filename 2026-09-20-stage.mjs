import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {sample} from './2026-09-20-model.mjs';

export class Stage{
 constructor(container,{onSelect,onTransform,onDragStart,onDragEnd}){
  this.container=container;this.items=new Map();this.cameraMode=false;this.showGrid=true;this.project=null;this.time=0;this.selected=null;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#252b32');
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;container.prepend(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','3D 장면 편집 화면');
  this.editor=new THREE.PerspectiveCamera(45,1,.1,200);this.editor.position.set(5.5,3.6,7);this.editor.rotation.order='YXZ';
  this.camera=new THREE.PerspectiveCamera(45,16/9,.1,200);this.camera.rotation.order='YXZ';
  this.orbit=new OrbitControls(this.editor,this.renderer.domElement);this.orbit.target.set(0,1,0);this.orbit.enableDamping=true;this.orbit.maxDistance=70;this.orbit.minDistance=.3;this.orbit.maxPolarAngle=Math.PI*.49;
  this.ambient=new THREE.HemisphereLight('#dfecff','#4b4640',2.1);this.scene.add(this.ambient);
  this.sun=new THREE.DirectionalLight('#fff0dc',3);this.sun.position.set(3,8,4);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:40});this.sun.shadow.normalBias=.03;this.scene.add(this.sun);
  const rim=new THREE.DirectionalLight('#a8c9e7',1.4);rim.position.set(-5,4,-4);this.scene.add(rim);
  this.floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#646c70',roughness:1}));this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-.014;this.floor.receiveShadow=true;this.scene.add(this.floor);
  this.grid=new THREE.GridHelper(30,30,'#8a979a','#738084');this.grid.position.y=.002;this.grid.material.opacity=.25;this.grid.material.transparent=true;this.scene.add(this.grid);
  this.helperCamera=this.camera.clone();this.helperCamera.far=2;this.helperCamera.updateProjectionMatrix();this.cameraHelper=new THREE.CameraHelper(this.helperCamera);this.scene.add(this.cameraHelper);
  this.transform=new TransformControls(this.editor,this.renderer.domElement);this.transform.setSize(.78);this.transformHelper=this.transform.getHelper();this.scene.add(this.transformHelper);
  this.transform.addEventListener('dragging-changed',e=>{this.orbit.enabled=!e.value&&!this.cameraMode;if(e.value)onDragStart();else onDragEnd();});
  this.transform.addEventListener('objectChange',()=>{const o=this.transform.object;if(o)onTransform({position:o.position.toArray(),rotation:[o.rotation.x,o.rotation.y,o.rotation.z],scale:o.scale.toArray()});});
  this.box=new THREE.BoxHelper(new THREE.Object3D(),'#c1ef87');this.box.visible=false;this.scene.add(this.box);
  const ray=new THREE.Raycaster();const mouse=new THREE.Vector2();let start;
  this.renderer.domElement.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];});
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!start||e.button!==0||this.transform.dragging||this.transform.axis||Math.hypot(e.clientX-start[0],e.clientY-start[1])>4||this.locked)return;const r=this.renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,this.cameraMode?this.camera:this.editor);const hit=ray.intersectObjects([...this.items.values()],true)[0];if(hit){let o=hit.object;while(o&&!o.userData.id)o=o.parent;if(o)onSelect(o.userData.id);}});
  new ResizeObserver(()=>this.resize()).observe(container);this.resize();
 }
 mesh(kind,color){
  const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.04});
  const part=(geo,x,y,z,rx=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,0,rz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
  if(kind==='person'){
   part(new THREE.SphereGeometry(.145,24,20),0,1.68,0);part(new THREE.CylinderGeometry(.055,.065,.1,16),0,1.49,0);
   part(new THREE.CapsuleGeometry(.17,.27,6,20),0,1.23,0).scale.set(1.35,1,.7);
   part(new THREE.SphereGeometry(.18,20,14),0,.93,0).scale.set(1.2,.7,.75);
   for(const side of [-1,1]){part(new THREE.SphereGeometry(.085,16,12),side*.235,1.36,0);part(new THREE.CapsuleGeometry(.063,.25,4,12),side*.285,1.17,0,0,side*.16);part(new THREE.CapsuleGeometry(.053,.22,4,12),side*.33,.85,.035,0,side*.09);part(new THREE.SphereGeometry(.062,12,12),side*.345,.66,.04).scale.set(.8,1.3,.7);part(new THREE.CapsuleGeometry(.086,.3,4,16),side*.112,.67,0);part(new THREE.SphereGeometry(.075,14,12),side*.112,.43,.005);part(new THREE.CapsuleGeometry(.065,.27,4,16),side*.112,.235,0);part(new THREE.BoxGeometry(.13,.09,.25),side*.112,.045,.06);}
   const face=new THREE.Mesh(new THREE.SphereGeometry(.012,8,8),new THREE.MeshStandardMaterial({color:'#514b43'}));face.position.set(0,1.69,.141);group.add(face);
  }else if(kind==='sphere')part(new THREE.SphereGeometry(.5,32,24),0,0,0);else if(kind==='cylinder')part(new THREE.CylinderGeometry(.5,.5,1,48),0,0,0);else part(new THREE.BoxGeometry(1,1,1),0,0,0);
  group.rotation.order='YXZ';return group;
 }
 rebuild(project,time=0){
  this.transform.detach();this.box.visible=false;
  for(const item of this.items.values()){this.scene.remove(item);item.traverse(n=>{n.geometry?.dispose();if(n.material)n.material.dispose();});}this.items.clear();this.project=project;
  for(const o of project.objects){const m=this.mesh(o.kind,o.color);m.userData.id=o.id;this.items.set(o.id,m);this.scene.add(m);}this.update(project,time);this.select(this.selected);
 }
 update(project,time){
  this.project=project;this.time=time;this.scene.background.set(project.background);this.floor.material.color.set(project.ground);this.sun.intensity=project.light;this.camera.fov=project.fov;
  const aspect=this.ratio(),aspectChanged=this.camera.aspect!==aspect;this.camera.aspect=aspect;this.camera.updateProjectionMatrix();
  if(aspectChanged)this.resize();
  for(const o of [project.camera,...project.objects]){const item=o.kind==='camera'?this.camera:this.items.get(o.id);if(!item)continue;const pose=sample(o,time);item.position.fromArray(pose.position);item.rotation.set(...pose.rotation,'YXZ');item.scale.fromArray(pose.scale);if(o.kind!=='camera')item.traverse(n=>{if(n.material&&n.geometry?.type!=='SphereGeometry'||n.material&&n.geometry?.parameters?.radius!==.012)n.material?.color?.set(o.color);});}
  this.camera.updateMatrixWorld();this.helperCamera.copy(this.camera);this.helperCamera.far=2;this.helperCamera.updateProjectionMatrix();this.helperCamera.updateMatrixWorld();this.cameraHelper.update();if(this.selected&&this.items.has(this.selected))this.box.setFromObject(this.items.get(this.selected));
 }
 ratio(){return this.project?this.project.aspect.split(':').reduce((a,b)=>a/b):16/9;}
 select(id){this.selected=id;const item=id===this.project?.camera.id?this.camera:this.items.get(id);this.transform.detach();if(item&&!this.cameraMode&&!this.locked)this.transform.attach(item);this.box.visible=!!item&&item!==this.camera&&!this.cameraMode&&!this.locked;if(this.box.visible)this.box.setFromObject(item);}
 setView(cameraMode){this.cameraMode=cameraMode;this.orbit.enabled=!cameraMode&&!this.locked;this.select(this.selected);this.resize();}
 resize(){if(this.exporting)return;let w=this.container.clientWidth,h=this.container.clientHeight;if(this.cameraMode){const r=this.ratio();if(w/h>r)w=h*r;else h=w/r;}this.renderer.setSize(Math.max(1,w),Math.max(1,h));this.editor.aspect=w/h;this.editor.updateProjectionMatrix();}
 focus(){const item=this.items.get(this.selected);const center=item?new THREE.Box3().setFromObject(item).getCenter(new THREE.Vector3()):new THREE.Vector3(0,1,0);this.orbit.target.copy(center);this.editor.position.copy(center).add(new THREE.Vector3(4,3,5));this.orbit.update();}
 editorPose(){return {position:this.editor.position.toArray(),rotation:[this.editor.rotation.x,this.editor.rotation.y,this.editor.rotation.z],scale:[1,1,1]};}
 lock(value){this.locked=value;this.orbit.enabled=!value&&!this.cameraMode;this.select(this.selected);}
 render(clean=false){this.grid.visible=!clean&&!this.cameraMode&&this.showGrid;this.cameraHelper.visible=!clean&&!this.cameraMode;this.transformHelper.visible=!clean&&!this.cameraMode&&!this.locked;this.box.visible=!clean&&!this.cameraMode&&!this.locked&&this.items.has(this.selected);if(!clean&&!this.cameraMode)this.orbit.update();this.renderer.render(this.scene,clean||this.cameraMode?this.camera:this.editor);}
 beginExport(){this.exporting=true;this.lock(true);this.renderer.setPixelRatio(1);const r=this.ratio();this.renderer.setSize(r>=1?Math.round(720*r):720,r>=1?720:Math.round(720/r),false);this.render(true);}
 endExport(){this.exporting=false;this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.lock(false);this.resize();}
}
