import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
const modules={};
function load(name){if(modules[name])return modules[name];const code=fs.readFileSync(`lib/${name}.ts`,'utf8');const output=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};modules[name]=exports;const c=vm.createContext({exports,require:p=>load(p.replace('./','')),console,File,FormData,Response,Request,Headers,URL,crypto:webcrypto,fetch});vm.runInContext(output,c);return exports}
const {listPhotos,writePhoto,authorizeWrite,validId}=load('photo-store');
const objects=new Map();let seq=0;
function bucket(){return{list:async()=>({objects:[...objects.values()].map(o=>({key:o.key})),truncated:false}),head:async key=>objects.get(key)||null,get:async key=>{const o=objects.get(key);return o?{...o,arrayBuffer:async()=>o.bytes}:null},put:async(key,bytes,opts)=>{const o={key,bytes,etag:`etag${++seq}`,customMetadata:opts.customMetadata,httpMetadata:opts.httpMetadata};objects.set(key,o);return o}}}
const request=(form,headers={})=>new Request('https://example.test/api/photos',{method:'POST',headers:{'oai-authenticated-user-id':'site-owner','origin':'https://example.test',...headers},body:form});
const form=(name,wish,bytes=new Uint8Array([255,216,255,224,0,16,1,2,3]))=>{const f=new FormData();f.append('photo',new File([bytes],'photo.jpg',{type:'image/jpeg'}));f.append('title',name);f.append('wish',wish);return f};
const b=bucket();assert.equal((await listPhotos(b)).length,13);
const newPhoto=await writePhoto(request(form('Điều ước của em','Chúc em luôn bình an ♡')),b);assert.ok(validId(newPhoto.id));assert.equal((await listPhotos(b)).length,14);
// Một kết nối mới vẫn đọc được ảnh và tiếng Việt đã lưu.
const after=await listPhotos(bucket());assert.equal(after.find(x=>x.id===newPhoto.id).wish,'Chúc em luôn bình an ♡');
const changed=await writePhoto(request(form('Hải Yến à','Vì em xứng đáng với mọi điều tốt hơn thế nữa.')),bucket(),'seed-01');assert.equal(changed.id,'seed-01');const restored=await listPhotos(bucket());assert.equal(restored.length,14);assert.equal(restored[0].title,'Hải Yến à');assert.equal(restored[0].wish,'Vì em xứng đáng với mọi điều tốt hơn thế nữa.');assert.ok(restored[0].src.startsWith('/media/seed-01?'));
await assert.rejects(()=>writePhoto(request(form('bad','bad',new TextEncoder().encode('<script>alert(1)</script>'))),b),/JPG/);
assert.throws(()=>authorizeWrite(new Request('https://example.test/api/photos',{method:'POST'})),/đăng nhập/);
assert.throws(()=>authorizeWrite(request(form('a','b'),{origin:'https://bad.test'})),/không hợp lệ/);
await assert.rejects(()=>writePhoto(request(form('a','b')),b,'../../../other'),/Không tìm thấy/);
console.log('PASS lưu ảnh: thêm ảnh, thay ảnh gốc, đọc lại từ kết nối mới, lưu đúng tiếng Việt, chặn tệp giả ảnh và yêu cầu không hợp lệ.');
