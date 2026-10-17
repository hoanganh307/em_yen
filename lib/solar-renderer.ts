import {planetPosition,moonPosition,solarPlanets,orbitPoint,spinAngle} from './solar-math.mjs';
import {makeProjector} from './space-math.mjs';
type View={width:number;height:number;yaw:number;pitch:number;zoom:number;unit:number;roll?:number;distance?:number;centerY?:number;target?:{x:number;y:number;z:number}};
type Kind='sun'|'mercury'|'venus'|'earth'|'mars'|'jupiter'|'saturn'|'uranus'|'neptune'|'moon';
export type CelestialHit={id:string;name:string;x:number;y:number;r:number;z:number};
interface Atlas{data:Uint8ClampedArray;width:number;height:number;frames:Map<string,HTMLCanvasElement>}
export function createSolarRenderer(){
 const maps=new Map<Kind,Atlas>();let alive=true;
 const palette:Record<Kind,[number,number,number]>={sun:[250,170,44],mercury:[144,135,123],venus:[221,184,126],earth:[36,104,174],mars:[188,83,48],jupiter:[201,163,125],saturn:[209,186,145],uranus:[140,205,214],neptune:[48,90,197],moon:[165,162,157]};
 function fallback(kind:Kind){
  const c=document.createElement('canvas');c.width=512;c.height=256;const k=c.getContext('2d')!,data=k.createImageData(512,256),color=palette[kind];
  for(let y=0;y<256;y++)for(let x=0;x<512;x++){
   const band=kind==='jupiter'||kind==='saturn'?Math.sin(y*.23+Math.sin(x*.025)*.8)*.15:Math.sin(x*.067+Math.cos(y*.05))*Math.cos(y*.11)*.1;
   const i=(y*512+x)*4;data.data[i]=color[0]*(1+band);data.data[i+1]=color[1]*(1+band);data.data[i+2]=color[2]*(1+band);data.data[i+3]=255;
  }
  return{data:data.data,width:512,height:256,frames:new Map<string,HTMLCanvasElement>()};
 }
 for(const kind of Object.keys(palette) as Kind[]){
  maps.set(kind,fallback(kind));
  if(typeof Image==='undefined')continue;
  const image=new Image();image.onload=()=>{
   if(!alive)return;const c=document.createElement('canvas');c.width=1024;c.height=512;const k=c.getContext('2d')!;
   k.drawImage(image,0,0,c.width,c.height);maps.set(kind,{data:k.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height,frames:new Map()});
  };image.src='/assets/planets/'+kind+'.jpg';
 }
 function sphere(kind:Kind,rotation:number,lightX:number,lightY:number){
  const atlas=maps.get(kind)!,frames=72,frame=((Math.floor(rotation/(Math.PI*2)*frames)%frames)+frames)%frames;
  const light=Math.round(Math.atan2(lightY,lightX)*12/Math.PI),key=String(frame)+'-'+light;
  const cached=atlas.frames.get(key);if(cached)return cached;
  const size=192,c=document.createElement('canvas');c.width=c.height=size;const k=c.getContext('2d')!,out=k.createImageData(size,size),r=size/2;
  const angle=light*Math.PI/12,lx=Math.cos(angle)*.87,ly=Math.sin(angle)*.87,lz=.5;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const nx=(x+.5-r)/r,ny=(y+.5-r)/r,d=nx*nx+ny*ny;if(d>=1)continue;
   const nz=Math.sqrt(1-d),u=((Math.atan2(nx,nz)/(Math.PI*2)+.5+frame/frames)%1+1)%1,v=Math.asin(ny)/Math.PI+.5;
   const source=(Math.min(atlas.height-1,Math.floor(v*atlas.height))*atlas.width+Math.min(atlas.width-1,Math.floor(u*atlas.width)))*4,index=(y*size+x)*4;
   const day=Math.max(0,nx*lx+ny*ly+nz*lz),shade=kind==='sun'?1:.18+.82*Math.pow(day,.7);
   out.data[index]=atlas.data[source]*shade;out.data[index+1]=atlas.data[source+1]*shade;out.data[index+2]=atlas.data[source+2]*shade;out.data[index+3]=Math.min(255,(1-d)*size*255);
  }
  k.putImageData(out,0,0);atlas.frames.set(key,c);
  if(atlas.frames.size>24)atlas.frames.delete(atlas.frames.keys().next().value!);
  return c;
 }
 function rings(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,front:boolean,thin=false){
  ctx.save();ctx.translate(x,y);ctx.rotate(thin?1.2:-.32);
  const bands=thin?3:20;
  for(let i=0;i<bands;i++){
   const q=i/Math.max(1,bands-1),radius=r*(1.4+q*.85);
   ctx.lineWidth=thin?.8:r*.055;ctx.strokeStyle=thin?'rgba(171,224,225,.3)':'rgba('+Math.round(209-q*25)+','+Math.round(188-q*26)+','+Math.round(145-q*30)+','+(i===12?.15:.6)+')';
   ctx.beginPath();ctx.ellipse(0,0,radius,radius*.3,0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
 function draw(ctx:CanvasRenderingContext2D,view:View,time:number,opacity=1):CelestialHit[]{
  if(opacity<.004)return[];
  const project=makeProjector(view),small=view.width<650,sun=project({x:0,y:0,z:0});
  const sizeScale=(small?.66*Math.min(1.22,view.unit/32):Math.min(1,view.unit/58))*Math.pow(view.zoom,.45);
  ctx.save();ctx.globalAlpha=opacity;
  for(const planet of solarPlanets){
   ctx.beginPath();for(let i=0;i<=160;i++){const p=project(orbitPoint(planet,i/160*Math.PI*2));i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}
   ctx.strokeStyle=planet.id==='earth'?'#9ebbd347':'#a1b0d01e';ctx.lineWidth=planet.id==='earth'?.9:.65;ctx.stroke();
  }
  // The asteroid belt is decorative and kept very faint.
  ctx.fillStyle='#c7bbad';for(let i=0;i<170;i++){
   const a=i*2.39996+time*.008,r=2.7+(Math.sin(i*7.1)*.5+.5)*.16,p=project({x:Math.cos(a)*r,y:Math.sin(i)*.035,z:Math.sin(a)*r});
   ctx.globalAlpha=opacity*(.08+(i%5)*.025);ctx.fillRect(p.x,p.y,1,1);
  }ctx.globalAlpha=opacity;
  const bodies=[...solarPlanets.map(p=>({...p,position:planetPosition(p,time)})),
   {id:'sun',name:'Mặt Trời',size:small?35:42,spin:600,tilt:0,position:{x:0,y:0,z:0}},
   {id:'moon',name:'Mặt Trăng',size:5.4,spin:655.7,tilt:.12,position:moonPosition(time)}]
   .map(b=>({...b,screen:project(b.position)})).sort((a,b)=>b.screen.z-a.screen.z);
  const hits:CelestialHit[]=[],labels:{x:number;y:number;w:number;h:number}[]=[];
  for(const body of bodies){
   const {x,y,k,z}=body.screen,kind=body.id as Kind,r=body.size*sizeScale*k;
   if(x+r*2<0||x-r*2>view.width||y+r*2<0||y-r*2>view.height)continue;
   if(kind==='sun'){
    const halo=ctx.createRadialGradient(x,y,r*.72,x,y,r*4.2);halo.addColorStop(0,'#ffc15b9c');halo.addColorStop(.25,'#ff973644');halo.addColorStop(.6,'#e4681710');halo.addColorStop(1,'#ff980000');ctx.fillStyle=halo;ctx.fillRect(x-r*4.2,y-r*4.2,r*8.4,r*8.4);
   }else if(kind==='earth'||kind==='uranus'||kind==='neptune'){
    const halo=ctx.createRadialGradient(x,y,r*.92,x,y,r*1.23);halo.addColorStop(0,'#6dc7f800');halo.addColorStop(.32,kind==='earth'?'#74caff7a':'#6b9bf53f');halo.addColorStop(1,'#6b9bf500');ctx.fillStyle=halo;ctx.fillRect(x-r*1.23,y-r*1.23,r*2.46,r*2.46);
   }
   if(kind==='saturn'||kind==='uranus')rings(ctx,x,y,r,false,kind==='uranus');
   const lightX=sun.x-x,lightY=sun.y-y;
   ctx.save();ctx.translate(x,y);ctx.rotate(body.tilt);
   const c=Math.cos(body.tilt),s=Math.sin(body.tilt);
   ctx.drawImage(sphere(kind,spinAngle(body.spin,time),lightX*c+lightY*s,-lightX*s+lightY*c),-r,-r,r*2,r*2);ctx.restore();
   if(kind==='saturn'||kind==='uranus')rings(ctx,x,y,r,true,kind==='uranus');
   if(kind!=='sun'&&kind!=='moon')hits.push({id:kind,name:body.name,x,y,r,z});
   if(kind==='moon'&&view.zoom<1.35)continue;
   ctx.font=(small?11:13)+'px YenSans, Arial, sans-serif';ctx.textAlign='center';ctx.fillStyle=kind==='earth'?'#ceeaff':kind==='sun'?'#eecb91':'#d4d9e5';ctx.shadowColor='#000';ctx.shadowBlur=7;
   const width=ctx.measureText(body.name).width+10,labelX=Math.max(width/2+4,Math.min(view.width-width/2-4,x));
   let chosenY=y+r+18;
   for(const offset of [0,16,-r*2-36,-r*2-52]){
    const box={x:labelX-width/2,y:y+r+18+offset-12,w:width,h:15};
    if(box.y<65||box.y+box.h>view.height-80)continue;
    if(!labels.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y)){chosenY=y+r+18+offset;labels.push(box);break}
   }
   if(chosenY>=65&&chosenY<=view.height-75)ctx.fillText(body.name,labelX,chosenY);ctx.shadowBlur=0;
  }
  ctx.restore();return hits;
 }
 return{draw,destroy(){alive=false;for(const atlas of maps.values())atlas.frames.clear();maps.clear()}};
}
