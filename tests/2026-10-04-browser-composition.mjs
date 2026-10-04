import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('2026-10-04-v1.4.0-verification',new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,value)=>{assert.ok(value,name);results.push(name);console.log('PASS '+name);};
try{
 await page.goto('http://127.0.0.1:4174');await page.waitForFunction(()=>window.__PREVIZ__);
 check('production app version',await page.locator('#build-status').textContent().then(x=>x.includes('1.4.0')));
 await page.locator('#prompt').fill('마주한 두사람의 나이프액션신. 4초. 카메라는 고정.');await page.locator('#generate').click();
 await page.waitForFunction(()=>window.__PREVIZ__.getScene().props.length===2);
 check('two actors, knife actions and static camera',await page.evaluate(()=>{const d=__PREVIZ__.getScene();return d.actors.length===2&&d.actors.every(a=>a.actions[0].type==='knife_action')&&d.shots[0].camera.movement==='static';}));
 check('prompt input stays inside the viewport',await page.locator('#prompt').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
 check('interpretation visible',await page.locator('#interpretation').textContent().then(x=>x.includes('2명')&&x.includes('지원 구문')));
 const pose=await page.evaluate(()=>{const e=__PREVIZ__.getEngine();const sample=t=>{e.seek(t);e.world.updateMatrixWorld(true);return [...e.actorRigs.values()].map(r=>{let knife;r.root.traverse(n=>{if(n.userData.propType==='knife')knife=n;});return {attached:knife?.parent===r.armR,position:knife?.matrixWorld.elements.slice(12,15)};});};return [sample(.1),sample(.5)];});
 check('both knives attach to right arm',pose[0].every(p=>p.attached));check('knives move with actor animation',JSON.stringify(pose[0])!==JSON.stringify(pose[1]));
 await page.locator('[data-view="preview"]').click();
 check('preview is 16:9',await page.locator('#viewport canvas').evaluate(c=>Math.abs(c.clientWidth/c.clientHeight-16/9)<.01));
 await page.screenshot({path:path.join(output,'2026-10-04-knife-preview.png'),fullPage:true});
 const pngEvent=page.waitForEvent('download');await page.locator('#ref-mid').click();const png=await pngEvent;await png.saveAs(path.join(output,'2026-10-04-knife-middle.png'));
 const videoEvent=page.waitForEvent('download',{timeout:180000});await page.locator('#render-video').click();const video=await videoEvent;
 const videoFile=path.join(output,'2026-10-04-knife-video.'+video.suggestedFilename().split('.').at(-1));await video.saveAs(videoFile);check('video download completes',!(await video.failure()));
 for(const fps of ['24','25','30','60']){await page.locator('#fps-select').selectOption(fps);check('FPS '+fps,await page.evaluate(fps=>__PREVIZ__.getScene().sequence.fps===Number(fps),fps));}
 await page.locator('#prompt').fill('두 사람이 공중제비를 하며 춤춘다');await page.locator('#generate').click();await page.waitForFunction(()=>__PREVIZ__.getScene().sourcePrompt.includes('공중제비'));
 check('unsupported instruction warning visible',await page.locator('#interpretation').textContent().then(x=>x.includes('미지원')));
 await page.goto('http://127.0.0.1:4174/?renderer=canvas');await page.waitForFunction(()=>window.__PREVIZ__);await page.evaluate(()=>__PREVIZ__.loadPrompt('두 사람 나이프 액션'));
 check('Canvas discloses missing knife display',await page.locator('#interpretation').textContent().then(x=>x.includes('Canvas')));
 await page.setViewportSize({width:390,height:844});check('mobile no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(output,'2026-10-04-mobile.png'),fullPage:true});check('no runtime errors',errors.length===0);
 await writeFile(path.join(output,'2026-10-04-results.json'),JSON.stringify({results,errors,videoFile},null,2));
 console.log('OUTPUT '+output);
}finally{await browser.close();}
