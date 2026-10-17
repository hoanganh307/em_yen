import assert from 'node:assert/strict';
import {heartPoint,project,pinch,angleDelta} from '../lib/space-math.mjs';
const v={width:390,height:844,yaw:0,pitch:0,zoom:1};
// Trái tim có hai thùy đối xứng và đáy nhọn khi nhìn chính diện.
const left=project(heartPoint(Math.PI/2),v),right=project(heartPoint(3*Math.PI/2),v),bottom=project(heartPoint(Math.PI),v);
assert.ok(left.x>v.width/2&&right.x<v.width/2);assert.ok(Math.abs(left.y-right.y)<1e-6);assert.ok(bottom.y>left.y);assert.ok(Math.abs(bottom.x-v.width/2)<1e-6);
for(let i=0;i<500;i++)for(const yaw of [0,.82,Math.PI/2,Math.PI])for(const zoom of [.35,2.6]){const p=project(heartPoint(i/500*Math.PI*2,.8,(i%7-3)/3),{...v,yaw,zoom,pitch:1.3});assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.k>0)}
assert.equal(pinch({x:0,y:0},{x:100,y:0}).distance,100);assert.ok(Math.abs(angleDelta(-Math.PI+.01,Math.PI-.01)-.02)<1e-8);
console.log('PASS hình học: nhìn chính diện thành trái tim, xoay và thu phóng không sinh tọa độ lỗi.');
