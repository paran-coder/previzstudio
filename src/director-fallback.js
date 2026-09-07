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
  return { id,title,intent,start,end,camera:{ movement,lens,distance:extra.distance ?? 0,start:cameraStart,end:cameraEnd,target,handheldAmount:extra.handheldAmount ?? 0,...(extra.targetActorId?{targetActorId:extra.targetActorId}:{}),...(extra.secondaryActorId?{secondaryActorId:extra.secondaryActorId}:{}) } };
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
    scene:{id:'scene_road_chase_01',continuityKey:`road:night:${rainy?'rain':'clear'}:chase:v2`,environment:{type:'road',time:has(text,['낮','day'])?'day':'night',weather:rainy?'rain':'clear',assetId:'road_procedural'}},
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
      shot('shot_01','와이드 추격 시작','도로와 두 인물의 거리 관계를 보여준다.',0,t(4),'dolly_out',lensHint||24,[7.2,3.0,-4],[8.2,3.2,-2],[0,1.2,-6],{distance:2,targetActorId:'actor_01'}),
      shot('shot_02','측면 트래킹','도망자와 추격자의 속도 차이를 측면에서 읽힌다.',t(4),t(9),'track_follow',lensHint||35,[6.8,2.1,-1],[6.2,2.0,1],[0,1.3,0],{distance:8,targetActorId:'actor_01'}),
      shot('shot_03','추격자 핸드헬드','추격자의 뒤에서 달리는 에너지를 강조한다.',t(9),t(14),'handheld_follow',lensHint||50,[.45,1.85,-5.2],[.35,1.75,-4.2],[0,1.3,0],{distance:5,targetActorId:'actor_02',handheldAmount:.72}),
      shot('shot_04','사이 트래킹 푸시','두 인물 사이를 따라가며 마지막에 도망자에게 시선을 모은다.',t(14),duration,'track_between',lensHint||35,[3.2,1.85,-1.2],[1.6,1.72,1.0],[0,1.3,0],{distance:4,targetActorId:'actor_01',secondaryActorId:'actor_02',handheldAmount:.18}),
    ]
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
  const to = run?[0,0,14]:walk?[0,0,8]:[0,0,0];
  return {
    version:SCENE_VERSION,sourcePrompt:prompt,sequence:{duration,fps:24,width:1920,height:1080},
    scene:{id:`scene_${env}_01`,continuityKey:`${env}:${night?'night':'day'}:clear:v2`,environment:{type:env,time:night?'night':'day',weather:has(text,['비','rain'])?'rain':'clear',assetId:`${env}_procedural`}},
    actors:[{id:'actor_01',role:'subject',assetId:'actor_neutral',position:[0,0,0],rotationY:0,actions:[action(actionType,0,duration,[0,0,0],to,{rotationFrom:0,rotationTo:0})]}],
    props:[],lights:[{id:'ambient_01',type:'ambient',intensity:night?.6:1.1,position:[0,5,0]},{id:'key_01',type:'directional',intensity:2.2,position:[-5,8,5]}],
    shots:[shot('shot_01','메인 샷','지원되는 동작과 카메라 명령을 하나의 샷으로 표현한다.',0,duration,movement,lens,[4.5,2.1,-5],[4.0,2.0,2],[0,1.3,2],{distance:7,targetActorId:'actor_01',handheldAmount:has(text,['핸드헬드','역동적'])?.35:0})]
  };
}

export function directPromptFallback(rawPrompt) {
  const prompt = String(rawPrompt || '').trim();
  const text = prompt.toLowerCase();
  const chase = has(text,['쫓','추격','뒤따라','chase']) && has(text,['도망','달리','달린','뛰','뛴','run']);
  return chase ? chaseScene(prompt,text) : genericScene(prompt,text);
}
