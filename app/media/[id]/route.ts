import {env} from 'cloudflare:workers';
import {validId,isPhotoDeleted} from '@/lib/photo-store';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validId(id))return new Response('Không tìm thấy ảnh.',{status:404});if(!env.BUCKET)return new Response('Chưa đọc được ảnh.',{status:503});
 if(await isPhotoDeleted(env.BUCKET,id))return new Response('Ảnh đã được xóa.',{status:404,headers:{'Cache-Control':'no-store'}});
 const object=await env.BUCKET.get(`photos/${id}`);if(!object)return new Response('Không tìm thấy ảnh.',{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set('ETag',object.httpEtag);headers.set('Cache-Control','private, max-age=0, must-revalidate');headers.set('X-Content-Type-Options','nosniff');
 return new Response(object.body,{headers});
}
