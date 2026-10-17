import {makeProjector} from './space-math.mjs';
import {solarPlanets,orbitPoint} from './solar-math.mjs';
export function solarFrame(width,height){
 const portrait=height>width*1.1,roll=portrait?Math.PI/2:0;
 const view={width,height,unit:1,zoom:1,yaw:.12,pitch:.88,centerY:.46,distance:13,roll};
 const project=makeProjector(view),outer=solarPlanets[7];let maxX=0,maxY=0;
 for(let i=0;i<180;i++){
  const p=project(orbitPoint(outer,i/180*Math.PI*2));maxX=Math.max(maxX,Math.abs(p.x-width/2));maxY=Math.max(maxY,Math.abs(p.y-height*.46));
 }
 const side=width<650?24:60,top=height<540?60:85,bottom=height<540?100:170;
 const unit=Math.min((width/2-side)/maxX,Math.min(height*.46-top,height*(1-.46)-bottom)/maxY)*.94;
 return{unit:Math.max(14,unit),roll};
}
