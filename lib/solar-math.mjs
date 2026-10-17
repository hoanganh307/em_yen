// Orbital periods, eccentricity and axial tilt: NASA Planetary Fact Sheet.
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/
// Distances and sizes are compressed for legibility. This is not an ephemeris.
export const SIMULATED_DAYS_PER_SECOND = 3;
const rad = degrees => degrees * Math.PI / 180;
export const solarPlanets = [
  {id:'mercury',name:'Sao Thủy',radius:1.1,size:10,period:88,eccentricity:.206,inclination:7,phase:4.3,spin:1407.6,tilt:rad(.034)},
  {id:'venus',name:'Sao Kim',radius:1.5,size:15,period:224.7,eccentricity:.007,inclination:3.4,phase:2.55,spin:-5832.5,tilt:rad(177.4)},
  {id:'earth',name:'Trái Đất',radius:1.95,size:20,period:365.2,eccentricity:.017,inclination:0,phase:.62,spin:23.9,tilt:rad(23.4)},
  {id:'mars',name:'Sao Hỏa',radius:2.4,size:12,period:687,eccentricity:.094,inclination:1.8,phase:4.95,spin:24.6,tilt:rad(25.2)},
  {id:'jupiter',name:'Sao Mộc',radius:3.1,size:33,period:4331,eccentricity:.049,inclination:1.3,phase:3.05,spin:9.9,tilt:rad(3.1)},
  {id:'saturn',name:'Sao Thổ',radius:3.85,size:28,period:10747,eccentricity:.052,inclination:2.5,phase:1.43,spin:10.7,tilt:rad(26.7)},
  {id:'uranus',name:'Sao Thiên Vương',radius:4.55,size:21,period:30589,eccentricity:.047,inclination:.8,phase:5.6,spin:-17.2,tilt:rad(97.8)},
  {id:'neptune',name:'Sao Hải Vương',radius:5.2,size:20,period:59800,eccentricity:.01,inclination:1.8,phase:.05,spin:16.1,tilt:rad(28.3)}
];
export function eccentricAnomaly(mean, eccentricity) {
  const m = ((mean % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
  let e = m;
  for (let i=0;i<7;i++) e -= (e-eccentricity*Math.sin(e)-m)/(1-eccentricity*Math.cos(e));
  return e;
}
export function orbitPoint(planet, meanAnomaly) {
  const a=planet.radius, e=planet.eccentricity, anomaly=eccentricAnomaly(meanAnomaly,e);
  const z=a*Math.sqrt(1-e*e)*Math.sin(anomaly), tilt=rad(planet.inclination);
  return {x:a*(Math.cos(anomaly)-e), y:-z*Math.sin(tilt), z:z*Math.cos(tilt)};
}
export function planetPosition(planet,time) {
  return orbitPoint(planet,planet.phase+time*SIMULATED_DAYS_PER_SECOND/planet.period*Math.PI*2);
}
export function moonPosition(time) {
  const earth=planetPosition(solarPlanets[2],time);
  const local=orbitPoint({radius:.37,eccentricity:.055,inclination:5.1},2+time*SIMULATED_DAYS_PER_SECOND/27.3*Math.PI*2);
  return {x:earth.x+local.x,y:earth.y+local.y,z:earth.z+local.z};
}
// Rotation animation is slowed separately so surface features remain visible.
export function spinAngle(periodHours,time) {return time*.45*23.9/periodHours}
