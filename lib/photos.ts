import { wishes } from './wishes';
export interface Photo { id:string; src:string; title:string; wish:string; order:number; version?:string }
export const defaultPhotos:Photo[]=Array.from({length:13},(_,i)=>({id:`seed-${String(i+1).padStart(2,'0')}`,src:`/assets/photo-${String(i+1).padStart(2,'0')}.jpg`,title:wishes[i].title,wish:wishes[i].text,order:i}));
export const newWish='Mong em luôn bình an, được yêu thương thật lòng và có thật nhiều ngày vui. Vì em xứng đáng với mọi điều tốt hơn thế nữa.';
