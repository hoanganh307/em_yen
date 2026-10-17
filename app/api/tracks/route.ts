import {env} from 'cloudflare:workers';
import {listTracks} from '@/lib/music-store';
import {PhotoError,errorResponse} from '@/lib/photo-store';
export const dynamic='force-dynamic';
export async function GET(){try{if(!env.BUCKET)throw new PhotoError('Chưa kết nối được nơi lưu nhạc.',503);return Response.json({tracks:await listTracks(env.BUCKET)},{headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
