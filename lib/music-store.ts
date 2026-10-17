import {defaultTracks,type MusicTrack} from './tracks';
import {authorizeWrite,PhotoError} from './photo-store';
interface SavedTrack {key:string|null;mime:string;start:number;updatedAt:string}
export const validTrackId=(id:string)=>defaultTracks.some(t=>t.id===id);
async function savedTrack(bucket:R2Bucket,id:string):Promise<SavedTrack|null>{const object=await bucket.get(`playlist/${id}.json`);return object?await object.json<SavedTrack>():null}
function publicTrack(id:string,saved:SavedTrack|null):MusicTrack{const base=defaultTracks.find(t=>t.id===id)!;return saved?{...base,src:saved.key?`/music/${id}?v=${encodeURIComponent(saved.updatedAt)}`:base.src,start:saved.start,version:saved.updatedAt}:base}
export async function listTracks(bucket:R2Bucket){return Promise.all(defaultTracks.map(async t=>publicTrack(t.id,await savedTrack(bucket,t.id))))}
function audioMime(bytes:Uint8Array,fileType:string){
 const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
 if(text(0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&0xe0)===0xe0&&(bytes[1]&6)!==0))return'audio/mpeg';
 if(bytes[0]===255&&(bytes[1]===0xf1||bytes[1]===0xf9))return'audio/aac';
 if(text(0,4)==='RIFF'&&text(8,12)==='WAVE')return'audio/wav';
 if(text(0,4)==='OggS')return'audio/ogg';if(text(0,4)==='fLaC')return'audio/flac';
 if(text(4,8)==='ftyp')return fileType.startsWith('video/')?'video/mp4':'audio/mp4';return null;
}
export async function writeTrack(request:Request,bucket:R2Bucket,id:string){
 authorizeWrite(request);if(!validTrackId(id))throw new PhotoError('Không tìm thấy bài nhạc.',404);
 if(Number(request.headers.get('content-length'))>27*1024*1024)throw new PhotoError('Hãy chọn tệp nhạc hoặc video dưới 25 MB.',413);
 const form=await request.formData(),file=form.get('audio'),previous=await savedTrack(bucket,id),base=publicTrack(id,previous);
 const startValue=Number(form.get('start')??base.start);if(!Number.isFinite(startValue)||startValue<0||startValue>86400)throw new PhotoError('Vị trí bắt đầu chưa hợp lệ.');
 let key=previous?.key??null,mime=previous?.mime||'audio/mpeg';
 if(file instanceof File&&file.size){
  if(file.size>25*1024*1024)throw new PhotoError('Hãy chọn tệp nhạc hoặc video dưới 25 MB.',413);
  const data=await file.arrayBuffer(),kind=audioMime(new Uint8Array(data),file.type);if(!kind)throw new PhotoError('Hãy chọn MP3, M4A, WAV, OGG hoặc video MP4 có âm thanh.');
  key=`audio-files/${id}/${crypto.randomUUID()}`;mime=kind;await bucket.put(key,data,{httpMetadata:{contentType:mime}});
 }else if(!base.src)throw new PhotoError('Hãy chọn tệp nhạc cho bài này trước.');
 const saved:SavedTrack={key,mime,start:startValue,updatedAt:new Date().toISOString()};await bucket.put(`playlist/${id}.json`,JSON.stringify(saved),{httpMetadata:{contentType:'application/json'}});return publicTrack(id,saved);
}
export async function getTrackAudio(bucket:R2Bucket,id:string,headers:Headers){if(!validTrackId(id))return null;const saved=await savedTrack(bucket,id);if(!saved?.key)return null;return bucket.get(saved.key,{range:headers})}
