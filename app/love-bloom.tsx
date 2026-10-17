'use client';
import {useEffect,useRef} from 'react';
import {createLoveBloom} from '@/lib/love-bloom';
export default function LoveBloom(){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(canvas.current)return createLoveBloom(canvas.current)},[]);
 return <canvas ref={canvas} className="love-bloom" aria-hidden="true"/>;
}
