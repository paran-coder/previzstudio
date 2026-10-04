import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ThreeSceneEngine } from '../src/renderer-three.js';

function engine() {
  const e=Object.create(ThreeSceneEngine.prototype);
  e.THREE=THREE;e.world=new THREE.Group();e.actorRigs=new Map();
  const root=new THREE.Group(),armL=new THREE.Group(),armR=new THREE.Group();
  armL.position.set(-.47,1.78,0);armR.position.set(.47,1.78,0);root.add(armL,armR);e.world.add(root);
  e.actorRigs.set('a',{root,armL,armR});return e;
}

test('umbrella follows selected actor hand while canopy remains upright after translation and yaw',()=>{
  for(const hand of ['left','right']){
    const e=engine(),rig=e.actorRigs.get('a');
    e.attachUmbrella({id:'umbrella',actorId:'a',hand,position:[0,-.82,0],rotationY:.3});
    e.updateHeldProps(rig);e.world.updateMatrixWorld(true);
    const g=rig.heldUmbrellas[0].group,before=g.getWorldPosition(new THREE.Vector3());
    assert.equal(g.parent,hand==='left'?rig.armL:rig.armR);
    rig.root.position.set(3,0,5);rig.root.rotation.y=1.2;e.updateHeldProps(rig);e.world.updateMatrixWorld(true);
    const up=new THREE.Vector3(0,1,0).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(up.distanceTo(new THREE.Vector3(0,1,0))<1e-10);
    assert.ok(g.getWorldPosition(new THREE.Vector3()).distanceTo(before)>4);
    const canopy=g.children.find(o=>o.geometry?.type==='ConeGeometry');
    assert.ok(canopy.getWorldPosition(new THREE.Vector3()).y>2.6);
  }
});

test('storefront and building have a central entrance opening and bounded procedural geometry',()=>{
  for(const type of ['storefront','building']){
    const e=engine();e.buildEntrance(type);
    const walls=e.world.children.filter(o=>o.geometry?.parameters?.height===5);
    assert.equal(walls.length,2);
    assert.ok(walls.every(o=>Math.abs(o.position.x)-o.geometry.parameters.width/2>=1.39));
    assert.ok(e.world.children.some(o=>o.position.z===-5.3));
  }
});

test('knife attachment retains original hand and offset',()=>{
  const e=engine();e.attachKnife({id:'knife',actorId:'a',hand:'right',position:[0,-.7,0],rotationY:.5});
  const g=e.actorRigs.get('a').armR.children[0];
  assert.equal(g.userData.propType,'knife');assert.deepEqual(g.position.toArray(),[0,-.7,0]);
  assert.equal(g.rotation.y,.5);
});
