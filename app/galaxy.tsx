'use client';
import {useEffect,useRef,useState} from 'react';
import type {Photo} from '@/lib/photos';
import {createScene,type Scene} from '@/lib/scene';
import {useMusic} from '@/lib/use-music';
import {SOLAR_INVITATION,STORY_STAGES,type JourneyStage} from '@/lib/journey';
import {Intro,Words} from './cinematic-text';
import StorySequence from './story-sequence';
import PhotoEditor from './photo-editor';

export default function Galaxy(){
 const canvas=useRef<HTMLCanvasElement>(null),layer=useRef<HTMLDivElement>(null),scene=useRef<Scene|null>(null),dialog=useRef<HTMLDialogElement>(null);
 const [photos,setPhotos]=useState<Photo[]>([]),[phase,setPhase]=useState<JourneyStage>('intro'),[prompt,setPrompt]=useState(false),[editing,setEditing]=useState(false),[loadError,setLoadError]=useState(''),[focused,setFocused]=useState<string|null>(null),[viewer,setViewer]=useState<string|null>(null),[galleryOpen,setGalleryOpen]=useState(false);
 const music=useMusic(),musicRef=useRef(music.tryPlay);musicRef.current=music.tryPlay;
 const selected=photos.find(p=>p.id===viewer);

 useEffect(()=>{
  if(!canvas.current||!layer.current)return;
  const instance=createScene(canvas.current,layer.current,{
   stage:setPhase,
   open:setViewer,
   focused:setFocused,
   discovery:setGalleryOpen,
   prompt:setPrompt,
   gesture:()=>musicRef.current()
  });
  scene.current=instance;
  return()=>{instance.destroy();scene.current=null};
 },[]);

 useEffect(()=>{scene.current?.setPhotos(photos)},[photos]);

 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/photos',{cache:'no-store',signal:controller.signal}).then(async response=>{
   const data=await response.json() as {photos:Photo[];error?:string};if(!response.ok)throw new Error(data.error||'Chưa tải được ảnh.');setPhotos(data.photos);setLoadError('');
  }).catch(error=>{if(error.name!=='AbortError')setLoadError('Chưa kết nối được nơi lưu ảnh. Hãy tải lại trang trước khi chỉnh sửa.')});
  return()=>controller.abort();
 },[]);

 useEffect(()=>{if(phase==='galaxy')music.start();else music.hold()},[phase]);
 useEffect(()=>{if(viewer&&!dialog.current?.open)dialog.current?.showModal();if(!viewer&&dialog.current?.open)dialog.current.close()},[viewer]);

 function saved(photo:Photo){setPhotos(old=>(old.some(p=>p.id===photo.id)?old.map(p=>p.id===photo.id?photo:p):[...old,photo]).sort((a,b)=>a.order-b.order))}
 function deleted(id:string){setPhotos(old=>old.filter(p=>p.id!==id));if(viewer===id)setViewer(null)}
 function accept(){music.prime();scene.current?.beginSolar()}
 function back(){if(viewer){setViewer(null);return}if(focused){scene.current?.clearSelection();return}if(phase==='galaxy'&&galleryOpen){scene.current?.closeGallery();return}if(phase==='solar')scene.current?.restart();else scene.current?.overview()}

 const backLabel=focused?'Quay lại thiên hà ảnh':phase==='galaxy'&&galleryOpen?'Quay lại quả cầu sao':phase==='solar'?'Quay lại mở đầu':'Quay lại Hệ Mặt Trời';

 return <main className={'galaxy-app journey-'+phase+(focused?' photo-is-focused':'')}>
  <canvas ref={canvas} className="space-canvas" aria-hidden="true"/>
  <div ref={layer} className="planet-layer" role="group" aria-label={phase==='galaxy'?'Những khoảnh khắc của Hải Yến':'Hệ Mặt Trời'}/>
  <div className="edge-shade" aria-hidden="true"/>
  {phase==='intro'&&<Intro onAccept={accept}/>}
  {phase!=='intro'&&<button className="journey-back" onClick={back} aria-label={backLabel} title={backLabel}>‹</button>}
  {phase==='galaxy'&&<button className="gallery-settings" onClick={()=>setEditing(true)} aria-label="Quản lý, thêm hoặc xóa ảnh" title="Quản lý ảnh">⚙</button>}
  {phase==='solar'&&prompt&&<section className="solar-question" aria-live="polite"><p><Words text={SOLAR_INVITATION}/></p></section>}
  {STORY_STAGES.includes(phase)&&<StorySequence key={phase} stage={phase} onNext={()=>scene.current?.advanceStory()}/>}
  {phase==='galaxy'&&<button className={'music-launcher '+(music.playing&&!music.muted?'is-playing':'')} onClick={music.toggle} aria-label={music.muted||music.blocked?'Bật nhạc':'Tắt nhạc'} aria-pressed={!music.muted&&!music.blocked} title="Đến khi nào"><span className="music-bars" aria-hidden="true"><i/><i/><i/><i/></span>{music.muted&&<span className="muted-mark" aria-hidden="true">×</span>}</button>}
  {phase==='solar'&&<a className="texture-credit" href="/assets/planets/ATTRIBUTION.txt" target="_blank" rel="noopener" aria-label="Nguồn bản đồ bề mặt hành tinh: Solar System Scope, CC BY 4.0">Solar System Scope · CC BY 4.0</a>}
  <dialog ref={dialog} className="wish-dialog" onCancel={()=>setViewer(null)} aria-labelledby="wishTitle"><div className="wish-shell"><div className="dialog-head"><button className="icon-button" onClick={()=>setViewer(null)} aria-label="Quay lại ảnh">‹</button><span>Một lá thư dành cho em</span><button className="icon-button" onClick={()=>setViewer(null)} aria-label="Đóng thư">×</button></div>{selected&&<div className="wish-content" key={selected.id+selected.version}><div className="wish-picture"><img src={selected.src} alt={selected.title}/></div><section className="letter"><h2 id="wishTitle">{selected.title}</h2><p><Words text={selected.wish}/></p><span className="signature">Thương em ♡</span></section></div>}</div></dialog>
  <PhotoEditor open={editing} onClose={()=>setEditing(false)} photos={photos} onSaved={saved} onDeleted={deleted} loadError={loadError} music={music}/>
 </main>;
}
