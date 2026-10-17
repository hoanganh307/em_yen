'use client';
import {useEffect,useRef,useState} from 'react';
import type {MusicTrack} from './tracks';
const FALLBACK='/assets/den-khi-nao.mp3';
export function useMusic(){
 const audio=useRef<HTMLAudioElement|null>(null),mutedRef=useRef(false),busy=useRef(false),version=useRef(0),source=useRef(FALLBACK),enabled=useRef(false);
 const [muted,setMuted]=useState(false),[blocked,setBlocked]=useState(false),[playing,setPlaying]=useState(false),[duration,setDuration]=useState(0),[uploaded,setUploaded]=useState(false),[error,setError]=useState('');
 function tryPlay(){
  const a=audio.current;if(!enabled.current||!a||mutedRef.current||busy.current||!a.paused)return;
  busy.current=true;const attempt=++version.current;
  void a.play().then(()=>{if(attempt===version.current)setBlocked(false)}).catch(()=>{if(attempt===version.current)setBlocked(true)}).finally(()=>{if(attempt===version.current)busy.current=false});
 }
 function useTrack(track:MusicTrack){
  const a=audio.current;if(!a||!track.src||track.src===source.current)return;
  version.current++;busy.current=false;source.current=track.src;a.pause();a.src=track.src;a.loop=true;a.load();setDuration(0);setError('');setUploaded(track.src!==FALLBACK);tryPlay();
 }
 useEffect(()=>{
  const a=new Audio(FALLBACK);a.preload='auto';a.volume=.68;a.loop=true;audio.current=a;source.current=FALLBACK;
  mutedRef.current=false;a.muted=true;setMuted(false);
  const metadata=()=>setDuration(Number.isFinite(a.duration)?a.duration:0),play=()=>{setPlaying(enabled.current);setBlocked(false)},pause=()=>setPlaying(false),failed=()=>{setPlaying(false);setError('Chưa phát được tệp nhạc. Hãy chọn một tệp MP3 hoặc M4A khác.')};
  const gesture=()=>tryPlay(),visible=()=>{if(!document.hidden)tryPlay()};
  a.addEventListener('loadedmetadata',metadata);a.addEventListener('playing',play);a.addEventListener('pause',pause);a.addEventListener('error',failed);
  document.addEventListener('pointerdown',gesture,{capture:true});document.addEventListener('keydown',gesture,{capture:true});document.addEventListener('visibilitychange',visible);
  const controller=new AbortController();
  fetch('/api/tracks',{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)return;const data=await response.json() as {tracks:MusicTrack[]};const track=data.tracks.find(t=>t.id==='den-khi-nao');if(track?.src)useTrack(track)}).catch(()=>{});
  return()=>{controller.abort();version.current++;busy.current=false;a.pause();a.removeAttribute('src');a.load();audio.current=null;a.removeEventListener('loadedmetadata',metadata);a.removeEventListener('playing',play);a.removeEventListener('pause',pause);a.removeEventListener('error',failed);document.removeEventListener('pointerdown',gesture,{capture:true});document.removeEventListener('keydown',gesture,{capture:true});document.removeEventListener('visibilitychange',visible)};
 },[]);
 function prime(){const a=audio.current;if(!a)return;a.muted=true;void a.play().catch(()=>{})}
 function hold(){enabled.current=false;const a=audio.current;if(a)a.muted=true;setPlaying(false)}
 function start(){enabled.current=true;if(audio.current)audio.current.currentTime=0;mutedRef.current=false;setMuted(false);if(audio.current)audio.current.muted=false;setPlaying(!!audio.current&&!audio.current.paused);tryPlay()}
 function toggle(){enabled.current=true;const next=blocked?false:!mutedRef.current;mutedRef.current=next;setMuted(next);if(audio.current)audio.current.muted=next;try{localStorage.setItem('galaxy-muted',String(next))}catch{}if(!next)tryPlay()}
 return{muted,blocked,playing,duration,uploaded,error,toggle,tryPlay,start,prime,hold,useTrack};
}
