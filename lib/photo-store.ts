import { defaultPhotos,newWish,type Photo } from './photos';
const PREFIX='photos/';
const DELETED='deleted-photos/';
export class PhotoError extends Error { status:number;constructor(message:string,status=400){super(message);this.status=status} }
export function validId(id:string){return /^seed-(0[1-9]|1[0-3])$/.test(id)||/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)}
function record(o:R2Object):Photo{
 const m=o.customMetadata||{},id=o.key.slice(PREFIX.length);
 return{id,src:`/media/${id}?v=${encodeURIComponent(o.etag)}`,title:m.title||'Dành cho em',wish:m.wish||newWish,order:Number(m.order)||0,version:o.etag};
}
export async function listPhotos(bucket:R2Bucket):Promise<Photo[]>{
 const all=new Map(defaultPhotos.map(p=>[p.id,p]));let cursor:string|undefined;
 do{const page=await bucket.list({prefix:PREFIX,cursor});const objects=await Promise.all(page.objects.map(object=>bucket.head(object.key)));for(const object of objects){if(!object)continue;const id=object.key.slice(PREFIX.length);if(validId(id))all.set(id,record(object))}cursor=page.truncated?page.cursor:undefined}while(cursor);
 // Persist removals of the original bundled photos too, so they never return
 // from defaultPhotos after a reload or on another device.
 cursor=undefined;
 do{const page=await bucket.list({prefix:DELETED,cursor});for(const object of page.objects)all.delete(object.key.slice(DELETED.length));cursor=page.truncated?page.cursor:undefined}while(cursor);
 return Array.from(all.values()).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
}
export async function isPhotoDeleted(bucket:R2Bucket,id:string){return !!(await bucket.head(DELETED+id))}
export async function deletePhoto(request:Request,bucket:R2Bucket,id:string){
 authorizeWrite(request);if(!validId(id))throw new PhotoError('Không tìm thấy ảnh.',404);
 const [removed,stored]=await Promise.all([bucket.head(DELETED+id),bucket.head(PREFIX+id)]);
 if(!removed&&!stored&&!defaultPhotos.some(p=>p.id===id))throw new PhotoError('Không tìm thấy ảnh.',404);
 if(!removed)await bucket.put(DELETED+id,JSON.stringify({deletedAt:new Date().toISOString()}),{httpMetadata:{contentType:'application/json'}});
 await bucket.delete(PREFIX+id);
 return{id,deleted:true};
}
export function authorizeWrite(request:Request){
 if(!request.headers.get('oai-authenticated-user-id'))throw new PhotoError('Hãy tải lại trang và đăng nhập để lưu ảnh.',401);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new PhotoError('Yêu cầu lưu ảnh không hợp lệ.',403);
 if(request.headers.get('sec-fetch-site')==='cross-site')throw new PhotoError('Yêu cầu lưu ảnh không hợp lệ.',403);
}
function imageType(bytes:Uint8Array){
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return'image/jpeg';
 if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a)return'image/png';
 if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return'image/webp';return null;
}
function text(form:FormData,key:string,fallback:string,max:number){const v=form.get(key);return(typeof v==='string'?v.trim():fallback).slice(0,max)||fallback}
export async function writePhoto(request:Request,bucket:R2Bucket,id?:string):Promise<Photo>{
 authorizeWrite(request);if(id&&(!validId(id)||await isPhotoDeleted(bucket,id)))throw new PhotoError('Ảnh này đã được xóa hoặc không còn tồn tại.',404);
 if(Number(request.headers.get('content-length'))>9*1024*1024)throw new PhotoError('Ảnh quá lớn. Hãy chọn ảnh dưới 8 MB.',413);
 const form=await request.formData();let existing:Photo|undefined;
 if(id){existing=defaultPhotos.find(p=>p.id===id);const old=await bucket.head(PREFIX+id);if(old)existing=record(old);if(!existing)throw new PhotoError('Không tìm thấy ảnh.',404)}
 else if((await listPhotos(bucket)).length>=100)throw new PhotoError('Trang đã có 100 ảnh. Em có thể thay ảnh đang có.');
 const upload=form.get('photo');const title=text(form,'title',existing?.title||'Dành cho em',120),wish=text(form,'wish',existing?.wish||newWish,2000);
 let body:ArrayBuffer,contentType:string;
 if(upload instanceof File&&upload.size){
  if(upload.size>8*1024*1024)throw new PhotoError('Ảnh quá lớn. Hãy chọn ảnh dưới 8 MB.',413);
  body=await upload.arrayBuffer();const kind=imageType(new Uint8Array(body));if(!kind)throw new PhotoError('Hãy chọn ảnh JPG, PNG hoặc WebP.');contentType=kind;
 }else if(id){
  const current=await bucket.get(PREFIX+id);
  if(current){body=await current.arrayBuffer();contentType=current.httpMetadata?.contentType||'image/jpeg'}
  else throw new PhotoError('Hãy chọn lại ảnh trước khi lưu lời chúc.');
 }else throw new PhotoError('Hãy chọn một ảnh trước khi lưu.');
 const photoId=id||crypto.randomUUID(),order=existing?.order??Date.now();
 const result=await bucket.put(PREFIX+photoId,body,{httpMetadata:{contentType,cacheControl:'private, max-age=0, must-revalidate'},customMetadata:{title,wish,order:String(order),updatedAt:new Date().toISOString()}});
 if(!result)throw new PhotoError('Chưa lưu được ảnh. Em thử lại nhé.',503);
 return{id:photoId,src:`/media/${photoId}?v=${encodeURIComponent(result.etag)}`,title,wish,order,version:result.etag};
}
export function errorResponse(error:unknown){const e=error instanceof PhotoError?error:new PhotoError('Chưa hoàn tất thao tác với ảnh. Em thử lại sau nhé.',503);return Response.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}})}
