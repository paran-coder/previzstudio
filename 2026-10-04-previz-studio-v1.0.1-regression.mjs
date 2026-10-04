import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL, fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from './2026-09-20-dependencies/node_modules/playwright/index.mjs';
import {validateProject} from './2026-09-20-model.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const output=path.resolve(root,'2026-10-04-previz-studio-v1.0.1-verification',new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
const results=[];
const change=async(page,id,value)=>{await page.locator('#'+id).fill(String(value));await page.locator('#'+id).press('Tab');};
const scrub=async(page,time)=>page.locator('#scrub').evaluate((e,time)=>{e.value=time;e.dispatchEvent(new Event('input',{bubbles:true}));},time);
const savedProject=async page=>{
 const event=page.waitForEvent('download');await page.locator('#save').click();const download=await event;
 const parts=[];for await(const part of await download.createReadStream())parts.push(part);
 return JSON.parse(Buffer.concat(parts).toString('utf8'));
};
const importProject=async(page,project)=>{
 await page.locator('#fileInput').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('복원했습니다'));
};
async function check(name,run){
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
 // Test-only access to actual TransformControls events; production has no debug globals.
 await page.route('**/2026-09-20-app.mjs',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nglobalThis.audit={stage,get project(){return project}};'});});
 try{
  await page.goto('http://127.0.0.1:4173');await page.locator('.object-row').first().waitFor();
  await run(page);assert.deepEqual(errors,[]);results.push({name,passed:true});console.log('PASS '+name);
 }catch(error){results.push({name,passed:false,error:error.message,errors});console.error('FAIL '+name+': '+error.message);}
 finally{await context.close();}
}
try{
 await check('preset replacement updates camera canvas aspect, including undo and redo',async page=>{
  const ratio=()=>page.locator('canvas').evaluate(c=>c.clientWidth/c.clientHeight);
  await page.locator('#cameraView').click();await page.locator('#aspect').selectOption('9:16');
  await page.locator('[data-preset=product]').click();assert.ok(Math.abs(await ratio()-16/9)<.01,'16:9 setting must produce a landscape canvas');
  await page.locator('#undo').click();assert.ok(Math.abs(await ratio()-9/16)<.01);
  await page.locator('#redo').click();assert.ok(Math.abs(await ratio()-16/9)<.01);
  await page.screenshot({path:path.join(output,'2026-10-04-preset-camera.png')});
 });
 await check('boundary duplicate survives file import and automatic reload',async page=>{
  await page.locator('[data-preset=product]').click();await change(page,'position0',1000);await page.locator('#duplicate').click();
  const project=await savedProject(page);assert.doesNotThrow(()=>validateProject(project),'own saved file must remain valid');
  await importProject(page,project);assert.equal(await page.locator('.object-row').count(),5);
  await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='자동저장 완료');await page.reload();
  await page.locator('.object-row').first().waitFor();assert.equal(await page.locator('.object-row').count(),5);
 });
 await check('animated boundary duplication preserves every relative key position',async page=>{
  await page.locator('[data-preset=walk]').click();await scrub(page,6);await change(page,'position0',1000);await scrub(page,0);
  const before=(await savedProject(page)).objects[0];await page.locator('#duplicate').click();const project=await savedProject(page);
  assert.doesNotThrow(()=>validateProject(project));const copy=project.objects.at(-1),offset=copy.position[0]-before.position[0];
  assert.equal(copy.keys.length,2);copy.keys.forEach((k,i)=>assert.ok(Math.abs(k.position[0]-before.keys[i].position[0]-offset)<1e-9));
 });
 await check('gizmo rejects invalid scale and position without poisoning the project',async page=>{
  for(const values of [{scale:[-.5,0,101],position:[1001,-1001,0]},{scale:[NaN,Infinity,-Infinity],position:[NaN,Infinity,-Infinity]}]){
   const state=await page.evaluate(values=>{
    const s=audit.stage,control=s.transform;control.dispatchEvent({type:'dragging-changed',value:true});
    control.object.scale.fromArray(values.scale);control.object.position.fromArray(values.position);control.dispatchEvent({type:'objectChange'});control.dispatchEvent({type:'dragging-changed',value:false});
    return {project:audit.project,scale:control.object.scale.toArray(),position:control.object.position.toArray()};
   },values);
   assert.doesNotThrow(()=>validateProject(state.project));assert.deepEqual(state.scale,state.project.objects[0].scale);assert.deepEqual(state.position,state.project.objects[0].position);
  }
  const saved=await savedProject(page);await importProject(page,saved);
  await page.locator('#undo').click();const undone=await savedProject(page);assert.doesNotThrow(()=>validateProject(undone));
 });
 await check('shortening duration then deleting removes exactly one key',async page=>{
  await page.locator('[data-preset=walk]').click();await scrub(page,1/30);await page.locator('#addKey').click();await change(page,'duration',1);
  const before=(await savedProject(page)).objects[0].keys;assert.equal(before.length,3);
  await page.locator('#start').click();await page.locator('#removeKey').click();const after=(await savedProject(page)).objects[0].keys;
  assert.deepEqual(after,before.slice(1),'nearby sub-frame key must survive deleting the exact key');
  await page.locator('#undo').click();assert.deepEqual((await savedProject(page)).objects[0].keys,before);
  await page.locator('#redo').click();assert.deepEqual((await savedProject(page)).objects[0].keys,after);
 });
 await check('invalid numeric scale restores the inspector as well as preserving data',async page=>{
  await change(page,'scale0',-1);
  assert.equal(Number(await page.locator('#scale0').inputValue()),1,'rejected scale must not remain visible as if it was applied');
  assert.equal((await savedProject(page)).objects[0].scale[0],1);
 });
 await check('editing a compressed key preserves its neighbor and timing',async page=>{
  await page.locator('[data-preset=walk]').click();await scrub(page,1/30);await page.locator('#addKey').click();await change(page,'duration',1);
  const before=(await savedProject(page)).objects[0].keys;await page.locator('#start').click();await change(page,'position0',-2);
  const after=(await savedProject(page)).objects[0].keys;assert.equal(after.length,3);assert.deepEqual(after.slice(1),before.slice(1));assert.equal(after[0].position[0],-2);
 });
}finally{await browser.close();}
await writeFile(path.join(output,'2026-10-04-regression-results.json'),JSON.stringify({results},null,2),{flag:'wx'});
console.log('OUTPUT '+output);
if(results.some(r=>!r.passed))process.exitCode=1;
if(process.argv.includes('--full')&&!process.exitCode){
 // Reuse the original 17 checks, redirecting artifacts without touching old evidence.
 let source=await readFile(path.join(root,'2026-09-20-browser-test.mjs'),'utf8');
 source=source.replace("'./2026-09-20-dependencies/node_modules/playwright/index.mjs'",JSON.stringify(pathToFileURL(path.join(root,'2026-09-20-dependencies/node_modules/playwright/index.mjs')).href));
 source=source.replace("path.join(root,'2026-09-20-verification')",JSON.stringify(output)).replace('downloadsPath:output','').replaceAll("'2026-09-20-","'2026-10-04-");
 await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const video=path.join(output,'2026-10-04-reference-sample.mp4');
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_streams','-show_format','-show_entries','frame=best_effort_timestamp_time:stream=codec_name,width,height,avg_frame_rate:format=duration,size','-of','json',video],{encoding:'utf8'}));
 const times=probe.frames.map(f=>Number(f.best_effort_timestamp_time));
 assert.ok(times.length>1&&times.every((t,i)=>Number.isFinite(t)&&(!i||t>times[i-1])),'decoded video timestamps must advance');
 // Preserve VFR timestamps; default null-output CFR resampling can report duplicate DTS.
 execFileSync('ffmpeg',['-v','error','-xerror','-i',video,'-fps_mode','passthrough','-enc_time_base','demux','-f','null','NUL'],{stdio:'pipe'});
 await writeFile(path.join(output,'2026-10-04-video-validation.json'),JSON.stringify({stream:probe.streams[0],format:probe.format,frames:times.length,strictlyIncreasingTimestamps:true,fullDecodePassed:true,maxFrameGapSeconds:Math.max(...times.slice(1).map((t,i)=>t-times[i]))},null,2),{flag:'wx'});
 console.log('PASS full video decode and increasing source timestamps');
}
