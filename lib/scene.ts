import {clamp,pinch,angleDelta} from './space-math.mjs';
import {sceneLayout} from './galaxy-layout.mjs';
import {DIVE_SECONDS,smooth,panoramicPhotos} from './immersive-space.mjs';
import {createStarRenderer} from './star-renderer';
import {createSolarRenderer} from './solar-renderer';
import {solarFrame} from './scene-framing.mjs';
import {solarPlanets} from './solar-math.mjs';
import {nextStory,STORY_STAGES,FLIGHT_SECONDS,canDepart,type JourneyStage} from './journey';
import type {Photo} from './photos';

type PhotoNode={photo:Photo;el:HTMLButtonElement;x?:number;y?:number;width?:number;height?:number};
type Callbacks={stage:(value:JourneyStage)=>void;open:(id:string)=>void;gesture:()=>void;prompt?:(ready:boolean)=>void;discovery?:(opened:boolean)=>void;focused?:(id:string|null)=>void};
export type Scene={setPhotos:(photos:Photo[])=>void;beginSolar:()=>void;overview:()=>void;restart:()=>void;advanceStory:()=>void;clearSelection:()=>void;closeGallery:()=>void;enter:()=>void;zoomBy:(factor:number)=>void;destroy:()=>void};

export function createScene(canvas:HTMLCanvasElement,layer:HTMLDivElement,callbacks:Callbacks):Scene{
 const context=canvas.getContext('2d');if(!context)throw new Error('Canvas không khả dụng');const ctx=context;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,mobile=()=>innerWidth<650;
 let layout=sceneLayout(innerWidth,innerHeight);
 const view={width:innerWidth,height:innerHeight,yaw:.12,pitch:.88,zoom:1,unit:1,distance:13,centerY:.46,roll:0,target:{x:0,y:0,z:0}};
 let stage:JourneyStage='intro',stageClock=0,clock=0,solarClock=0,galleryClock=0,mix=0,last=0,raf=0,alive=true;
 let nodes:PhotoNode[]=[],selected='',prompted=false,exploration=0,galleryOpened=false,insideMix=0,travelFrom=0,travelTarget=0,travelClock=0,travelling=false,travelYaw=0,travelPitch=0;
 let suppress=0,moved=false;
 let velYaw=0,velPitch=0;

 const stars=createStarRenderer(mobile());
 const solar=createSolarRenderer(),planetButtons=new Map<string,HTMLButtonElement>(),pointers=new Map<number,{x:number;y:number}>();
 let gesture:{x:number;y:number;ox:number;oy:number}|null=null,pin:{distance:number;angle:number}|null=null;
 const core=document.createElement('button');core.className='galaxy-core-hit';core.hidden=true;core.setAttribute('aria-label','Khám phá quả cầu ảnh');layer.appendChild(core);
 const random=(a:number,b:number)=>a+Math.random()*(b-a);
 const distant=Array.from({length:mobile()?2300:4200},(_,i)=>{const cols=mobile()?40:70,rows=Math.ceil((mobile()?2300:4200)/cols);return{x:(i%cols+Math.random())/cols,y:(Math.floor(i/cols)+Math.random())/rows,r:random(.2,1.05),phase:random(0,7)}});
 const halos=['#b9ccff','#ecc5df','#e4eaff'].map(color=>{
  const c=document.createElement('canvas');c.width=c.height=32;const k=c.getContext('2d')!,g=k.createRadialGradient(16,16,0,16,16,16);
  g.addColorStop(0,'#ffffff');g.addColorStop(.1,color);g.addColorStop(.24,color+'55');g.addColorStop(1,color+'00');k.fillStyle=g;k.fillRect(0,0,32,32);return c;
 });
 let solarFraming=solarFrame(innerWidth,innerHeight);

 function setStage(value:JourneyStage){
  stage=value;stageClock=0;callbacks.stage(value);
  if(value==='galaxy'&&!galleryOpened){
   openGallery();
  }
 }
 function ask(){if(prompted)return;prompted=true;callbacks.prompt?.(true)}
 function clearFocus(){selected='';callbacks.focused?.(null)}
 function resetDiscovery(){galleryOpened=false;insideMix=0;travelTarget=0;travelling=false;callbacks.discovery?.(false)}
 function flyTo(target:number){travelFrom=insideMix;travelTarget=target;travelClock=0;travelling=true;travelYaw=view.yaw;travelPitch=view.pitch}
 function openGallery(){
  if(galleryOpened||travelling)return;
  galleryOpened=true;clearFocus();flyTo(1);core.hidden=true;layer.tabIndex=0;layer.focus({preventScroll:true});callbacks.discovery?.(true);
 }
 function closeGallery(){clearFocus();galleryOpened=false;callbacks.discovery?.(false);flyTo(0);nodes.forEach(n=>{n.el.hidden=true})}
 function updateLayout(){
  layout=sceneLayout(view.width,view.height);
 }
 function resize(){
  view.width=innerWidth;view.height=innerHeight;solarFraming=solarFrame(view.width,view.height);const dpr=Math.min(devicePixelRatio||1,mobile()?1.5:2);
  canvas.width=Math.round(view.width*dpr);canvas.height=Math.round(view.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);updateLayout();
 }
 function beginSolar(){
  clearFocus();resetDiscovery();core.hidden=true;prompted=false;exploration=0;callbacks.prompt?.(false);
  // View zoom mở màn cho cả điện thoại và máy tính: zoom từ xa nhẹ nhàng vào Hệ Mặt Trời
  view.yaw=.12;view.pitch=.88;view.zoom=.35;view.target={x:0,y:0,z:0};mix=0;pointers.clear();gesture=null;pin=null;suppress=0;
  velYaw=0;velPitch=0;
  nodes.forEach(n=>{n.el.hidden=true});for(const el of planetButtons.values())el.hidden=true;
  setStage('solar');
 }
 function overview(){beginSolar();ask()}
 function restart(){clearFocus();resetDiscovery();core.hidden=true;pointers.clear();gesture=null;pin=null;suppress=0;velYaw=0;velPitch=0;nodes.forEach(n=>{n.el.hidden=true});for(const el of planetButtons.values())el.hidden=true;setStage('intro')}
 function advanceStory(){const next=nextStory(stage);if(!next)return;if(next==='flight')enter();else setStage(next)}
 function enter(){
  clearFocus();resetDiscovery();galleryClock=0;mix=1;view.yaw=.4;view.pitch=.12;view.zoom=1.08;
  nodes.forEach(n=>{n.el.hidden=true;n.x=undefined;n.y=undefined;n.width=undefined;n.height=undefined});for(const el of planetButtons.values())el.hidden=true;
  setStage(reduce?'galaxy':'flight');
 }
 function choosePlanet(id:string){
  if(stage!=='solar')return;callbacks.gesture();
  if(!canDepart(stage,id))return;
  clearFocus();for(const el of planetButtons.values())el.hidden=true;
  setStage('departure');
 }
 for(const planet of solarPlanets){
  const button=document.createElement('button');button.className='celestial-hit';button.hidden=true;button.dataset.planetId=planet.id;button.setAttribute('aria-label',planet.name);
  button.addEventListener('click',event=>{
   event.stopPropagation();
   if(event.detail!==0&&performance.now()<suppress)return;
   choosePlanet(planet.id);
  });
  layer.appendChild(button);
  planetButtons.set(planet.id,button);
 }
 function focusPhoto(id:string){
  const index=nodes.findIndex(n=>n.photo.id===id);if(index<0)return;selected=id;callbacks.focused?.(id);
 }
 function choosePhoto(id:string){
  if(stage!=='galaxy'||!galleryOpened||travelling||insideMix<.92)return;
  focusPhoto(id);
  callbacks.open(id);
 }
 function setPhotos(photos:Photo[]){
  const focusId=(document.activeElement as HTMLElement)?.dataset?.photoId;for(const n of nodes)n.el.remove();
  nodes=photos.map(photo=>{
   const el=document.createElement('button');el.className='planet';el.hidden=true;el.dataset.photoId=photo.id;el.setAttribute('aria-label',photo.title);
   const img=document.createElement('img');img.src=photo.src;img.alt=photo.title;img.draggable=false;el.appendChild(img);
   el.addEventListener('click',event=>{event.stopPropagation();callbacks.gesture();if(event.detail!==0&&performance.now()<suppress)return;choosePhoto(photo.id)});layer.appendChild(el);return{photo,el};
  });
  core.disabled=!nodes.length;
  updateLayout();if(selected){if(nodes.some(n=>n.photo.id===selected))focusPhoto(selected);else clearFocus()}
  nodes.find(n=>n.photo.id===focusId)?.el.focus({preventScroll:true});
 }

 type Meteor={x:number;y:number;vx:number;vy:number;age:number;life:number;length:number;hue:number};
 const meteors:Meteor[]=[];let meteorClock=0;
 function spawnMeteor(){
  const isGalactic=stage==='galaxy'||stage==='flight';
  const speed=isGalactic?random(520,1150):random(230,540);
  const a=random(.25,.78);
  meteors.push({
   x:random(-.2,1.1)*view.width,
   y:random(-.2,.55)*view.height,
   vx:Math.cos(a)*speed,
   vy:Math.sin(a)*speed,
   age:0,
   life:isGalactic?random(.8,1.8):random(1.2,2.3),
   length:isGalactic?random(110,240):random(70,160),
   hue:random(0,1)
  });
 }
 function drawMeteors(dt:number){
  if(reduce)return;meteorClock+=dt;
  const isGalactic=stage==='galaxy'||stage==='flight';
  const interval=isGalactic?.09:.55;
  const maxMeteors=isGalactic?80:35;
  while(meteorClock>=interval){meteorClock-=interval;if(meteors.length<maxMeteors)spawnMeteor()}
  for(let i=meteors.length-1;i>=0;i--){
   const m=meteors[i];m.age+=dt;m.x+=m.vx*dt;m.y+=m.vy*dt;
   if(m.age>m.life||m.y>view.height+240||m.x>view.width+240){meteors.splice(i,1);continue}
   const speed=Math.hypot(m.vx,m.vy),tx=m.x-m.vx/speed*m.length,ty=m.y-m.vy/speed*m.length;
   const alpha=(isGalactic?.85:.65)*Math.min(1,m.age*6,(m.life-m.age)*3.5);
   const g=ctx.createLinearGradient(m.x,m.y,tx,ty);
   if(m.hue>.5){
    g.addColorStop(0,'rgba(255,235,248,'+alpha+')');g.addColorStop(.2,'rgba(235,188,230,'+alpha*.6+')');g.addColorStop(1,'#e8b7e200');
   }else{
    g.addColorStop(0,'rgba(238,244,255,'+alpha+')');g.addColorStop(.25,'rgba(182,196,255,'+alpha*.5+')');g.addColorStop(1,'#b7c0f000');
   }
   ctx.strokeStyle=g;ctx.lineWidth=isGalactic?1.4:1.15;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(tx,ty);ctx.stroke();
   ctx.globalAlpha=alpha;ctx.drawImage(halos[m.hue>.5?1:2],m.x-5,m.y-5,10,10);ctx.globalAlpha=1;
  }
 }

 /** Hiệu ứng lướt bay êm dịu thanh thoát khi chuyển vào galaxy, không gây chói mắt */
 function drawSoftFlight(dt:number){
  if(stage!=='flight')return;
  const t=clamp(stageClock/FLIGHT_SECONDS,0,1);
  const cx=view.width/2,cy=view.height*.47,reach=Math.hypot(view.width,view.height);
  const driftAlpha=Math.sin(Math.PI*t)*.28;
  // Dải sáng sao trôi êm ái
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,reach*.6);
  g.addColorStop(0,'rgba(224,210,250,'+driftAlpha+')');
  g.addColorStop(.4,'rgba(170,180,245,'+driftAlpha*.4+')');
  g.addColorStop(1,'#04050e00');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,view.width,view.height);
 }

 function draw(now:number){
  if(!alive)return;raf=requestAnimationFrame(draw);const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(document.hidden)return;
  const w=view.width,h=view.height;ctx.clearRect(0,0,w,h);if(stage==='intro'||STORY_STAGES.includes(stage))return;
  stageClock+=dt;if(!reduce)clock+=dt;if(stage==='solar'&&!reduce)solarClock+=dt;

  // Zoom vào Hệ Mặt Trời điện ảnh sau khi bấm Có, phù hợp cả điện thoại và máy tính
  if(stage==='solar'){
   const zoomProgress=clamp(stageClock/1.8,0,1);
   const zoomT=smooth(zoomProgress);
   view.zoom=.35+(.65)*zoomT;
   if(stageClock>1.1)ask();
   if(!pointers.size){
    if(Math.abs(velYaw)>.001){view.yaw+=velYaw*dt;velYaw*=Math.exp(-dt*3.5)}
    if(Math.abs(velPitch)>.001){view.pitch=clamp(view.pitch+velPitch*dt,-1.45,1.45);velPitch*=Math.exp(-dt*3.5)}
   }
  }

  if(stage==='flight'&&stageClock>=FLIGHT_SECONDS)setStage('galaxy');
  const galactic=stage==='galaxy'||stage==='flight';
  if(stage==='galaxy'){
   galleryClock+=dt;
   if(travelling){
    travelClock+=dt;const t=reduce?1:smooth(travelClock/DIVE_SECONDS);insideMix=travelFrom+(travelTarget-travelFrom)*t;
    view.yaw=travelYaw*(1-t);view.pitch=travelPitch*(1-t);
    if(t>=1){insideMix=travelTarget;travelling=false;view.yaw=0;view.pitch=0}
   }else{
    // Quán tính vuốt/kéo
    if(!pointers.size){
     if(Math.abs(velYaw)>0.001){view.yaw+=velYaw*dt;velYaw*=Math.exp(-dt*3.5)}
     if(Math.abs(velPitch)>0.001){view.pitch=clamp(view.pitch+velPitch*dt,-1.45,1.45);velPitch*=Math.exp(-dt*3.5)}
     // Tự động xoay ảnh quanh quả cầu galaxy mượt mà khi người dùng không tương tác
     if(!reduce&&Math.abs(velYaw)<0.005){
      view.yaw+=dt*.075;
     }
    }
   }
  }
  mix+=(Number(galactic)-mix)*(reduce?1:1-Math.exp(-dt*2));view.unit=solarFraming.unit*(1-mix)+layout.unit*mix;view.roll=solarFraming.roll*(1-mix);
  const reveal=stage==='solar'?clamp(stageClock/1.2,0,1):1;
  if(!galactic){
   ctx.fillStyle='#dce4ff';
   for(const star of distant){
    ctx.globalAlpha=(.17+.48*(.5+.5*Math.sin(clock*.32+star.phase)))*reveal;
    ctx.fillRect(star.x*w,star.y*h,star.r,star.r);
   }
   ctx.globalAlpha=1;
  }
  const camera={width:w,height:h,yaw:view.yaw,pitch:view.pitch,zoom:view.zoom,cameraZ:-10*(1-insideMix),centerY:.46+insideMix*.04};
  if(galactic){
   const birth=stage==='flight'?smooth(stageClock/FLIGHT_SECONDS):1;
   stars.draw(ctx,camera,clock,birth*(selected?.45:1),travelling?Math.sin(Math.PI*insideMix):0);
  }
  const hits=solar.draw(ctx,view,solarClock,(1-mix)*reveal);
  for(const [id,button] of planetButtons){
   const hit=hits.find(h=>h.id===id);button.hidden=stage!=='solar'||!hit;
   if(!hit||button.hidden)continue;const size=Math.max(44,hit.r*2+10);
   button.style.width=button.style.height=size+'px';button.style.transform='translate('+hit.x+'px,'+hit.y+'px) translate(-50%,-50%)';button.style.zIndex=String(Math.round(200-hit.z*10));
  }
  core.hidden=true;
  if(galactic){
   const items=panoramicPhotos(nodes.length,camera),easing=reduce?1:1-Math.exp(-dt*9),appearance=smooth((insideMix-.85)/.15);
   for(let i=0;i<nodes.length;i++){
    const n=nodes[i],p=items[i],focused=n.photo.id===selected,available=galleryOpened&&insideMix>.9&&!travelling;
    const targetX=focused?w/2:p.x,targetY=focused?h*.5:p.y,targetWidth=focused?Math.min(w*.82,460,h*.72/1.32):p.width,targetHeight=targetWidth*1.32;
    if(p.visible||focused){n.x=(n.x??targetX)+(targetX-(n.x??targetX))*easing;n.y=(n.y??targetY)+(targetY-(n.y??targetY))*easing;n.width=(n.width??targetWidth)+(targetWidth-(n.width??targetWidth))*easing;n.height=(n.height??targetHeight)+(targetHeight-(n.height??targetHeight))*easing}
    else{n.x=undefined;n.y=undefined;n.width=undefined;n.height=undefined}
    const shown=galleryOpened&&appearance>.01&&(p.visible||focused),active=shown&&available;
    n.el.hidden=!shown;n.el.style.width=(n.width??targetWidth)+'px';n.el.style.height=(n.height??targetHeight)+'px';n.el.style.transform='translate('+(n.x??targetX)+'px,'+(n.y??targetY)+'px) translate(-50%,-50%)';n.el.style.opacity=String(focused?1:appearance);n.el.style.filter='none';
    n.el.dataset.available=String(available);n.el.style.zIndex=String(focused?900:Math.round(500-p.depth*10));n.el.style.pointerEvents=active?'':'none';n.el.tabIndex=active?0:-1;
    n.el.classList.toggle('selected-planet',focused);n.el.classList.toggle('distant-photo',false);n.el.setAttribute('aria-pressed',String(focused));n.el.setAttribute('aria-hidden',String(!active));
   }
  }
  drawSoftFlight(dt);
  drawMeteors(dt);
 }
 const xy=(e:PointerEvent)=>({x:e.clientX,y:e.clientY});
 const interactive=()=>stage==='solar'||(stage==='galaxy'&&!travelling);
 function down(e:PointerEvent){
  if(e.button>0||!interactive())return;
  callbacks.gesture();
  try{layer.setPointerCapture(e.pointerId)}catch{}
  pointers.set(e.pointerId,xy(e));
  velYaw=0;velPitch=0;
  if(pointers.size===1){moved=false;gesture={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY}}
  else if(pointers.size===2){pin=pinch(...Array.from(pointers.values()) as [{x:number;y:number},{x:number;y:number}]);moved=true;suppress=Infinity}
 }
 function move(e:PointerEvent){
  if(!pointers.has(e.pointerId)||!interactive())return;pointers.set(e.pointerId,xy(e));
  if(pointers.size>=2){
   if(selected)clearFocus();const pair=Array.from(pointers.values()).slice(0,2) as [{x:number;y:number},{x:number;y:number}],p=pinch(...pair);
   if(pin&&pin.distance>2){view.zoom=clamp(view.zoom*p.distance/pin.distance,.45,stage==='galaxy'?3.2:3.8);view.yaw+=angleDelta(p.angle,pin.angle);exploration+=.05}pin=p;return;
  }
  if(gesture){
   const dist=Math.hypot(e.clientX-gesture.ox,e.clientY-gesture.oy);
   if(dist>6)moved=true;
   if(moved){
    if(selected)clearFocus();
    const dx=(e.clientX-gesture.x)*.0048,dy=(e.clientY-gesture.y)*.004;
    const dyaw=galleryOpened?-dx:dx,dpitch=galleryOpened?-dy:dy;
    view.yaw+=dyaw;view.pitch=clamp(view.pitch+dpitch,-1.45,1.45);
    velYaw=dyaw*45;velPitch=dpitch*45;
    exploration+=Math.hypot(dx,dy);suppress=Infinity;
   }
   gesture.x=e.clientX;gesture.y=e.clientY;
  }
 }
 function up(e:PointerEvent){
  if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);
  if(pointers.size===1){const p=Array.from(pointers.values())[0];gesture={x:p.x,y:p.y,ox:p.x,oy:p.y};pin=null;moved=true}
  else if(!pointers.size){suppress=moved?performance.now()+250:0;gesture=null;pin=null}
 }
 function backgroundClick(e:MouseEvent){
  if(e.detail!==0&&performance.now()<suppress)return;
  if(stage==='galaxy'&&selected)clearFocus();
 }
 function wheel(e:WheelEvent){if(!interactive())return;e.preventDefault();callbacks.gesture();view.zoom=clamp(view.zoom*Math.exp(-e.deltaY*.001),.45,stage==='galaxy'?3.2:3.8);exploration+=.05}
 function zoomBy(factor:number){if(!interactive())return;callbacks.gesture();view.zoom=clamp(view.zoom*factor,.45,stage==='galaxy'?3.2:3.8);exploration+=.05}
 function key(e:KeyboardEvent){
  if(stage!=='galaxy'||!galleryOpened||travelling||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();clearFocus();if(e.key==='ArrowLeft')view.yaw-=Math.PI/6;if(e.key==='ArrowRight')view.yaw+=Math.PI/6;if(e.key==='ArrowUp')view.pitch=clamp(view.pitch-.2,-1.45,1.45);if(e.key==='ArrowDown')view.pitch=clamp(view.pitch+.2,-1.45,1.45);
 }
 function blur(){pointers.clear();gesture=null;pin=null;suppress=performance.now()+300;velYaw=0;velPitch=0}
 layer.addEventListener('keydown',key);layer.addEventListener('pointerdown',down);layer.addEventListener('pointermove',move);layer.addEventListener('pointerup',up);layer.addEventListener('pointercancel',up);layer.addEventListener('lostpointercapture',up);window.addEventListener('blur',blur);layer.addEventListener('click',backgroundClick);layer.addEventListener('wheel',wheel,{passive:false});window.addEventListener('resize',resize);
 resize();raf=requestAnimationFrame(draw);
 return{setPhotos,beginSolar,overview,restart,advanceStory,clearSelection:clearFocus,closeGallery,enter,zoomBy,destroy(){
  alive=false;cancelAnimationFrame(raf);solar.destroy();core.remove();layer.removeEventListener('keydown',key);layer.removeEventListener('pointerdown',down);layer.removeEventListener('pointermove',move);layer.removeEventListener('pointerup',up);layer.removeEventListener('pointercancel',up);layer.removeEventListener('lostpointercapture',up);window.removeEventListener('blur',blur);layer.removeEventListener('click',backgroundClick);layer.removeEventListener('wheel',wheel);window.removeEventListener('resize',resize);for(const n of nodes)n.el.remove();for(const el of planetButtons.values())el.remove();
 }};
}
