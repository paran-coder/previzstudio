const COLORS = {
  bg: '#090c10',
  floor: '#20262c',
  wall: '#15191e',
  metal: '#2b3239',
  crate: '#3a3025',
  actorA: '#b8c2cc',
  actorB: '#8f9aa5',
  accent: '#c6ff4a',
  grid: 'rgba(150,160,170,.14)',
  lightWarm: 'rgba(255,190,125,.12)',
  lightCool: 'rgba(190,220,255,.10)',
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const vec = (x=0, y=0, z=0) => ({ x, y, z });
const sub = (a,b) => vec(a.x-b.x,a.y-b.y,a.z-b.z);
const add = (a,b) => vec(a.x+b.x,a.y+b.y,a.z+b.z);
const mul = (a,s) => vec(a.x*s,a.y*s,a.z*s);
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const cross = (a,b) => vec(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const length = (a) => Math.hypot(a.x,a.y,a.z) || 1;
const norm = (a) => mul(a,1/length(a));
const fromArray = (a) => vec(a[0],a[1],a[2]);

function rotateY(p, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return vec(p.x*c + p.z*s, p.y, -p.x*s + p.z*c);
}

function hexShade(hex, amount) {
  const raw = hex.replace('#','');
  if (raw.length !== 6) return hex;
  const n = parseInt(raw,16);
  const r = clamp((n>>16)+amount,0,255);
  const g = clamp(((n>>8)&255)+amount,0,255);
  const b = clamp((n&255)+amount,0,255);
  return `rgb(${r},${g},${b})`;
}

function focalFov(lens) {
  const sensor = 36;
  return 2 * Math.atan(sensor / (2 * lens));
}

export class SceneEngine {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-label','Previz renderer canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    container.appendChild(this.canvas);

    this.document = null;
    this.shot = null;
    this.progress = 0;
    this.playing = false;
    this.viewMode = 'director';
    this.onProgress = null;
    this.lastFrame = performance.now();
    this.raf = 0;

    this.directorTarget = vec(0,1.3,0);
    this.orbitYaw = 0.72;
    this.orbitPitch = 0.46;
    this.orbitRadius = 14.5;
    this.dragging = false;
    this.dragStart = null;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.bindControls();
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  bindControls() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.viewMode !== 'director') return;
      this.dragging = true;
      this.dragStart = { x:e.clientX, y:e.clientY, yaw:this.orbitYaw, pitch:this.orbitPitch };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging || !this.dragStart) return;
      this.orbitYaw = this.dragStart.yaw - (e.clientX-this.dragStart.x)*0.006;
      this.orbitPitch = clamp(this.dragStart.pitch + (e.clientY-this.dragStart.y)*0.004, 0.12, 1.15);
    });
    const end = () => { this.dragging=false; this.dragStart=null; };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    this.canvas.addEventListener('wheel', (e) => {
      if (this.viewMode !== 'director') return;
      e.preventDefault();
      this.orbitRadius = clamp(this.orbitRadius + Math.sign(e.deltaY)*0.8, 6, 25);
    }, { passive:false });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.canvas.width = Math.round(w*dpr);
    this.canvas.height = Math.round(h*dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.width = w;
    this.height = h;
  }

  loadDocument(doc) {
    this.document = doc;
    this.shot = doc.shots[0];
    this.progress = 0;
    this.playing = false;
    this.buildWorld();
  }

  updateShot(shot) {
    this.shot = shot;
    if (this.document) this.document.shots[0] = shot;
    this.applyProgress(this.progress);
  }

  buildWorld() {
    const env = this.document.scene.environment;
    this.boxes = [];
    this.actors = this.document.actors.map((a,i)=>({ ...a, color:i===0?COLORS.actorA:COLORS.actorB }));

    this.boxes.push({ pos:vec(0,-0.12,0), size:vec(22,.2,28), color:COLORS.floor });
    if (env.type === 'warehouse') {
      this.boxes.push({ pos:vec(0,4,-10), size:vec(22,8,.35), color:COLORS.wall });
      this.boxes.push({ pos:vec(-10.8,4,0), size:vec(.35,8,20), color:COLORS.wall });
      this.boxes.push({ pos:vec(10.8,4,0), size:vec(.35,8,20), color:COLORS.wall });
      for (const x of [-7.5,-3.8,3.8,7.5]) this.boxes.push({ pos:vec(x,3.6,-4.5), size:vec(.42,7.2,.42), color:COLORS.metal });
      for (let i=-2;i<=2;i++) this.boxes.push({ pos:vec(0,6.7,i*4-1), size:vec(20.6,.18,.18), color:COLORS.metal });
      for (const [x,z,s] of [[-6.5,-6,1.3],[-7.8,-5.6,.9],[6.8,-6.8,1.15],[7.6,-5.2,.75]]) {
        this.boxes.push({ pos:vec(x,s/2,z), size:vec(s*1.5,s,s*1.2), color:COLORS.crate });
      }
    }
  }

  getDirectorCamera() {
    const cp = Math.cos(this.orbitPitch);
    const pos = vec(
      this.directorTarget.x + Math.sin(this.orbitYaw)*cp*this.orbitRadius,
      this.directorTarget.y + Math.sin(this.orbitPitch)*this.orbitRadius,
      this.directorTarget.z + Math.cos(this.orbitYaw)*cp*this.orbitRadius,
    );
    return { pos, target:this.directorTarget, lens:32 };
  }

  getShotCamera(progress=this.progress) {
    const shot=this.shot;
    const start=fromArray(shot.camera.start), end=fromArray(shot.camera.end), target=fromArray(shot.camera.target);
    let pos;
    if (shot.camera.movement==='orbit') {
      const angle=lerp(-.72,.72,progress), radius=6.4;
      pos=vec(Math.sin(angle)*radius,2,Math.cos(angle)*radius);
    } else {
      pos=vec(lerp(start.x,end.x,progress),lerp(start.y,end.y,progress),lerp(start.z,end.z,progress));
    }
    return { pos, target, lens:shot.camera.lens };
  }

  cameraBasis(camera) {
    const forward=norm(sub(camera.target,camera.pos));
    const right=norm(cross(forward,vec(0,1,0)));
    const up=norm(cross(right,forward));
    return { forward,right,up };
  }

  project(point,camera) {
    const basis=this.cameraBasis(camera);
    const rel=sub(point,camera.pos);
    const z=dot(rel,basis.forward);
    if (z<=0.05) return null;
    const x=dot(rel,basis.right), y=dot(rel,basis.up);
    const f=(this.height*.5)/Math.tan(focalFov(camera.lens)*.5);
    return { x:this.width*.5 + (x/z)*f, y:this.height*.5 - (y/z)*f, z, scale:f/z };
  }

  boxFaces(box,camera) {
    const { pos,size,color,rotationY=0 }=box;
    const hx=size.x/2,hy=size.y/2,hz=size.z/2;
    const verts=[
      vec(-hx,-hy,-hz),vec(hx,-hy,-hz),vec(hx,hy,-hz),vec(-hx,hy,-hz),
      vec(-hx,-hy,hz),vec(hx,-hy,hz),vec(hx,hy,hz),vec(-hx,hy,hz),
    ].map(v=>add(rotateY(v,rotationY),pos));
    const faces=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]];
    const shades=[-18,10,-10,18,2,-4];
    return faces.map((idx,i)=>{
      const pts=idx.map(n=>this.project(verts[n],camera));
      if (pts.some(p=>!p)) return null;
      return { pts, depth:pts.reduce((s,p)=>s+p.z,0)/pts.length, fill:hexShade(color,shades[i]), stroke:'rgba(255,255,255,.035)' };
    }).filter(Boolean);
  }

  drawPolygon(item) {
    const ctx=this.ctx, pts=item.pts;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.closePath(); ctx.fillStyle=item.fill; ctx.fill();
    ctx.strokeStyle=item.stroke; ctx.lineWidth=1; ctx.stroke();
  }

  drawGrid(camera) {
    const ctx=this.ctx;
    ctx.strokeStyle=COLORS.grid; ctx.lineWidth=1;
    for (let i=-10;i<=10;i++) {
      for (const [a,b] of [[vec(i,0,-10),vec(i,0,10)],[vec(-10,0,i),vec(10,0,i)]]) {
        const pa=this.project(a,camera), pb=this.project(b,camera);
        if (!pa||!pb) continue;
        ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y); ctx.stroke();
      }
    }
  }

  drawActor(actor,camera) {
    const pos=fromArray(actor.position);
    const feet=this.project(pos,camera);
    const hip=this.project(add(pos,vec(0,.95,0)),camera);
    const chest=this.project(add(pos,vec(0,1.58,0)),camera);
    const head=this.project(add(pos,vec(0,2.28,0)),camera);
    if (!feet||!hip||!chest||!head) return;
    const ctx=this.ctx;
    const bodyW=clamp(chest.scale*.42,5,70);
    ctx.lineCap='round';
    ctx.strokeStyle='#171a1e'; ctx.lineWidth=clamp(hip.scale*.19,3,24);
    for (const side of [-1,1]) {
      ctx.beginPath(); ctx.moveTo(hip.x,hip.y); ctx.lineTo(feet.x+side*bodyW*.28,feet.y); ctx.stroke();
    }
    ctx.strokeStyle=actor.color; ctx.lineWidth=bodyW;
    ctx.beginPath(); ctx.moveTo(hip.x,hip.y); ctx.lineTo(chest.x,chest.y); ctx.stroke();
    ctx.lineWidth=clamp(bodyW*.28,3,18);
    for (const side of [-1,1]) {
      ctx.beginPath(); ctx.moveTo(chest.x+side*bodyW*.3,chest.y+2); ctx.lineTo(hip.x+side*bodyW*.48,hip.y+3); ctx.stroke();
    }
    const headR=clamp(head.scale*.28,4,38);
    ctx.beginPath(); ctx.arc(head.x,head.y,headR,0,Math.PI*2); ctx.fillStyle=actor.color; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.28)'; ctx.lineWidth=1; ctx.stroke();
    const label=this.project(add(pos,vec(0,2.85,0)),camera);
    if (label) {
      ctx.font='10px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillStyle='rgba(230,235,240,.62)'; ctx.fillText(actor.id.toUpperCase(),label.x,label.y);
    }
  }

  drawLightPools(camera) {
    const ctx=this.ctx;
    for (const [p,color,r] of [[vec(-2,0,1),COLORS.lightCool,2.8],[vec(3,0,-1),COLORS.lightWarm,2.3]]) {
      const q=this.project(p,camera); if(!q) continue;
      const rr=clamp(q.scale*r,10,220);
      const g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,rr);
      g.addColorStop(0,color); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(q.x,q.y,rr,rr*.32,0,0,Math.PI*2); ctx.fill();
    }
  }

  drawCameraGuide(camera) {
    if (this.viewMode!=='director' || !this.shot) return;
    const ctx=this.ctx;
    const start=fromArray(this.shot.camera.start), end=fromArray(this.shot.camera.end);
    const a=this.project(start,camera), b=this.project(end,camera), cur=this.project(this.getShotCamera().pos,camera);
    if (a&&b) {
      ctx.save(); ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(198,255,74,.55)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.restore();
    }
    if (cur) {
      ctx.fillStyle=COLORS.accent; ctx.beginPath(); ctx.arc(cur.x,cur.y,4,0,Math.PI*2); ctx.fill();
      ctx.font='9px ui-monospace, monospace'; ctx.textAlign='left'; ctx.fillStyle='rgba(198,255,74,.75)'; ctx.fillText('SHOT CAM',cur.x+8,cur.y+3);
    }
  }

  render(forceShot=false) {
    if (!this.document || !this.shot) return;
    const ctx=this.ctx;
    ctx.fillStyle=COLORS.bg; ctx.fillRect(0,0,this.width,this.height);
    const camera=(forceShot||this.viewMode==='shot')?this.getShotCamera():this.getDirectorCamera();

    const vignette=ctx.createRadialGradient(this.width*.5,this.height*.45,Math.min(this.width,this.height)*.1,this.width*.5,this.height*.5,Math.max(this.width,this.height)*.65);
    vignette.addColorStop(0,'rgba(20,25,31,.38)'); vignette.addColorStop(1,'rgba(4,5,7,.45)');
    ctx.fillStyle=vignette; ctx.fillRect(0,0,this.width,this.height);

    this.drawGrid(camera);
    this.drawLightPools(camera);
    const faces=this.boxes.flatMap(b=>this.boxFaces(b,camera));
    faces.sort((a,b)=>b.depth-a.depth).forEach(f=>this.drawPolygon(f));
    [...this.actors].sort((a,b)=>{
      const pa=this.project(fromArray(a.position),camera), pb=this.project(fromArray(b.position),camera);
      return (pb?.z||0)-(pa?.z||0);
    }).forEach(a=>this.drawActor(a,camera));
    this.drawCameraGuide(camera);
  }

  applyProgress(progress) { this.progress=clamp(progress,0,1); }
  setViewMode(mode) { this.viewMode=mode==='shot'?'shot':'director'; }
  setPlaying(value) { this.playing=Boolean(value); }
  reset() { this.playing=false; this.applyProgress(0); this.onProgress?.(0,false); }

  loop(time) {
    const delta=Math.min((time-this.lastFrame)/1000,.05); this.lastFrame=time;
    if (this.playing && this.shot) {
      const next=this.progress+delta/this.shot.duration;
      if (next>=1) { this.progress=1; this.playing=false; }
      else this.progress=next;
      this.onProgress?.(this.progress,this.playing);
    }
    this.render();
    this.raf=requestAnimationFrame(this.loop);
  }

  async capture(progress) {
    const previous=this.progress;
    this.progress=progress; this.render(true);
    const blob=await new Promise(resolve=>this.canvas.toBlob(resolve,'image/png'));
    this.progress=previous; this.render();
    return blob;
  }

  dispose() { cancelAnimationFrame(this.raf); this.resizeObserver.disconnect(); }
}
