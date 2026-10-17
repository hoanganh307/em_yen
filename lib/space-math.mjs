export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function heartPoint(t,r=1,depth=0){return{x:Math.pow(Math.sin(t),3)*1.55*r,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17*1.55*r,z:depth}}
export function project(p,v){
  const px=p.x-(v.target?.x??0),py=p.y-(v.target?.y??0),pz=p.z-(v.target?.z??0);
  const c=Math.cos(v.yaw),s=Math.sin(v.yaw),x=px*c-pz*s,z=px*s+pz*c;
  const cp=Math.cos(v.pitch),sp=Math.sin(v.pitch),y=py*cp-z*sp,zz=py*sp+z*cp;
  const distance=v.distance??12,k=distance/Math.max(1,distance+zz);
  const unit=(v.unit??Math.min(v.width*.4,v.height*.36))*v.zoom;
  const cr=Math.cos(v.roll??0),sr=Math.sin(v.roll??0);return{x:v.width/2+(x*cr-y*sr)*unit*k,y:v.height*(v.centerY??.48)+(x*sr+y*cr)*unit*k,k,z:zz};
}
export function pinch(a,b){return{distance:Math.hypot(a.x-b.x,a.y-b.y),angle:Math.atan2(b.y-a.y,b.x-a.x)}}
export function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
export function focusAngles(point,currentYaw=0){
  const radius=Math.hypot(point.x,point.z),yaw=Math.atan2(-point.x,-point.z);
  return{yaw:currentYaw+angleDelta(yaw,currentYaw),pitch:Math.atan2(-point.y,radius)};
}
export function makeProjector(v){
 const c=Math.cos(v.yaw),s=Math.sin(v.yaw),cp=Math.cos(v.pitch),sp=Math.sin(v.pitch);
 const tx=v.target?.x??0,ty=v.target?.y??0,tz=v.target?.z??0,d=v.distance??12;
 const unit=(v.unit??Math.min(v.width*.4,v.height*.36))*v.zoom,cx=v.width/2,cy=v.height*(v.centerY??.48),cr=Math.cos(v.roll??0),sr=Math.sin(v.roll??0);
 return p=>{const px=p.x-tx,py=p.y-ty,pz=p.z-tz,x=px*c-pz*s,z=px*s+pz*c,y=py*cp-z*sp,zz=py*sp+z*cp,k=d/Math.max(1,d+zz);return{x:cx+(x*cr-y*sr)*unit*k,y:cy+(x*sr+y*cr)*unit*k,z:zz,k}};
}
