import {env} from 'cloudflare:workers';
import {writeTrack} from '@/lib/music-store';
import {PhotoError,errorResponse} from '@/lib/photo-store';
export const dynamic='force-dynamic';
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{if(!env.BUCKET)throw new PhotoError('Chưa kết nối được nơi lưu nhạc.',503);return Response.json({track:await writeTrack(request,env.BUCKET,(await params).id)},{headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
