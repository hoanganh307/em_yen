import {clamp,makeProjector} from './space-math.mjs';
export const PHOTO_SPHERE_RADIUS=3.2;
export function sceneLayout(width,height){
 return{portrait:height>width*1.1,unit:Math.max(18,Math.min((width-64)/7.7,Math.max(150,height-170)/7.7))};
}
/** A thin star shell keeps the globe visible without concentrating all the stars at its centre. */
export function makeParticles(count,_portrait,random=Math.random){
 return Array.from({length:count},(_,i)=>{
  const y=1-random()*2,angle=random()*Math.PI*2,s=Math.sqrt(1-y*y),r=i%6===0?1.7+Math.cbrt(random())*1.35:2.85+(random()-.5)*.5;
  return{x:Math.cos(angle)*s*r,y:y*r,z:Math.sin(angle)*s*r,phase:random()*Math.PI*2,size:.25+random()*.88,color:i%4};
 });
}
export function photoLayout(count){
 const golden=Math.PI*(3-Math.sqrt(5));
 return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,a=i*golden+.4,s=Math.sqrt(1-y*y);return{x:Math.cos(a)*s*PHOTO_SPHERE_RADIUS,y:y*PHOTO_SPHERE_RADIUS,z:Math.sin(a)*s*PHOTO_SPHERE_RADIUS}});
}
export function photoDimensions(width,count,_unit=100,height=900){
 const factor=clamp(Math.sqrt(18/Math.max(18,count)),.42,1),w=Math.min(width<350?50:width<650?clamp(width*.17,50,68):108,height<480?height*.14:108)*factor;
 return{width:w,height:w*1.32};
}
/** Relax collisions in screen space while keeping the 3D anchors and depth. All photographs stay present. */
export function photoSphere(count,view,dimensions){
 const project=makeProjector(view),items=photoLayout(count).map(p=>{const q=project(p);return{...q,anchorX:q.x,anchorY:q.y,scale:clamp(Math.sqrt(q.k),.84,1.15)}});
 const minY=62,maxY=view.height-58;
 for(let step=0;step<72;step++){
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j],dx=a.x-b.x,dy=a.y-b.y;
   const ox=dimensions.width*(a.scale+b.scale)/2+7-Math.abs(dx),oy=dimensions.height*(a.scale+b.scale)/2+7-Math.abs(dy);
   if(ox<=0||oy<=0)continue;
   const signX=dx<0?-1:1,signY=dy<0?-1:1,aw=dimensions.width*a.scale/2+10,bw=dimensions.width*b.scale/2+10,ah=dimensions.height*a.scale/2,bh=dimensions.height*b.scale/2;
   const capAX=Math.max(0,signX>0?view.width-aw-a.x:a.x-aw),capBX=Math.max(0,signX>0?b.x-bw:view.width-bw-b.x);
   const capAY=Math.max(0,signY>0?maxY-ah-a.y:a.y-minY-ah),capBY=Math.max(0,signY>0?b.y-minY-bh:maxY-bh-b.y);
   const preferX=step>40?view.width>view.height:ox<oy,useX=(preferX&&capAX+capBX>=ox+.2)||capAY+capBY<oy+.2;
   const needed=(useX?ox:oy)+.2,capA=useX?capAX:capAY,capB=useX?capBX:capBY;
   let moveA=Math.min(needed/2,capA),moveB=Math.min(needed-moveA,capB);moveA=Math.min(needed-moveB,capA);
   if(useX){a.x+=signX*moveA;b.x-=signX*moveB}else{a.y+=signY*moveA;b.y-=signY*moveB}

  }
  for(const p of items){
   if(step<16){p.x+=(p.anchorX-p.x)*.018;p.y+=(p.anchorY-p.y)*.018}
   const halfW=dimensions.width*p.scale/2+10,halfH=dimensions.height*p.scale/2;
   p.x=clamp(p.x,halfW,view.width-halfW);p.y=clamp(p.y,minY+halfH,maxY-halfH);
  }
 }
 return items;
}
export function photoAppearance(point){
 return{scale:point.scale??clamp(Math.sqrt(point.k),.84,1.15),opacity:1,blur:0};
}
