'use client';
import {useEffect,useRef,useState} from 'react';
import {INTRO_TEXT} from '@/lib/journey';
/** Keep words intact and preserve spaces while individual Vietnamese characters appear. */
export function Typewriter({text,speed=52,delay=350,onComplete,className=''}:{text:string;speed?:number;delay?:number;onComplete?:()=>void;className?:string}){
 const normalized=text.normalize('NFC').replace(/\s+/g,' ').trim();
 const [visible,setVisible]=useState(0),callback=useRef(onComplete);callback.current=onComplete;
 useEffect(()=>{
  setVisible(0);let raf=0,last=0,elapsed=0,finished=false;
  const count=Array.from(normalized).length;
  const frame=(now:number)=>{
   const dt=last?Math.min(now-last,60):0;last=now;
   if(!document.hidden)elapsed+=dt;
   const next=Math.min(count,Math.max(0,Math.floor((elapsed-delay)/speed)));
   setVisible(next);
   if(next===count&&elapsed>=delay+count*speed+240){if(!finished){finished=true;callback.current?.()}return}
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);
 },[normalized,speed,delay]);
 let cursor=0;
 return <span className={'typewriter-text '+className}><span className="sr-only">{normalized}</span><span aria-hidden="true">{normalized.split(/(\s+)/).map((word,index)=>{
  if(/^\s+$/.test(word)){cursor+=Array.from(word).length;return <span className="typed-space" key={index}>{word}</span>}
  return <span className="typed-word" key={index}>{Array.from(word).map((letter,i)=>{const show=cursor++<visible;return <span className={'typed-character '+(show?'revealed':'')} key={i}>{letter}</span>})}</span>;
 })}</span></span>;
}
export function Intro({onAccept}:{onAccept:()=>void}){
 const [ready,setReady]=useState(false);
 return <section className="intro-screen" aria-labelledby="introQuestion"><div className="intro-content"><h1 id="introQuestion" className="cinema-heading"><Typewriter text={INTRO_TEXT} onComplete={()=>setReady(true)}/></h1><div className="intro-action">{ready&&<button className="yes-button ready" onClick={onAccept}>Có</button>}</div></div></section>;
}
// Invitation and letters use the same character-by-character effect.
export function Words({text,delay=0,className=''}:{text:string;delay?:number;className?:string}){
 return <Typewriter text={text} speed={38} delay={delay*1000+250} className={className}/>;
}
