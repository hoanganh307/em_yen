'use client';
import {useEffect,useRef} from 'react';
import {createLoveBloom} from '@/lib/love-bloom';
export default function LoveBloom({onComplete}:{onComplete:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const complete=useRef(onComplete);complete.current=onComplete;
 useEffect(()=>{if(canvas.current)return createLoveBloom(canvas.current,()=>complete.current())},[]);
 return <canvas ref={canvas} className="love-bloom" aria-hidden="true"/>;
}
