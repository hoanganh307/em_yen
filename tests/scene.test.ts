import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScene} from '../lib/scene';
import {defaultPhotos} from '../lib/photos';
import {STORY_STAGES,FLIGHT_SECONDS,WONDER_TEXT,MEMORY_ONE,type JourneyStage} from '../lib/journey';
import {DIVE_SECONDS} from '../lib/immersive-space.mjs';
function setup(){
 let frame:FrameRequestCallback=()=>{};const gradient={addColorStop(){}};
 const context=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient,createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(_x:number,_y:number,w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:(text:string)=>({width:text.length*6})},{get:(target,key)=>Reflect.get(target,key)??(()=>{}),set:(target,key,value)=>{Reflect.set(target,key,value);return true}});
 class Element extends EventTarget{
  hidden=false;dataset:Record<string,string>={};style=new Proxy({setProperty(){}},{set:(target,key,value)=>{Reflect.set(target,key,value);return true}});
  className='';classList={toggle(){}};children:Element[]=[];attributes=new Map<string,string>();width=100;height=100;tabIndex=0;parent:Element|null=null;
  appendChild(node:Element){node.parent=this;this.children.push(node)}remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this)}
  setAttribute(k:string,v:string){this.attributes.set(k,v)}getContext(){return context}focus(){}
 }
 const window=new EventTarget(),layer=new Element(),canvas=new Element();
 Object.assign(globalThis,{window,innerWidth:390,innerHeight:844,devicePixelRatio:1,matchMedia:()=>({matches:false}),document:{createElement:()=>new Element(),hidden:false,activeElement:null},requestAnimationFrame:(callback:FrameRequestCallback)=>{frame=callback;return 1},cancelAnimationFrame:()=>{}});
 let timestamp=100;const advance=(seconds:number)=>{for(let i=0;i<Math.ceil(seconds*20);i++){timestamp+=50;frame(timestamp)}};
 const event=(type:string,properties:Record<string,unknown>={})=>Object.assign(new Event(type,{cancelable:true}),properties);
 return{layer,canvas,window,event,advance};
}
test('Any planet starts the black-screen story, which waits for text to finish',()=>{
 const {layer,canvas,event,advance}=setup();let stage:JourneyStage='intro';
 const scene=createScene(canvas as unknown as HTMLCanvasElement,layer as unknown as HTMLDivElement,{stage:value=>{stage=value},open(){},gesture(){}});
 scene.setPhotos(defaultPhotos);
 for(const planet of ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']){
  scene.beginSolar();advance(.1);layer.children.find(c=>c.dataset.planetId===planet)!.dispatchEvent(event('click',{detail:0}));assert.equal(stage,'departure');assert.ok(layer.children.every(c=>c.hidden));
 }
 advance(20);assert.equal(stage,'departure','Typing cannot be cut off by a fixed scene timeout');
 scene.destroy();
});
test('The new question precedes the answer; the camera flies into a complete, sharp 360 gallery',()=>{
 const {layer,canvas,event,advance}=setup();let stage:JourneyStage='intro',focused:string|null=null;const opened:string[]=[];
 const scene=createScene(canvas as unknown as HTMLCanvasElement,layer as unknown as HTMLDivElement,{stage:value=>{stage=value},focused:id=>{focused=id},open:id=>opened.push(id),gesture(){}});
 scene.setPhotos(defaultPhotos);scene.beginSolar();advance(.1);layer.children.find(c=>c.dataset.planetId==='earth')!.dispatchEvent(event('click',{detail:0}));
 assert.equal(stage,'departure');assert.equal(WONDER_TEXT,'Theo em thì ở đâu là nơi đặc biệt nhất?');assert.match(MEMORY_ONE,/Đối với anh/);assert.deepEqual(STORY_STAGES,['departure','wonder','memory-one','memory-two','love']);
 for(const next of STORY_STAGES.slice(1)){scene.advanceStory();assert.equal(stage,next);assert.ok(layer.children.every(c=>c.hidden))}
 scene.advanceStory();assert.equal(stage,'flight');advance(FLIGHT_SECONDS+.15);assert.equal(stage,'galaxy');
 const photoNodes=()=>layer.children.filter(c=>c.dataset.photoId);
 assert.ok(photoNodes().every(c=>c.hidden),'Only the star globe is shown before it is clicked');
 advance(8);assert.ok(photoNodes().every(c=>c.hidden),'Waiting does not open the photos');
 const core=layer.children.find(c=>c.className==='galaxy-core-hit')!;assert.equal(core.hidden,false);core.dispatchEvent(event('click',{detail:0}));advance(.7);
 assert.ok(photoNodes().every(c=>c.tabIndex===-1),'The flight into the sphere finishes before images become clickable');
 advance(DIVE_SECONDS);assert.ok(photoNodes().every(c=>c.dataset.available==='true'),'All photos are available immediately inside the sphere');
 const visible=photoNodes().filter(c=>!c.hidden);assert.ok(visible.length>=1&&visible.length<defaultPhotos.length,'The camera sees the front of a surrounding panorama');
 for(const p of visible){const style=p.style as unknown as Record<string,string>;assert.equal(style.filter,'none');assert.equal(Number(style.opacity),1)}
 const photo=visible[0];assert.ok(photo);assert.equal(photo.attributes.get('aria-pressed'),'false');
 photo.dispatchEvent(event('click',{detail:0}));assert.equal(focused,photo.dataset.photoId);assert.deepEqual(opened,[]);
 advance(1);const transform=String((photo.style as unknown as Record<string,string>).transform),xy=/translate\(([-.0-9]+)px,([-.0-9]+)px\)/.exec(transform)!;assert.ok(xy);assert.ok(Math.abs(Number(xy[1])-195)<1);assert.ok(Math.abs(Number(xy[2])-844*.5)<1,'First click centres the picture');assert.ok(!transform.includes('scale('),'Focused images use real dimensions instead of scaling a small raster');assert.ok(parseFloat((photo.style as unknown as Record<string,string>).width)>250,'The first click renders the original image at a large native display size');
 photo.dispatchEvent(event('click',{detail:0}));assert.deepEqual(opened,[photo.dataset.photoId],'Second click opens its own letter');
 scene.clearSelection();assert.equal(focused,null);scene.closeGallery();assert.ok(photoNodes().every(c=>c.hidden));advance(DIVE_SECONDS+.1);assert.equal(core.hidden,false);scene.overview();assert.equal(stage,'solar');scene.restart();assert.equal(stage,'intro');assert.ok(layer.children.every(c=>c.hidden));scene.destroy();
});
test('Rotating inside visits every photo without an unlock threshold and returns smoothly outside',()=>{
 const {layer,canvas,event,advance}=setup();const scene=createScene(canvas as unknown as HTMLCanvasElement,layer as unknown as HTMLDivElement,{stage(){},open(){},gesture(){}});
 scene.setPhotos(defaultPhotos);scene.enter();advance(FLIGHT_SECONDS+.1);const core=layer.children.find(c=>c.className==='galaxy-core-hit')!;core.dispatchEvent(event('click',{detail:0}));advance(DIVE_SECONDS+.1);
 const seen=new Set<string>();
 for(let i=0;i<24;i++){for(const p of layer.children.filter(c=>c.dataset.photoId&&!c.hidden))seen.add(p.dataset.photoId);layer.dispatchEvent(event('keydown',{key:'ArrowRight'}));advance(.1)}
 assert.equal(seen.size,defaultPhotos.length,'Every registered picture can be reached around the camera');
 scene.closeGallery();assert.equal(core.hidden,true,'The camera travels back through the sphere');advance(DIVE_SECONDS+.1);assert.equal(core.hidden,false);assert.ok(layer.children.filter(c=>c.dataset.photoId).every(c=>c.hidden));scene.destroy();
});
test('Dragging never selects a planet and the invitation appears before selection',()=>{
 const {layer,canvas,window,event,advance}=setup();let stage:JourneyStage='intro',prompted=false;
 const scene=createScene(canvas as unknown as HTMLCanvasElement,layer as unknown as HTMLDivElement,{stage:value=>{stage=value},open(){},gesture(){},prompt:value=>{prompted=value}});
 scene.beginSolar();advance(1);assert.equal(prompted,false);
 layer.dispatchEvent(event('pointerdown',{button:0,pointerId:1,clientX:100,clientY:100}));window.dispatchEvent(event('pointermove',{pointerId:1,clientX:210,clientY:140}));window.dispatchEvent(event('pointerup',{pointerId:1,clientX:210,clientY:140}));
 layer.children.find(c=>c.dataset.planetId==='earth')!.dispatchEvent(event('click',{detail:1}));assert.equal(stage,'solar');advance(.4);assert.equal(prompted,true);scene.destroy();
});
