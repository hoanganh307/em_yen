'use client';
import {useState} from 'react';
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
 const love=stage==='love';
 const text=getStoryText(stage);

 function handleClick(){
  if(!ready||fading)return;
  setFading(true);
  setTimeout(onNext,550);
 }

 function handleKeyDown(event:React.KeyboardEvent<HTMLElement>){
  if((event.code==='Space'||event.code==='Enter')&&ready){
   event.preventDefault();
   handleClick();
  }
 }

 return <section
  className={'story-screen '+(love?'story-love ':'')+(love&&ready?'love-blooming ':'')+(fading?'story-fading':'')+(ready?' story-clickable':'')}
  aria-live="polite"
  role="button"
  tabIndex={ready?0:-1}
  aria-label={ready?'Chạm hoặc nhấn Space để tiếp tục':''}
  onClick={handleClick}
  onPointerUp={event=>{if(event.target===event.currentTarget)handleClick()}}
  onKeyDown={handleKeyDown}
 >
  <p className="story-line">
   <Typewriter text={text} speed={love?130:48} delay={280} onComplete={()=>setReady(true)}/>
  </p>
  {ready&&<span className="story-tap-hint">Chạm để tiếp tục</span>}
  {love&&ready&&<LoveBloom/>}
 </section>;
}
