import { env } from 'cloudflare:workers';
import {writePhoto,deletePhoto,errorResponse,PhotoError} from '@/lib/photo-store';
export const dynamic='force-dynamic';
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{if(!env.BUCKET)throw new PhotoError('Chưa kết nối được nơi lưu ảnh.',503);return Response.json({photo:await writePhoto(request,env.BUCKET,(await params).id)},{headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){try{if(!env.BUCKET)throw new PhotoError('Chưa kết nối được nơi lưu ảnh.',503);return Response.json(await deletePhoto(request,env.BUCKET,(await params).id),{headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
