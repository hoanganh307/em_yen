'use client';
import {useEffect,useRef,useState} from 'react';
import type {Photo} from '@/lib/photos';
import {newWish} from '@/lib/photos';
import type {useMusic} from '@/lib/use-music';
import AudioSettings from './audio-settings';
async function imageFile(file:File):Promise<Blob>{
 if(!file.type.startsWith('image/'))throw new Error('Hãy chọn tệp ảnh.');
 const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const ratio=Math.min(1,1600/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Chưa đọc được ảnh.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Chưa đọc được ảnh.')),'image/jpeg',.89))}catch{throw new Error('Ảnh này chưa đọc được. Hãy chọn ảnh JPG, PNG hoặc WebP.')}finally{URL.revokeObjectURL(url)}
}
async function send(form:FormData,id?:string):Promise<Photo>{const r=await fetch(id?`/api/photos/${id}`:'/api/photos',{method:id?'PUT':'POST',body:form});const data=await r.json() as {photo:Photo;error?:string};if(!r.ok)throw new Error(data.error||'Chưa lưu được ảnh. Em thử lại nhé.');return data.photo}
export default function PhotoEditor({open,onClose,photos,onSaved,onDeleted,loadError,music}:{open:boolean;onClose:()=>void;photos:Photo[];onSaved:(p:Photo)=>void;onDeleted:(id:string)=>void;loadError:string;music:ReturnType<typeof useMusic>}){
 const dialog=useRef<HTMLDialogElement>(null),addInput=useRef<HTMLInputElement>(null),replaceInput=useRef<HTMLInputElement>(null);
 const [selected,setSelected]=useState(photos[0]?.id||''),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[title,setTitle]=useState(''),[wish,setWish]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 const active=photos.find(p=>p.id===selected)||photos[0];
 const [confirmDelete,setConfirmDelete]=useState(false);
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();if(!open&&dialog.current?.open)dialog.current.close()},[open]);
 useEffect(()=>{setConfirmDelete(false);if(active){setTitle(active.title);setWish(active.wish);setFile(null)}},[active?.id,active?.version]);
 useEffect(()=>{if(!open)setConfirmDelete(false)},[open]);
 useEffect(()=>{if(!file){setPreview('');return}const u=URL.createObjectURL(file);setPreview(u);return()=>URL.revokeObjectURL(u)},[file]);
 async function add(files:FileList|null){
  if(!files?.length)return;const chosen=Array.from(files);if(addInput.current)addInput.current.value='';setBusy(true);setError('');let done=0;
  try{for(const f of chosen){setStatus(`Đang lưu ảnh ${done+1}/${chosen.length}…`);const blob=await imageFile(f),form=new FormData();form.append('photo',blob,'photo.jpg');form.append('title','Dành cho em');form.append('wish',newWish);const p=await send(form);onSaved(p);setSelected(p.id);done++}setStatus(`Đã lưu ${done} ảnh. Mở lại trang vẫn có ảnh của em.`)}catch(e){setError(`${done?`Đã lưu ${done}/${chosen.length} ảnh. `:''}${e instanceof Error?e.message:'Chưa lưu được ảnh.'}`);setStatus('')}finally{setBusy(false)}
 }
 async function save(event:React.FormEvent){
  event.preventDefault();if(!active||busy)return;setBusy(true);setStatus('Đang lưu thay đổi…');setError('');
  try{const form=new FormData();if(file)form.append('photo',await imageFile(file),'photo.jpg');else{const r=await fetch(active.src);if(!r.ok)throw new Error('Chưa đọc được ảnh hiện tại. Hãy chọn lại ảnh.');form.append('photo',await r.blob(),'photo.jpg')}form.append('title',title);form.append('wish',wish);const p=await send(form,active.id);onSaved(p);setFile(null);setStatus('Đã lưu ảnh và lời chúc.')}catch(e){setError(e instanceof Error?e.message:'Chưa lưu được thay đổi.');setStatus('')}finally{setBusy(false)}
 }
 async function remove(){
  if(!active||busy)return;const id=active.id;setBusy(true);setError('');setStatus('Đang xóa ảnh…');
  try{
   const response=await fetch('/api/photos/'+id,{method:'DELETE'});
   const data=await response.json() as {deleted?:boolean;error?:string};
   if(!response.ok||!data.deleted)throw new Error(data.error||'Chưa xóa được ảnh. Hãy thử lại.');
   const index=photos.findIndex(p=>p.id===id),remaining=photos.filter(p=>p.id!==id);
   onDeleted(id);setSelected(remaining[Math.min(index,remaining.length-1)]?.id||'');setFile(null);setConfirmDelete(false);setStatus('Đã xóa ảnh và lời chúc khỏi thiên hà.');
  }catch(e){setError(e instanceof Error?e.message:'Chưa xóa được ảnh.');setStatus('')}
  finally{setBusy(false)}
 }
 return <dialog ref={dialog} className="editor-dialog" onKeyDown={e=>{if(e.key==='Escape'&&!busy){e.preventDefault();onClose()}}} onCancel={e=>{if(busy)e.preventDefault();else onClose()}} aria-labelledby="editorTitle"><div className="editor-shell"><div className="dialog-head"><div><h2 id="editorTitle">Ngân hà ảnh của em</h2><p>Thêm, thay ảnh hoặc viết lại lời chúc cho từng khoảnh khắc.</p></div><button onClick={onClose} disabled={busy} className="icon-button" aria-label="Đóng quản lý ảnh">×</button></div><div className="editor-actions"><button className="soft-button" onClick={()=>addInput.current?.click()} disabled={busy||!!loadError}>＋ Thêm ảnh</button><span>{photos.length} ảnh đã có</span><input ref={addInput} type="file" accept="image/*" multiple hidden onChange={e=>void add(e.target.files)}/></div>
 {(error||loadError)&&<p className="feedback error" role="alert">{error||loadError}</p>}{status&&<p className="feedback" role="status">{status}</p>}
 <div className="editor-body"><div className="editor-grid" aria-label="Chọn ảnh để chỉnh sửa">{photos.map((p,i)=><button key={p.id} className={active?.id===p.id?'chosen':''} onClick={()=>{setSelected(p.id);setStatus('');setError('');setConfirmDelete(false)}} disabled={busy} aria-label={`Chọn ảnh ${i+1}`}><img src={p.src} alt={`Ảnh ${i+1}`} loading="lazy"/></button>)}{!photos.length&&<p className="empty-photos">Chưa có ảnh. Bấm “Thêm ảnh” để tạo khoảnh khắc đầu tiên.</p>}</div>
 {active&&<form className="edit-form" onSubmit={save}><div className="edit-preview"><img src={preview||active.src} alt="Ảnh đang chỉnh sửa"/></div><button type="button" className="replace-button" onClick={()=>replaceInput.current?.click()} disabled={busy}>Thay ảnh này</button><input ref={replaceInput} type="file" accept="image/*" hidden onChange={e=>{setFile(e.target.files?.[0]||null);e.target.value=''}}/><label>Tiêu đề lời chúc<input value={title} maxLength={120} onChange={e=>setTitle(e.target.value)} disabled={busy}/></label><label>Lời chúc dành cho em<textarea value={wish} maxLength={2000} rows={5} onChange={e=>setWish(e.target.value)} disabled={busy}/></label><button className="soft-button save-button" type="submit" disabled={busy||!!loadError}>{busy?'Đang lưu…':'Lưu thay đổi'}</button></form>}
 {active&&<div className="delete-photo-area">{confirmDelete?<div className="delete-confirm" role="alert"><p>Xóa ảnh này và lời chúc khỏi thiên hà trên mọi thiết bị?</p><div><button className="cancel-delete" type="button" onClick={()=>setConfirmDelete(false)} disabled={busy}>Giữ ảnh</button><button className="danger-button" type="button" onClick={()=>void remove()} disabled={busy||!!loadError}>{busy?'Đang xóa…':'Xác nhận xóa'}</button></div></div>:<button className="delete-photo" type="button" onClick={()=>{setConfirmDelete(true);setStatus('');setError('')}} disabled={busy||!!loadError}>Xóa ảnh đang chọn</button>}</div>}
 </div><AudioSettings music={music}/><p className="save-note">Ảnh chỉ thay đổi khi lưu hoặc xóa thành công. Mở lại trang hoặc đổi thiết bị vẫn giữ các thay đổi.</p></div></dialog>
}
