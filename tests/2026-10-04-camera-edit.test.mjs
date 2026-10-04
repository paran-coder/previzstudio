import test from 'node:test';
import assert from 'node:assert/strict';
import { directPromptFallback } from '../src/director-fallback.js';
import { ensureManualCamera, evaluateCameraAtTime } from '../src/sequence.js';
import { translateShotCamera, translateShotTarget, copyCameraToShot } from '../src/2026-10-04-camera-edit.js';
const fixture=()=>directPromptFallback('밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다.');
test('whole-shot position translation preserves a static shot at every evaluated time',()=>{
 const doc=fixture(),m=ensureManualCamera(doc,0);m.start=[3,4,5];m.end=[3,4,5];
 const times=[doc.shots[0].start+.1,(doc.shots[0].start+doc.shots[0].end)/2,doc.shots[0].end-.1];
 const before=times.map(t=>evaluateCameraAtTime(doc,t,{ignoreHandheld:true}).position);
 translateShotCamera(doc,0,'start',[5,3,9]);assert.deepEqual(m.start,m.end);
 times.forEach((t,i)=>assert.deepEqual(evaluateCameraAtTime(doc,t,{ignoreHandheld:true}).position,before[i].map((v,j)=>v+[2,-1,4][j])));
});
test('moving shot preserves endpoint path delta and timing',()=>{
 const doc=fixture(),m=ensureManualCamera(doc,0),shot=doc.shots[0],timing=[shot.start,shot.end];m.start=[0,2,3];m.end=[5,2,8];
 translateShotCamera(doc,0,'end',[7,6,9]);assert.deepEqual(m.start,[2,6,4]);assert.deepEqual(m.end,[7,6,9]);assert.deepEqual([shot.start,shot.end],timing);
});
test('whole-shot free target translation moves both endpoint targets',()=>{
 const doc=fixture(),m=ensureManualCamera(doc,0);m.targetMode='free';m.targetOffset=[0,0,0];m.targetStart=[0,1,0];m.targetEnd=[2,1,3];translateShotTarget(doc,0,'start',[1,2,3]);assert.deepEqual(m.targetEnd,[3,2,6]);
});
test('director copy creates stable static framing and lens without altering actors or timeline',()=>{
 const doc=fixture(),actors=structuredClone(doc.actors),sequence=structuredClone(doc.sequence);copyCameraToShot(doc,0,{position:[6,5,4],target:[0,1,0],lens:42});const m=doc.shots[0].camera.manual;assert.deepEqual(m.start,m.end);assert.deepEqual(m.targetStart,m.targetEnd);assert.equal(doc.shots[0].camera.lens,42);assert.deepEqual(doc.actors,actors);assert.deepEqual(doc.sequence,sequence);
});
import * as THREE from 'three';
import { ThreeSceneEngine } from '../src/renderer-three.js';
test('gizmo transaction begins once and ends once independent of update intervals',()=>{
 const callbacks=new Map();class Controls{constructor(){}getHelper(){return new THREE.Group();}addEventListener(name,fn){callbacks.set(name,fn);}}
 const e=Object.create(ThreeSceneEngine.prototype);e.THREE=THREE;e.scene=new THREE.Scene();e.directorCamera=new THREE.PerspectiveCamera();e.renderer={domElement:{}};e.syncEditProxy=()=>{};e.commitGizmoChange=()=>{};const phases=[];e.onEditTransaction=p=>phases.push(p);e.setupTransformControls(Controls);
 callbacks.get('dragging-changed')({value:true});callbacks.get('objectChange')();callbacks.get('dragging-changed')({value:true});callbacks.get('objectChange')();callbacks.get('dragging-changed')({value:false});assert.deepEqual(phases,['begin','end']);
});
test('nontransform selection detaches controls and hides gizmo',()=>{
 const e=Object.create(ThreeSceneEngine.prototype);e.document={};e.viewMode='edit';for(const name of ['cameraProxy','targetProxy','actorProxy','cameraTargetLine','transformHelper'])e[name]={visible:true};let detached=0;e.transformControls={detach(){detached++;}};
 for(const type of ['none','prop','environment']){e.setEditSelection(type,'x');assert.equal(e.editSelection.type,type);assert.equal(e.transformHelper.visible,false);}assert.equal(detached,3);
});
test('actor endpoint gizmo preserves neighboring action continuity and document identity',()=>{
 const e=Object.create(ThreeSceneEngine.prototype);e.THREE=THREE;e.document=fixture();const original=e.document,actor=e.document.actors[0];e.viewMode='edit';e.time=.2;e.editSelection={type:'actor',id:actor.id};e.actorEditEndpoint='to';e.actorEditActionIndex=0;e.transformMode='translate';e.actorProxy=new THREE.Object3D();e.actorProxy.position.set(2,0,8);e.currentShotIndex=()=>0;e.refreshPathGuides=()=>{};e.applyTime=()=>{};e.commitGizmoChange();assert.equal(e.document,original);const updated=e.document.actors[0];assert.deepEqual(updated.actions[0].to,[2,0,8]);if(updated.actions[1])assert.deepEqual(updated.actions[1].from,[2,0,8]);
});
test('entrance overview places director camera on positive-Z front side',()=>{
 const e=Object.create(ThreeSceneEngine.prototype);e.THREE=THREE;e.document=fixture();e.document.scene.environment.type='storefront';e.directorTarget=new THREE.Vector3();e.directorCamera=new THREE.PerspectiveCamera();e.frameEditOverview();assert.ok(e.directorCamera.position.z>e.directorTarget.z);assert.ok(e.directorCamera.position.y>=8);
});
