import {clamp} from './space-math.mjs';
import {smooth} from './immersive-space.mjs';

/** Grow the love message, then burst its letters into drifting starlight. */
export function createLoveBloom(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 type Particle={x:number;y:number;vx:number;vy:number;size:number;twinkle:number};
 let raf=0,last=0,clock=0,alive=true,width=innerWidth,height=innerHeight,baseSize=53,maxScale=1,particles:Particle[]=[];

 function resize(){
  width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx!.setTransform(dpr,0,0,dpr,0,0);
  baseSize=width<650?53:height<540?48:clamp(width*.08,47,90);
  const sample=document.createElement('canvas');sample.width=width;sample.height=height;const s=sample.getContext('2d')!;
  s.font='400 '+baseSize+'px YenSans, Arial, sans-serif';s.textAlign='center';s.textBaseline='middle';
  const textWidth=s.measureText('Y\u00eau em').width;maxScale=Math.min(width*.88/textWidth,height*.68/baseSize);
  s.clearRect(0,0,width,height);s.font='400 '+(baseSize*maxScale)+'px YenSans, Arial, sans-serif';s.fillStyle='#fff';s.fillText('Y\u00eau em',width/2,height/2-12);
  const pixels=s.getImageData(0,0,width,height).data;particles=[];
  for(let y=0;y<height;y+=5)for(let x=0;x<width;x+=5){if(pixels[(y*width+x)*4+3]>90)particles.push({x,y,vx:(x-width/2)/(width*.5)*90+(Math.random()-.5)*90,vy:(y-height/2)/(height*.5)*70-30+(Math.random()-.5)*90,size:1.2+Math.random()*2.2,twinkle:Math.random()*6.3})}
 }

 function draw(now:number){
  if(!alive)return;const dt=last?Math.min(60,now-last)/1000:0;last=now;if(!document.hidden)clock+=dt;ctx!.clearRect(0,0,width,height);
  const cx=width/2,cy=height/2-12;
  const grow=reduce?1:smooth(clamp((clock-.3)/1.7,0,1));
  const scale=1+(maxScale-1)*grow;
  const fadeIn=clamp(clock/.3,0,1);
  const pulse=reduce?0:Math.sin(clock*2.4)*6;

  if(clock<2.15){
   ctx!.globalAlpha=fadeIn;ctx!.font='400 '+(baseSize*scale)+'px YenSans, Arial, sans-serif';
   ctx!.textAlign='center';ctx!.textBaseline='middle';ctx!.fillStyle='#f6e0ed';
   ctx!.shadowColor='#d4bce888';ctx!.shadowBlur=26+pulse;ctx!.fillText('Y\u00eau em',cx,cy);
  }else if(!reduce){
   const elapsed=clock-2.15;ctx!.shadowColor='#d4bce8aa';ctx!.shadowBlur=7;
   for(const p of particles){const x=p.x+p.vx*elapsed,y=p.y+p.vy*elapsed+28*elapsed*elapsed,alpha=clamp(1-elapsed/1.1,0,1)*(.72+.28*Math.sin(elapsed*12+p.twinkle));if(alpha<=0)continue;const r=p.size;ctx!.globalAlpha=alpha;ctx!.fillStyle='#f6e0ed';ctx!.beginPath();ctx!.moveTo(x,y-r*1.8);ctx!.lineTo(x+r*.32,y-r*.32);ctx!.lineTo(x+r*1.8,y);ctx!.lineTo(x+r*.32,y+r*.32);ctx!.lineTo(x,y+r*1.8);ctx!.lineTo(x-r*.32,y+r*.32);ctx!.lineTo(x-r*1.8,y);ctx!.lineTo(x-r*.32,y-r*.32);ctx!.closePath();ctx!.fill()}
  }
  ctx!.shadowBlur=0;ctx!.globalAlpha=1;raf=requestAnimationFrame(draw);
 }

 resize();window.addEventListener('resize',resize);raf=requestAnimationFrame(draw);
 return()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};
}
