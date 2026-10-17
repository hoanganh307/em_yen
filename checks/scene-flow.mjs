import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as math from '../lib/space-math.mjs';
import * as solarMath from '../lib/solar-math.mjs';
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.dataset={};this.hidden=false;this.style={setProperty(){}};this.attributes={};this.classList={toggle(){}}}
 addEventListener(t,fn){(this.events[t]??=[]).push(fn)}removeEventListener(t,fn){this.events[t]=(this.events[t]||[]).filter(f=>f!==fn)}emit(t,e){for(const f of this.events[t]||[])f(e)}
 appendChild(e){this.children.push(e);e.parent=this}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this)}setAttribute(k,v){this.attributes[k]=v}focus(){}getContext(){return context}
}
const stats={strokes:0,fills:0},context=new Proxy({stroke(){stats.strokes++},fillRect(){stats.fills++},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
const canvas=new Element('canvas'),layer=new Element(),window=new Element(),document={hidden:false,createElement:t=>new Element(t),activeElement:null};
let now=1000,frame,active=false,opened=null,focused=null,solarFrames=0;
const exports={};const c=vm.createContext({exports,require:p=>p.includes('solar-math')?solarMath:p.includes('solar-renderer')?{createSolarRenderer:()=>({draw(){solarFrames++}})}:math,window,document,performance:{now:()=>now},innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>({matches:false}),requestAnimationFrame:f=>{frame=f;return 1},cancelAnimationFrame(){},console});
const source=ts.transpileModule(fs.readFileSync('lib/scene.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInContext(source,c);
const scene=exports.createScene(canvas,layer,{stage:x=>active=x,open:x=>opened=x,aligned(){},gesture(){},focused:id=>focused=id}),photos=Array.from({length:13},(_,i)=>({id:`photo${i}`,src:`/${i}.jpg`,title:`Ảnh ${i+1}`,wish:'...',order:i}));
scene.setPhotos(photos);assert.equal(layer.children.filter(x=>!x.hidden).length,1);layer.children[0].emit('click',{detail:0});assert.equal(active,true);assert.equal(layer.children.filter(x=>!x.hidden).length,13);layer.children[4].emit('click',{detail:0});assert.equal(opened,null);assert.equal(focused,'photo4');for(let i=0;i<100;i++)frame(i*16.7+16);assert.equal(opened,null);layer.children[4].emit('click',{detail:0});assert.equal(opened,'photo4');layer.children[6].emit('click',{detail:1});assert.equal(focused,'photo6');layer.children[6].emit('click',{detail:2});for(let i=0;i<100;i++)frame(2000+i*16.7);assert.equal(opened,'photo6');
scene.overview();assert.equal(active,false);assert.equal(layer.children.filter(x=>!x.hidden).length,1);
scene.setPhotos([...photos,{id:'extra',src:'/extra.jpg',title:'Thêm',wish:'...',order:14}]);assert.equal(layer.children.filter(x=>!x.hidden).length,1);
layer.emit('pointerdown',{pointerId:1,clientX:100,clientY:300,button:0});window.emit('pointermove',{pointerId:1,clientX:210,clientY:300});window.emit('pointerup',{pointerId:1});layer.children[0].emit('click',{detail:1});assert.equal(active,false);now+=300;layer.children[0].emit('click',{detail:1});assert.equal(active,true);assert.equal(layer.children.filter(x=>!x.hidden).length,14);
for(let i=0;i<120;i++)frame(4000+i*16.7);assert.ok(stats.strokes>200);assert.ok(stats.fills>10000);assert.ok(solarFrames>0);scene.destroy();assert.equal(layer.children.length,0);
console.log('PASS luồng cảnh: Hệ Mặt Trời được vẽ; chạm hành tinh Yến mở ngân hà ảnh; lần một chỉ chọn/xoay, lần hai mở lời chúc; double-click chờ xoay xong; quay lại còn đúng 1 ảnh; kéo không mở nhầm; sao băng liên tục.');
