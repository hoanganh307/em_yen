import {test} from 'node:test';
import assert from 'node:assert/strict';
import {listPhotos,writePhoto,deletePhoto,isPhotoDeleted,PhotoError} from '../lib/photo-store';
class MemoryBucket {
 data=new Map<string,{body:ArrayBuffer;customMetadata:Record<string,string>;httpMetadata:Record<string,string>}>();
 etags=new Map<string,string>();
 async head(key:string){const value=this.data.get(key);return value?{key,etag:this.etags.get(key)!,...value}:null}
 async get(key:string){const value=await this.head(key);return value?{...value,arrayBuffer:async()=>value.body}:null}
 async put(key:string,body:ArrayBuffer|string,options:{customMetadata?:Record<string,string>;httpMetadata?:Record<string,string>}={}){
  this.data.set(key,{body:typeof body==='string'?new TextEncoder().encode(body).buffer:body,customMetadata:options.customMetadata||{},httpMetadata:options.httpMetadata||{}});
  this.etags.set(key,crypto.randomUUID());return this.head(key);
 }
 async delete(key:string){this.data.delete(key);this.etags.delete(key)}
 async list({prefix,cursor}:{prefix:string;cursor?:string}){
  const keys=[...this.data.keys()].filter(k=>k.startsWith(prefix)).sort(),offset=Number(cursor||0),page=keys.slice(offset,offset+3);
  return{objects:page.map(key=>({key})),truncated:offset+3<keys.length,cursor:String(offset+3)};
 }
 asBucket(){return this as unknown as R2Bucket}
}
function request(method='DELETE',form?:FormData,headers:Record<string,string>={}){
 return new Request('https://example.test/api/photos/seed-01',{method,body:form,headers:{'oai-authenticated-user-id':'test-owner','origin':'https://example.test',...headers}});
}
function uploadForm(){const form=new FormData();form.append('photo',new File([new Uint8Array([255,216,255,224,0,4,1,1])],'test.jpg',{type:'image/jpeg'}));form.append('title','Lời chúc');form.append('wish','Luôn bình an nhé em.');return form}
test('Deleting a bundled seed persists across listing and cannot resurrect through editing',async()=>{
 const memory=new MemoryBucket(),bucket=memory.asBucket();assert.equal((await listPhotos(bucket)).length,13);
 const result=await deletePhoto(request(),bucket,'seed-01');assert.equal(result.deleted,true);
 assert.equal(await isPhotoDeleted(bucket,'seed-01'),true);
 assert.equal((await listPhotos(bucket)).some(p=>p.id==='seed-01'),false);
 await assert.rejects(writePhoto(request('PUT',uploadForm()),bucket,'seed-01'),(e:unknown)=>e instanceof PhotoError&&e.status===404);
 await deletePhoto(request(),bucket,'seed-01');assert.equal((await listPhotos(bucket)).length,12);
});
test('Deleting uploaded bytes removes the photo without affecting other photos',async()=>{
 const memory=new MemoryBucket(),bucket=memory.asBucket();
 const photo=await writePhoto(request('POST',uploadForm()),bucket);assert.equal((await listPhotos(bucket)).length,14);
 assert.equal(memory.data.has('photos/'+photo.id),true);await deletePhoto(request(),bucket,photo.id);
 assert.equal(memory.data.has('photos/'+photo.id),false);assert.equal((await listPhotos(bucket)).length,13);
});
test('Deleting every seed leaves an empty gallery and still permits a new upload',async()=>{
 const bucket=new MemoryBucket().asBucket();for(let i=1;i<=13;i++)await deletePhoto(request(),bucket,'seed-'+String(i).padStart(2,'0'));
 assert.deepEqual(await listPhotos(bucket),[]);
 const photo=await writePhoto(request('POST',uploadForm()),bucket);assert.deepEqual((await listPhotos(bucket)).map(p=>p.id),[photo.id]);
});
test('Deletion validates sign-in, origin and photo identifiers',async()=>{
 const bucket=new MemoryBucket().asBucket();
 await assert.rejects(deletePhoto(new Request('https://example.test',{method:'DELETE'}),bucket,'seed-01'),(e:unknown)=>e instanceof PhotoError&&e.status===401);
 await assert.rejects(deletePhoto(request('DELETE',undefined,{origin:'https://other.test'}),bucket,'seed-01'),(e:unknown)=>e instanceof PhotoError&&e.status===403);
 await assert.rejects(deletePhoto(request(),bucket,'../photos'),(e:unknown)=>e instanceof PhotoError&&e.status===404);
 assert.equal((await listPhotos(bucket)).length,13);
});
