import { env } from 'cloudflare:workers';
import {listPhotos,writePhoto,errorResponse,PhotoError} from '@/lib/photo-store';
export const dynamic='force-dynamic';
export async function GET(){try{if(!env.BUCKET)throw new PhotoError('Chưa kết nối được nơi lưu ảnh.',503);return Response.json({photos:await listPhotos(env.BUCKET)},{headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
export async function POST(request:Request){try{if(!env.BUCKET)throw new PhotoError('Chưa kết nối được nơi lưu ảnh.',503);return Response.json({photo:await writePhoto(request,env.BUCKET)},{status:201,headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
