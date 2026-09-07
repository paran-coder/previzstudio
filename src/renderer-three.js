import { resolveAsset } from './asset-catalog.js';

const THREE_VERSION = '0.185.1';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

export async function createThreeSceneEngine(container) {
  // Bare imports resolve through index.html importmap. WebGPURenderer automatically
  // falls back to WebGL 2 when WebGPU is unavailable in supported three.js builds.
  const THREE = await import('three/webgpu');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return new ThreeSceneEngine(container, THREE, GLTFLoader);
}

class AssetResolver {
  constructor(THREE, GLTFLoader) {
    this.THREE = THREE;
    this.loader = new GLTFLoader();
    this.cache = new Map();
  }
  async load(assetId) {
    const info = resolveAsset(assetId);
    if (!info) return null;
    if (!this.cache.has(assetId)) {
      this.cache.set(assetId, this.loader.loadAsync(info.url).then((gltf) => gltf.scene));
    }
    try {
      const original = await this.cache.get(assetId);
      const clone = original.clone(true);
      clone.scale.setScalar(info.scale || 1);
      return clone;
    } catch {
      this.cache.delete(assetId);
      return null;
    }
  }
}

export class ThreeSceneEngine {
  constructor(container, THREE, GLTFLoader) {
    this.THREE = THREE;
    this.container = container;
    this.document = null;
    this.shot = null;
    this.shotIndex = 0;
    this.progress = 0;
    this.playing = false;
    this.viewMode = 'director';
    this.onProgress = null;
    this.assetResolver = new AssetResolver(THREE, GLTFLoader);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090c10);
    this.scene.fog = new THREE.Fog(0x090c10, 18, 46);

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.pathGroup = new THREE.Group();
    this.scene.add(this.pathGroup);

    this.directorCamera = new THREE.PerspectiveCamera(42, 1, 0.05, 150);
    this.shotCamera = new THREE.PerspectiveCamera(50, 1, 0.05, 150);
    this.directorTarget = new THREE.Vector3(0, 1.25, 0);
    this.orbitYaw = 0.72; this.orbitPitch = 0.42; this.orbitRadius = 15;
    this.dragging = false; this.dragStart = null;

    this.renderer = new THREE.WebGPURenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    if (this.renderer.shadowMap) this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.className = 'three-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Three.js 프리비즈 렌더러');
    container.replaceChildren(this.renderer.domElement);

    this.bindControls();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.lastTime = performance.now();
    this.renderer.setAnimationLoop((time) => this.loop(time));
  }

  get rendererLabel() { return `Three.js r${THREE_VERSION.replace('0.', '')} · WebGPU/WebGL2`; }

  bindControls() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.viewMode !== 'director') return;
      this.dragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY, yaw: this.orbitYaw, pitch: this.orbitPitch };
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging || !this.dragStart) return;
      this.orbitYaw = this.dragStart.yaw - (e.clientX - this.dragStart.x) * 0.006;
      this.orbitPitch = clamp(this.dragStart.pitch + (e.clientY - this.dragStart.y) * 0.004, 0.1, 1.15);
    });
    const stop = () => { this.dragging = false; this.dragStart = null; };
    canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('wheel', (e) => {
      if (this.viewMode !== 'director') return;
      e.preventDefault(); this.orbitRadius = clamp(this.orbitRadius + Math.sign(e.deltaY) * 0.8, 5, 28);
    }, { passive: false });
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth), h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    for (const camera of [this.directorCamera, this.shotCamera]) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }

  clearWorld() {
    for (const group of [this.world, this.pathGroup]) {
      group.traverse((obj) => { obj.geometry?.dispose?.(); if (obj.material && !Array.isArray(obj.material)) obj.material.dispose?.(); });
      group.clear();
    }
  }

  material(color, roughness = 0.7) {
    return new this.THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 });
  }
  addBox(size, pos, color, parent = this.world) {
    const mesh = new this.THREE.Mesh(new this.THREE.BoxGeometry(...size), this.material(color));
    mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }

  async loadDocument(doc) {
    this.document = doc; this.shotIndex = 0; this.shot = doc.shots[0]; this.progress = 0; this.playing = false;
    await this.buildWorld(); this.buildCameraPath(); this.applyProgress(0);
  }

  async buildWorld() {
    this.clearWorld();
    const T = this.THREE, env = this.document.scene.environment;
    const ambient = new T.HemisphereLight(0xb9c8db, 0x191716, env.time === 'night' ? 0.65 : 1.3); this.world.add(ambient);
    const key = new T.DirectionalLight(0xdbe8ff, env.time === 'night' ? 3.0 : 2.1); key.position.set(-5, 8, 5); key.castShadow = true; this.world.add(key);
    const rim = new T.PointLight(0xffbd78, env.time === 'night' ? 28 : 10, 22); rim.position.set(4, 4.5, -4); this.world.add(rim);

    const grid = new T.GridHelper(30, 30, 0x66727e, 0x2b3036); grid.material.opacity = 0.26; grid.material.transparent = true; this.world.add(grid);

    let envModel = await this.assetResolver.load(env.assetId);
    if (envModel) this.world.add(envModel);
    else {
      this.addBox([22, 0.2, 26], [0, -0.1, 0], 0x262b31);
      if (env.type === 'urban_alley') {
        this.addBox([5, 8, 18], [-6.8, 4, -1], 0x252a30);
        this.addBox([5, 10, 18], [6.8, 5, -1], 0x20252b);
      } else {
        this.addBox([22, 8, 0.3], [0, 4, -10], 0x20252b);
      }
    }

    for (const [index, actor] of this.document.actors.entries()) {
      let model = await this.assetResolver.load(actor.assetId);
      if (!model) {
        model = new T.Group();
        const body = new T.Mesh(new T.CapsuleGeometry(0.34, 1.1, 6, 12), this.material(index ? 0x8f9aa5 : 0xb8c2cc)); body.position.y = 1.25; model.add(body);
        const head = new T.Mesh(new T.SphereGeometry(0.28, 16, 12), this.material(index ? 0x8f9aa5 : 0xb8c2cc)); head.position.y = 2.05; model.add(head);
      }
      model.position.set(...actor.position); model.rotation.y = actor.rotationY; model.name = actor.id; this.world.add(model);
    }

    for (const prop of this.document.props) {
      let model = await this.assetResolver.load(prop.assetId);
      if (!model) model = this.addBox([3.8, 1.2, 1.7], [0, 0.6, 0], 0x4e5660, new T.Group());
      model.position.set(...prop.position); model.rotation.y = prop.rotationY; model.name = prop.id; this.world.add(model);
    }
  }

  buildCameraPath() {
    this.pathGroup.clear(); if (!this.shot) return;
    const T = this.THREE, a = new T.Vector3(...this.shot.camera.start), b = new T.Vector3(...this.shot.camera.end);
    const line = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineDashedMaterial({ color: 0xc6ff4a, dashSize: .35, gapSize: .22, transparent: true, opacity: .7 })); line.computeLineDistances(); this.pathGroup.add(line);
    const dot = new T.Mesh(new T.SphereGeometry(.12, 12, 8), new T.MeshBasicMaterial({ color: 0xc6ff4a })); dot.name = 'camera-dot'; this.pathGroup.add(dot);
  }

  selectShot(index) {
    if (!this.document?.shots?.[index]) return;
    this.shotIndex = index; this.shot = this.document.shots[index]; this.progress = 0; this.playing = false; this.buildCameraPath(); this.applyProgress(0);
  }
  updateShot(shot) {
    this.shot = shot; if (this.document) this.document.shots[this.shotIndex] = shot; this.buildCameraPath(); this.applyProgress(this.progress);
  }

  getShotPosition(progress = this.progress) {
    const T = this.THREE, shot = this.shot;
    const start = new T.Vector3(...shot.camera.start), end = new T.Vector3(...shot.camera.end);
    if (shot.camera.movement === 'orbit') {
      const angle = lerp(-0.72, 0.72, progress), radius = Math.max(4, shot.camera.distance || 6);
      return new T.Vector3(Math.sin(angle) * radius, 2, Math.cos(angle) * radius);
    }
    return start.lerp(end, progress);
  }

  applyProgress(progress) {
    if (!this.shot) return; this.progress = clamp(progress, 0, 1);
    const p = this.getShotPosition(this.progress), target = new this.THREE.Vector3(...this.shot.camera.target);
    this.shotCamera.position.copy(p); this.shotCamera.lookAt(target);
    const fov = 2 * Math.atan(36 / (2 * this.shot.camera.lens)) * 180 / Math.PI;
    this.shotCamera.fov = fov; this.shotCamera.updateProjectionMatrix();
    const dot = this.pathGroup.getObjectByName('camera-dot'); if (dot) dot.position.copy(p);
  }

  updateDirectorCamera() {
    const cp = Math.cos(this.orbitPitch);
    this.directorCamera.position.set(
      this.directorTarget.x + Math.sin(this.orbitYaw) * cp * this.orbitRadius,
      this.directorTarget.y + Math.sin(this.orbitPitch) * this.orbitRadius,
      this.directorTarget.z + Math.cos(this.orbitYaw) * cp * this.orbitRadius,
    );
    this.directorCamera.lookAt(this.directorTarget);
  }

  setViewMode(mode) { this.viewMode = mode === 'shot' ? 'shot' : 'director'; this.pathGroup.visible = this.viewMode === 'director'; }
  setPlaying(v) { this.playing = Boolean(v); }
  reset() { this.playing = false; this.applyProgress(0); this.onProgress?.(0, false); }
  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05); this.lastTime = time;
    if (this.playing && this.shot) {
      const next = this.progress + dt / this.shot.duration;
      if (next >= 1) { this.applyProgress(1); this.playing = false; } else this.applyProgress(next);
      this.onProgress?.(this.progress, this.playing);
    }
    this.updateDirectorCamera();
    this.renderer.render(this.scene, this.viewMode === 'shot' ? this.shotCamera : this.directorCamera);
  }

  async capture(progress) {
    const prev = this.progress, prevMode = this.viewMode;
    this.applyProgress(progress); this.setViewMode('shot');
    await this.renderer.renderAsync?.(this.scene, this.shotCamera);
    this.renderer.render?.(this.scene, this.shotCamera);
    const blob = await new Promise((resolve) => this.renderer.domElement.toBlob(resolve, 'image/png'));
    this.setViewMode(prevMode); this.applyProgress(prev); return blob;
  }
  dispose() { this.renderer.setAnimationLoop(null); this.resizeObserver.disconnect(); this.renderer.dispose(); }
}
