'use client';
import {useEffect,useRef,useState} from 'react';
import {
 DEPARTURE_TEXT,
 WONDER_TEXT,
 STORY_SPECIAL,
 STORY_FUTURE,
 STORY_CHANCE,
 STORY_DESERVING,
 LOVE_TEXT,
 type JourneyStage
} from '@/lib/journey';
import {Typewriter} from './cinematic-text';
import LoveBloom from './love-bloom';

function getStoryText(stage:JourneyStage):string{
 switch(stage){
  case 'departure':return DEPARTURE_TEXT;
  case 'wonder':return WONDER_TEXT;
  case 'special-one':return STORY_SPECIAL;
  case 'future-quote':return STORY_FUTURE;
  case 'chance-request':return STORY_CHANCE;
  case 'deserving':return STORY_DESERVING;
  case 'love':return LOVE_TEXT;
  default:return '';
 }
}

export default function StorySequence({stage,onNext}:{stage:JourneyStage;onNext:()=>void}){
 const [ready,setReady]=useState(false);
 const [fading,setFading]=useState(false);
 const advanced=useRef(false),advanceTimer=useRef<number|null>(null);
 const love=stage==='love';
 const text=getStoryText(stage);

 useEffect(()=>()=>{if(advanceTimer.current!==null)window.clearTimeout(advanceTimer.current)},[]);

 function advance(){
  if(advanced.current)return;advanced.current=true;setFading(true);advanceTimer.current=window.setTimeout(onNext,550);
 }

 function handleClick(){
  if(!ready||love||fading)return;
  advance();
 }

 return <section
  className={'story-screen '+(love?'story-love ':'')+(love&&ready?'love-blooming ':'')+(fading?'story-fading':'')+(ready&&!love?' story-clickable':'')}
  aria-live="polite"
  onClick={handleClick}
 >
  <p className="story-line">
   <Typewriter text={text} speed={love?130:48} delay={280} onComplete={()=>setReady(true)}/>
  </p>
  {ready&&!love&&<span className="story-tap-hint">Chạm để tiếp tục</span>}
  {love&&ready&&<LoveBloom onComplete={advance}/>}
 </section>;
}
