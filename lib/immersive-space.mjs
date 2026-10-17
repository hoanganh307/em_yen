import {clamp} from './space-math.mjs';
export const DIVE_SECONDS=2.8;
export const smooth=value=>{const t=clamp(value,0,1);return t*t*(3-2*t)};
export function makeCameraProjector(view){
 const c=Math.cos(view.yaw??0),s=Math.sin(view.yaw??0),cp=Math.cos(view.pitch??0),sp=Math.sin(view.pitch??0),cameraZ=view.cameraZ??0,focal=Math.min(view.width,view.height)*.9*(view.zoom??1),cx=view.width/2,cy=view.height*(view.centerY??.5);
 return point=>{
  const x=point.x*c-point.z*s,z=point.x*s+point.z*c,y=point.y*cp-z*sp,zz=point.y*sp+z*cp,depth=zz-cameraZ;
  if(depth<=.13)return{x:0,y:0,depth,k:0,visible:false};
  const k=focal/depth,px=cx+x*k,py=cy+y*k;return{x:px,y:py,depth,k,visible:px> -80&&px<view.width+80&&py> -100&&py<view.height+100};
 };
}
export function cameraProject(point,view){return makeCameraProjector(view)(point)}
export function interiorPhotos(count){
 return Array.from({length:count},(_,i)=>{const angle=i/Math.max(1,count)*Math.PI*2,lat=i===0?0:(i%2?-.28:.28),r=3.7,ring=Math.sqrt(1-lat*lat);return{x:Math.sin(angle)*ring*r,y:lat*r,z:Math.cos(angle)*ring*r}});
}
export function panoramicPhotos(count,view){
 return interiorPhotos(count).map(p=>{const q=cameraProject(p,view),width=clamp(q.k*.92,30,Math.min(view.width*.6,310));return{...q,width,height:width*1.32}});
}
/** Mostly distant pinpoints, with a brighter stellar band and only a few luminous stars. */
export function makeSky(count,random=Math.random){
 return Array.from({length:count},(_,i)=>{
  let x,y,z;
  if(i%3){const a=random()*Math.PI*2,lat=(random()+random()+random()-1.5)*.18;x=Math.cos(a);y=Math.sin(a)*.24+lat;z=Math.sin(a);const norm=Math.hypot(x,y,z);x/=norm;y/=norm;z/=norm}else{y=1-random()*2;const a=random()*Math.PI*2,s=Math.sqrt(1-y*y);x=Math.cos(a)*s;z=Math.sin(a)*s}
  const luminous=random(),r=2.9+random()*.45;
  return{x:x*r,y:y*r,z:z*r,size:luminous>.996?2.1:luminous>.97?1.15:.28+random()*.5,glow:luminous>.986,phase:random()*Math.PI*2,color:i%11===0?2:i%7===0?1:0};
 });
}
