import {clamp} from './space-math.mjs';
import {smooth} from './immersive-space.mjs';

/** Grow "Yêu em" to near full-screen width and hold shining waiting for user tap. */
export function createLoveBloom(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let raf=0,last=0,clock=0,alive=true,width=innerWidth,height=innerHeight,baseSize=53,maxScale=1;

 function resize(){
  width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx!.setTransform(dpr,0,0,dpr,0,0);
  baseSize=width<650?53:height<540?48:clamp(width*.08,47,90);
  const sample=document.createElement('canvas');sample.width=Math.ceil(baseSize*5);sample.height=Math.ceil(baseSize*2);const s=sample.getContext('2d')!;
  s.font='400 '+baseSize+'px YenSans, Arial, sans-serif';s.textAlign='center';s.textBaseline='middle';
  const textWidth=s.measureText('Yêu em').width;maxScale=Math.min(width*.88/textWidth,height*.68/baseSize);
 }

 function draw(now:number){
  if(!alive)return;const dt=last?Math.min(60,now-last)/1000:0;last=now;if(!document.hidden)clock+=dt;ctx!.clearRect(0,0,width,height);
  const cx=width/2,cy=height/2-12;
  const grow=reduce?1:smooth(clamp((clock-.3)/1.7,0,1));
  const scale=1+(maxScale-1)*grow;
  const fadeIn=clamp(clock/.3,0,1);
  const pulse=reduce?0:Math.sin(clock*2.4)*6;

  ctx!.globalAlpha=fadeIn;
  ctx!.font='400 '+(baseSize*scale)+'px YenSans, Arial, sans-serif';
  ctx!.textAlign='center';ctx!.textBaseline='middle';ctx!.fillStyle='#f6e0ed';
  ctx!.shadowColor='#d4bce888';ctx!.shadowBlur=26+pulse;
  ctx!.fillText('Yêu em',cx,cy);
  ctx!.shadowBlur=0;ctx!.globalAlpha=1;
  raf=requestAnimationFrame(draw);
 }

 resize();window.addEventListener('resize',resize);raf=requestAnimationFrame(draw);
 return()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};
}
