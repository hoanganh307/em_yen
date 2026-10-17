import assert from 'node:assert/strict';
import {solarPlanets,planetPosition,moonPosition,yenPosition} from '../lib/solar-math.mjs';
import {heartPoint,project,focusAngles} from '../lib/space-math.mjs';
assert.equal(solarPlanets.length,8);assert.equal(solarPlanets.map(p=>p.name).join('|'),'Sao Thủy|Sao Kim|Trái Đất|Sao Hỏa|Sao Mộc|Sao Thổ|Sao Thiên Vương|Sao Hải Vương');
for(let i=1;i<solarPlanets.length;i++)assert.ok(solarPlanets[i].radius>solarPlanets[i-1].radius);
for(const t of [0,1,5,30,100]){const e=planetPosition(solarPlanets[2],t),moon=moonPosition(t);assert.ok(Math.abs(Math.hypot(moon.x-e.x,moon.z-e.z)-.19)<1e-8);for(const p of solarPlanets){const q=planetPosition(p,t);assert.ok(Math.abs(Math.hypot(q.x,q.z)-p.radius)<1e-8)}}
assert.notDeepEqual(yenPosition(0),yenPosition(1));assert.ok(solarPlanets[6].tilt>Math.PI/2);
for(let i=0;i<60;i++){const point=heartPoint(i/60*Math.PI*2,1.12,Math.sin(i)*.35),angles=focusAngles(point,7),p=project(point,{width:390,height:844,zoom:1,...angles});assert.ok(Math.abs(p.x-195)<1e-6);assert.ok(Math.abs(p.y-844*.52)<1e-6)}
console.log('PASS Hệ Mặt Trời: đủ 8 hành tinh, đúng thứ tự quỹ đạo; Mặt Trăng quay quanh Trái Đất; ảnh Yến có quỹ đạo riêng; camera xoay đưa mọi ảnh về chính giữa.');
