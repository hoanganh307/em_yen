import {test} from 'node:test';
import assert from 'node:assert/strict';
import {solarPlanets,planetPosition,moonPosition,eccentricAnomaly,SIMULATED_DAYS_PER_SECOND} from '../lib/solar-math.mjs';
import {cameraProject,panoramicPhotos,interiorPhotos,makeSky} from '../lib/immersive-space.mjs';
import {makeProjector} from '../lib/space-math.mjs';
test('Eight planets follow closed Kepler ellipses; the Moon moves with Earth',()=>{
 assert.equal(solarPlanets.length,8);assert.equal(solarPlanets[0].id,'mercury');assert.equal(solarPlanets[7].id,'neptune');
 for(const planet of solarPlanets){const a=planetPosition(planet,0),b=planetPosition(planet,planet.period/SIMULATED_DAYS_PER_SECOND);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-10);for(const time of [0,1,10,100]){const p=planetPosition(planet,time),r=Math.hypot(p.x,p.y,p.z);assert.ok(r>=planet.radius*(1-planet.eccentricity)-1e-9&&r<=planet.radius*(1+planet.eccentricity)+1e-9)}}
 for(const m of [0,.1,1,2,3,5.9]){const e=eccentricAnomaly(m,.206);assert.ok(Math.abs(e-.206*Math.sin(e)-m)<1e-12)}
 assert.ok(solarPlanets[1].spin<0&&solarPlanets[6].spin<0);
 for(const time of [0,10,30,150]){const e=planetPosition(solarPlanets[2],time),m=moonPosition(time),r=Math.hypot(m.x-e.x,m.y-e.y,m.z-e.z);assert.ok(r>.34&&r<.4)}
});
for(const [width,height] of [[1440,900],[1366,768],[1920,1080],[390,844],[360,740],[320,568],[844,390],[768,1024]]){
 test('The interior panorama is finite and every picture is reachable at '+width+'×'+height,()=>{
  const seen=new Set();
  for(let step=0;step<36;step++){
   const view={width,height,yaw:step*Math.PI/18,pitch:0,cameraZ:0,zoom:1};
   const items=panoramicPhotos(13,view);assert.equal(items.length,13);
   for(let i=0;i<items.length;i++){const p=items[i];assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.width)&&p.width>0);if(p.visible)seen.add(i)}
  }
  assert.equal(seen.size,13);
  const a=cameraProject({x:0,y:0,z:3.7},{width,height,yaw:0,pitch:0,cameraZ:0,zoom:1});assert.ok(a.visible);assert.equal(a.x,width/2);assert.equal(a.y,height/2);
  assert.equal(cameraProject({x:0,y:0,z:-3},{width,height,cameraZ:0}).visible,false,'Objects behind the camera are culled');
 });
}
test('The new star sky has a distant spherical field, sparse bright stars and a continuous stellar band',()=>{
 let seed=123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
 const stars=makeSky(19000,random);assert.ok(stars.every(p=>Math.hypot(p.x,p.y,p.z)>2.8));assert.ok(stars.filter(p=>p.glow).length<stars.length*.025);assert.ok(stars.filter(p=>Math.abs(p.y)<1.2).length>stars.length*.6);
 for(const p of interiorPhotos(13))assert.ok(Math.abs(Math.hypot(p.x,p.y,p.z)-3.7)<1e-10);
});
