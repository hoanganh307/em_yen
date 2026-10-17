import {makeCameraProjector,makeSky} from './immersive-space.mjs';
export function createStarRenderer(mobile:boolean){
 const stars=makeSky(mobile?10500:19000),colors=['#edf2fa','#bfcfff','#ffe1b5'];
 const halo=document.createElement('canvas');halo.width=halo.height=48;const h=halo.getContext('2d')!,g=h.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,'#fffdf7');g.addColorStop(.06,'#eee8ffdf');g.addColorStop(.19,'#b5c6ff35');g.addColorStop(1,'#9fbcff00');h.fillStyle=g;h.fillRect(0,0,48,48);
 const mist=document.createElement('canvas');mist.width=mist.height=128;const m=mist.getContext('2d')!,mg=m.createRadialGradient(64,64,0,64,64,64);mg.addColorStop(0,'#7382a622');mg.addColorStop(.4,'#615b8c0d');mg.addColorStop(1,'#615b8c00');m.fillStyle=mg;m.fillRect(0,0,128,128);
 let bins=new Uint8Array(1),columns=1,lastWidth=0,lastHeight=0;
 return {draw(ctx:CanvasRenderingContext2D,view:{width:number;height:number;yaw:number;pitch:number;cameraZ:number;zoom:number;centerY:number},clock:number,alpha=1,warp=0){
  const w=view.width,h=view.height,project=makeCameraProjector(view);if(w!==lastWidth||h!==lastHeight){columns=Math.ceil(w/3);bins=new Uint8Array(columns*Math.ceil(h/3));lastWidth=w;lastHeight=h}bins.fill(0);
  // A faint continuous galactic haze moves with the same camera as the stars.
  ctx.globalAlpha=alpha*.45;for(let i=0;i<16;i++){const a=i/16*Math.PI*2,p=project({x:Math.cos(a)*3,y:Math.sin(a)*.72,z:Math.sin(a)*3});if(!p.visible)continue;const size=Math.min(w*1.4,p.k*2.2);ctx.drawImage(mist,p.x-size/2,p.y-size*.32,size,size*.64)}
  for(let i=0;i<stars.length;i++){
   const s=stars[i],p=project(s);if(!p.visible||p.x<0||p.x>=w||p.y<0||p.y>=h)continue;
   const bin=Math.floor(p.y/3)*columns+Math.floor(p.x/3);if(bins[bin]>=2)continue;bins[bin]++;
   const size=Math.min(2.8,s.size*(view.cameraZ< -4?.8:1.1)),brightness=(s.glow?.9:.25+.32*(.5+.5*Math.sin(clock*.15+s.phase)))*alpha;
   ctx.globalAlpha=brightness;ctx.fillStyle=colors[s.color];ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.25,size/2),0,Math.PI*2);ctx.fill();
   if(s.glow){ctx.globalAlpha=brightness*.75;const r=size*7;ctx.drawImage(halo,p.x-r/2,p.y-r/2,r,r);if(s.size>2){ctx.globalAlpha=brightness*.45;ctx.strokeStyle=colors[s.color];ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(p.x-4,p.y);ctx.lineTo(p.x+4,p.y);ctx.moveTo(p.x,p.y-4);ctx.lineTo(p.x,p.y+4);ctx.stroke()}}
   if(warp>.02&&i%7===0){const cx=w/2,cy=h*.5,len=warp*.16;ctx.globalAlpha=brightness*.6;ctx.strokeStyle=colors[s.color];ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(p.x-cx)*len,p.y+(p.y-cy)*len);ctx.stroke()}
  }
  ctx.globalAlpha=1;
 }};
}
