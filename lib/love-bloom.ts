import {clamp} from './space-math.mjs';
import {smooth} from './immersive-space.mjs';

type Shard={x:number;y:number;vx:number;vy:number;size:number;phase:number;color:string};

/** Enlarge “Yêu em”, then scatter its letters into stars and continue automatically. */
export function createLoveBloom(canvas:HTMLCanvasElement,onComplete:()=>void){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const burstAt=2.18,burstDuration=1.25;
 let raf=0,last=0,clock=0,alive=true,completed=false,width=innerWidth,height=innerHeight,baseSize=53,maxScale=1,shards:Shard[]=[];

 function resize(){
  width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx!.setTransform(dpr,0,0,dpr,0,0);
  baseSize=width<650?53:height<540?48:clamp(width*.08,47,90);
  const sample=document.createElement('canvas');sample.width=Math.ceil(baseSize*5);sample.height=Math.ceil(baseSize*2);const s=sample.getContext('2d')!;
  s.font='400 '+baseSize+'px YenSans, Arial, sans-serif';s.textAlign='center';s.textBaseline='middle';
  const textWidth=s.measureText('Yêu em').width;maxScale=Math.max(1,Math.min(width*.88/textWidth,height*.68/baseSize));shards=[];
 }

 function makeShards(){
  const sample=document.createElement('canvas');sample.width=Math.max(1,Math.ceil(width));sample.height=Math.max(1,Math.ceil(height));
  const s=sample.getContext('2d',{willReadFrequently:true});if(!s)return[];
  s.font='400 '+(baseSize*maxScale)+'px YenSans, Arial, sans-serif';s.textAlign='center';s.textBaseline='middle';s.fillStyle='#f6e0ed';
  s.fillText('Yêu em',width/2,height/2-12);
  const pixels=s.getImageData(0,0,sample.width,sample.height).data,out:Shard[]=[];
  for(let y=0;y<sample.height;y+=4)for(let x=0;x<sample.width;x+=4){
   const i=(y*sample.width+x)*4;if(pixels[i+3]<90)continue;
   const dx=x-width/2,dy=y-(height/2-12),length=Math.max(1,Math.hypot(dx,dy)),speed=75+Math.random()*230;
   out.push({x,y,vx:dx/length*speed+(Math.random()-.5)*90,vy:dy/length*speed-25-Math.random()*105,size:1+Math.random()*2.2,phase:Math.random()*Math.PI*2,color:`rgb(${pixels[i]},${pixels[i+1]},${pixels[i+2]})`});
  }
  return out;
 }

 function draw(now:number){
  if(!alive||completed)return;
  const dt=last?Math.min(60,now-last)/1000:0;last=now;if(!document.hidden)clock+=dt;
  ctx!.clearRect(0,0,width,height);
  if(clock<burstAt){
   const grow=reduce?1:smooth(clamp((clock-.3)/1.7,0,1)),scale=1+(maxScale-1)*grow;
   const pulse=reduce?0:Math.sin(clock*2.4)*6;
   ctx!.globalAlpha=clamp(clock/.3,0,1);ctx!.font='400 '+(baseSize*scale)+'px YenSans, Arial, sans-serif';
   ctx!.textAlign='center';ctx!.textBaseline='middle';ctx!.fillStyle='#f6e0ed';ctx!.shadowColor='#d4bce888';ctx!.shadowBlur=26+pulse;
   ctx!.fillText('Yêu em',width/2,height/2-12);ctx!.shadowBlur=0;ctx!.globalAlpha=1;
  }else{
   if(!shards.length)shards=makeShards();
   const t=clamp((clock-burstAt)/burstDuration,0,1),fade=1-t;
   ctx!.shadowColor='#f6e0ed';ctx!.shadowBlur=7;
   for(const p of shards){
    const drift=1+1.7*t,x=p.x+p.vx*burstDuration*t,y=p.y+p.vy*burstDuration*t+52*t*t+Math.sin(p.phase+clock*5)*2;
    ctx!.globalAlpha=fade;ctx!.fillStyle=p.color;ctx!.beginPath();ctx!.arc(x,y,p.size*drift,0,Math.PI*2);ctx!.fill();
   }
   ctx!.globalAlpha=1;ctx!.shadowBlur=0;
   if(t>=1){completed=true;onComplete();return}
  }
  raf=requestAnimationFrame(draw);
 }

 resize();window.addEventListener('resize',resize);raf=requestAnimationFrame(draw);
 return()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};
}
