import { SCENE_VERSION, clamp } from './scene-schema.js';

const has = (text, terms) => terms.some((term) => text.includes(term));

function explicitLens(text) {
  const m = text.match(/(18|20|24|28|32|35|40|50|65|70|85|100|120)\s*mm/i);
  return m ? Number(m[1]) : null;
}
function explicitDuration(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:초|sec|seconds?|s\b)/i);
  return m ? clamp(Number(m[1]), 4, 60) : null;
}
function actorCountOf(text) {
  if (has(text,['네 사람','네명','네 명','4명','4 명','four people'])) return 4;
  if (has(text,['세 사람','세명','세 명','3명','3 명','three people'])) return 3;
  if (has(text,['두 사람','두명','두 명','2명','2 명','둘이','서로','two people'])) return 2;
  return 1;
}
function envOf(text) {
  if (has(text,['도로','차도','road'])) return 'road';
  if (has(text,['골목','거리','alley','street'])) return 'urban_alley';
  if (has(text,['복도','corridor','hallway'])) return 'corridor';
  if (has(text,['사무실','office'])) return 'office';
  if (has(text,['스튜디오','studio'])) return 'studio';
  return 'warehouse';
}
function action(type,start,end,from,to,extra={}) { return { type,start,end,from,to,...extra }; }
function shot(id,title,intent,start,end,movement,lens,cameraStart,cameraEnd,target,extra={}) {
  return { id,title,intent,start,end,camera:{ movement,archetype:extra.archetype || 'free',lens,distance:extra.distance ?? 0,start:cameraStart,end:cameraEnd,target,handheldAmount:extra.handheldAmount ?? 0,...(extra.targetActorId?{targetActorId:extra.targetActorId}:{}),...(extra.secondaryActorId?{secondaryActorId:extra.secondaryActorId}:{}) } };
}

function chaseScene(prompt,text) {
  const duration = explicitDuration(text) || 20;
  const scale = duration / 20;
  const t = n => Number((n*scale).toFixed(3));
  const lensHint = explicitLens(text);
  const rainy = has(text,['비','rain','젖은','wet']);
  return {
    version:SCENE_VERSION,
    sourcePrompt:prompt,
    sequence:{duration,fps:24,width:1920,height:1080},
    scene:{id:'scene_road_chase_01',continuityKey:`road:night:${rainy?'rain':'clear'}:chase:v4`,environment:{type:'road',time:has(text,['낮','day'])?'day':'night',weather:rainy?'rain':'clear',assetId:'road_procedural'}},
    actors:[
      { id:'actor_01',role:'runner',assetId:'actor_neutral',position:[-.55,0,-12],rotationY:0,actions:[
        action('run',0,t(18),[-.55,0,-12],[-.35,0,17],{rotationFrom:0,rotationTo:0}),
        action('stop',t(18),duration,[-.35,0,17],[-.35,0,17],{rotationFrom:0,rotationTo:0}),
      ]},
      { id:'actor_02',role:'pursuer',assetId:'actor_neutral',position:[.65,0,-16],rotationY:0,actions:[
        action('chase',0,duration,[.65,0,-16],[.45,0,13],{rotationFrom:0,rotationTo:0,targetId:'actor_01'}),
      ]},
    ],
    props:[
      {id:'car_01',type:'car',assetId:'sedan_blockout',position:[4.9,0,5.5],rotationY:Math.PI/2},
      {id:'car_02',type:'car',assetId:'sedan_blockout',position:[-5.1,0,-7],rotationY:-Math.PI/2},
    ],
    lights:[
      {id:'ambient_01',type:'ambient',intensity:.55,position:[0,5,0]},
      {id:'moon_01',type:'directional',intensity:2.4,position:[-8,12,-2]},
      {id:'street_01',type:'point',intensity:28,position:[-4,5,2]},
      {id:'street_02',type:'point',intensity:24,position:[4,5,12]},
    ],
    shots:[
      shot('shot_01','후방 3/4 와이드','도로와 두 인물의 진행 방향과 거리 관계를 먼저 보여준다.',0,t(4),'track_follow',lensHint||24,[4.8,1.62,-8.5],[4.1,1.58,-7.0],[0,1.4,0],{archetype:'rear_three_quarter',distance:8,targetActorId:'actor_01'}),
      shot('shot_02','측면 트래킹','도망자와 추격자의 속도 차이를 측면에서 읽는다.',t(4),t(9),'track_follow',lensHint||35,[6.2,1.62,-.9],[6.2,1.62,.8],[0,1.4,0],{archetype:'side_track',distance:6.2,targetActorId:'actor_01'}),
      shot('shot_03','추격자 후방 핸드헬드','추격자의 뒤에서 달리는 에너지를 강조한다.',t(9),t(14),'handheld_follow',lensHint||50,[.35,1.58,-5.6],[-.25,1.54,-4.6],[0,1.4,0],{archetype:'rear_follow',distance:5,targetActorId:'actor_02',handheldAmount:.72}),
      shot('shot_04','사이 트래킹 푸시','두 인물 사이를 따라가며 마지막에 도망자에게 시선을 모은다.',t(14),duration,'track_between',lensHint||35,[2.6,1.56,-1.8],[1.15,1.50,.15],[0,1.4,0],{archetype:'between_push',distance:4,targetActorId:'actor_01',secondaryActorId:'actor_02',handheldAmount:.18}),
    ]
  };
}

function fightScene(prompt,text) {
  const duration=explicitDuration(text)||20;
  const scale=duration/20;
  const t=n=>Number((n*scale).toFixed(3));
  const env=envOf(text);
  const night=has(text,['밤','야간','night']);
  const lensHint=explicitLens(text);
  const dynamic=has(text,['다양한 각도','여러 각도','다양한 앵글','익사이팅','역동','dynamic','exciting','핸드헬드']);
  const a1=[-1.05,0,-.25], a2=[1.05,0,.25];
  return {
    version:SCENE_VERSION,sourcePrompt:prompt,sequence:{duration,fps:24,width:1920,height:1080},
    scene:{id:`scene_${env}_fight_01`,continuityKey:`${env}:${night?'night':'day'}:clear:fight:v1`,environment:{type:env,time:night?'night':'day',weather:has(text,['비','rain'])?'rain':'clear',assetId:`${env}_procedural`}},
    actors:[
      {id:'actor_01',role:'fighter_a',assetId:'actor_neutral',position:a1,rotationY:Math.PI/2,actions:[action('fight',0,duration,a1,[-.72,0,.32],{rotationFrom:Math.PI/2,rotationTo:Math.PI/2,targetId:'actor_02',phaseOffset:0})]},
      {id:'actor_02',role:'fighter_b',assetId:'actor_neutral',position:a2,rotationY:-Math.PI/2,actions:[action('fight',0,duration,a2,[.72,0,-.32],{rotationFrom:-Math.PI/2,rotationTo:-Math.PI/2,targetId:'actor_01',phaseOffset:Math.PI})]},
    ],
    props:[],
    lights:[{id:'ambient_01',type:'ambient',intensity:night?.65:1.15,position:[0,5,0]},{id:'key_01',type:'directional',intensity:2.5,position:[-6,9,4]},{id:'rim_01',type:'point',intensity:night?18:8,position:[4,4,-5]}],
    shots: dynamic ? [
      shot('shot_01','격투 와이드 오비트','두 배우의 거리와 공격 방향을 와이드 오비트로 설정한다.',0,t(5),'orbit',lensHint||28,[0,0,0],[0,0,0],[0,1.3,0],{distance:6,targetActorId:'actor_01',secondaryActorId:'actor_02',handheldAmount:.08}),
      shot('shot_02','파이터 A 핸드헬드','첫 번째 배우 가까이에서 타격 리듬을 따라간다.',t(5),t(10),'handheld_follow',lensHint||50,[-3.2,1.65,-3.8],[-2.4,1.58,-3.1],[0,1.35,0],{distance:4.6,targetActorId:'actor_01',secondaryActorId:'actor_02',handheldAmount:.72}),
      shot('shot_03','파이터 B 리버스','반대쪽 배우로 축을 전환해 리액션과 반격을 보여준다.',t(10),t(15),'handheld_follow',lensHint||50,[3.1,1.62,3.7],[2.5,1.56,3.0],[0,1.35,0],{distance:4.5,targetActorId:'actor_02',secondaryActorId:'actor_01',handheldAmount:.62}),
      shot('shot_04','사이 푸시','두 배우 사이로 밀고 들어가며 격투의 강도를 높인다.',t(15),duration,'track_between',lensHint||35,[0,1.65,-5.2],[0,1.48,-2.8],[0,1.35,0],{distance:4,targetActorId:'actor_01',secondaryActorId:'actor_02',handheldAmount:.28}),
    ] : [shot('shot_01','격투 메인 샷','두 배우의 격투 동작을 하나의 와이드 샷으로 표현한다.',0,duration,'orbit',lensHint||35,[0,0,0],[0,0,0],[0,1.3,0],{distance:6,targetActorId:'actor_01',secondaryActorId:'actor_02',handheldAmount:.16})]
  };
}

function genericScene(prompt,text) {
  const env = envOf(text);
  const duration = explicitDuration(text) || 20;
  const night = has(text,['밤','야간','night']);
  const lens = explicitLens(text) || (has(text,['클로즈업','close'])?85:35);
  const run = has(text,['뛰','뛴','달리','달린','run']);
  const walk = has(text,['걷','걸어','walk']);
  const movement = has(text,['오비트','돌며','orbit'])?'orbit':has(text,['따라','추적','tracking','follow'])?'track_follow':has(text,['다가','푸시','dolly'])?'dolly_in':'static';
  const actionType = run?'run':walk?'walk':'idle';
  const count=actorCountOf(text);
  const actors=Array.from({length:count},(_,i)=>{
    const x=(i-(count-1)/2)*1.8;
    const from=[x,0,0],to=run?[x,0,14]:walk?[x,0,8]:from;
    return {id:`actor_${String(i+1).padStart(2,'0')}`,role:'subject',assetId:'actor_neutral',position:from,rotationY:0,actions:[action(actionType,0,duration,from,to,{rotationFrom:0,rotationTo:0})]};
  });
  const varied=has(text,['다양한 각도','여러 각도','다양한 앵글','여러 앵글','익사이팅','역동적','dynamic angles']);
  const scale=duration/20,t=n=>Number((n*scale).toFixed(3));
  const shots=varied?[
    shot('shot_01','와이드 설정','피사체와 공간 관계를 먼저 보여준다.',0,t(5),'dolly_out',lens||28,[4.8,2.0,-6.8],[5.4,2.1,-7.6],[0,1.35,1],{distance:7,targetActorId:'actor_01',secondaryActorId:count>1?'actor_02':undefined}),
    shot('shot_02','측면 팔로우','측면으로 이동하며 동작을 따라간다.',t(5),t(10),'track_follow',lens||35,[5.2,1.7,-2.5],[5.2,1.7,-1.2],[0,1.35,1],{distance:5.5,targetActorId:'actor_01',secondaryActorId:count>1?'actor_02':undefined,handheldAmount:.16}),
    shot('shot_03','오비트 앵글','피사체 주위를 돌아 시점을 전환한다.',t(10),t(15),'orbit',lens||40,[0,0,0],[0,0,0],[0,1.35,1],{distance:5.5,targetActorId:'actor_01',secondaryActorId:count>1?'actor_02':undefined,handheldAmount:.12}),
    shot('shot_04','핸드헬드 푸시','가까이 밀고 들어가며 에너지를 높인다.',t(15),duration,'handheld_follow',lens||50,[-2.4,1.65,-4.2],[-1.6,1.55,-2.8],[0,1.35,1],{distance:4,targetActorId:'actor_01',secondaryActorId:count>1?'actor_02':undefined,handheldAmount:.55}),
  ]:[shot('shot_01','메인 샷','지원되는 동작과 카메라 명령을 하나의 샷으로 표현한다.',0,duration,movement,lens,[4.5,2.1,-5],[4.0,2.0,2],[0,1.3,2],{distance:7,targetActorId:'actor_01',secondaryActorId:count>1?'actor_02':undefined,handheldAmount:has(text,['핸드헬드','역동적','익사이팅'])?.35:0})];
  return {
    version:SCENE_VERSION,sourcePrompt:prompt,sequence:{duration,fps:24,width:1920,height:1080},
    scene:{id:`scene_${env}_01`,continuityKey:`${env}:${night?'night':'day'}:clear:v4`,environment:{type:env,time:night?'night':'day',weather:has(text,['비','rain'])?'rain':'clear',assetId:`${env}_procedural`}},
    actors,
    props:[],lights:[{id:'ambient_01',type:'ambient',intensity:night?.6:1.1,position:[0,5,0]},{id:'key_01',type:'directional',intensity:2.2,position:[-5,8,5]}],
    shots
  };
}

export function directPromptFallback(rawPrompt) {
  const prompt = String(rawPrompt || '').trim();
  const text = prompt.toLowerCase();
  const fight = has(text,['격투','격투씬','싸움','싸우','싸운','주먹','난투','fight','combat']);
  const chase = has(text,['쫓','추격','뒤따라','chase']) && has(text,['도망','달리','달린','뛰','뛴','run']);
  if (fight) return fightScene(prompt,text);
  return chase ? chaseScene(prompt,text) : genericScene(prompt,text);
}
