'use client';
import {useRef,useState} from 'react';
import type {useMusic} from '@/lib/use-music';
import type {MusicTrack} from '@/lib/tracks';
export default function AudioSettings({music}:{music:ReturnType<typeof useMusic>}){
 const input=useRef<HTMLInputElement>(null),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 async function save(event:React.FormEvent){
  event.preventDefault();if(!file||busy)return;setBusy(true);setStatus('Đang lưu nhạc…');setError('');
  try{const form=new FormData();form.append('audio',file);form.append('start','0');const response=await fetch('/api/tracks/den-khi-nao',{method:'PUT',body:form});const data=await response.json() as {track:MusicTrack;error?:string};if(!response.ok)throw new Error(data.error||'Chưa lưu được nhạc.');music.useTrack(data.track);setFile(null);setStatus('Đã lưu nhạc. Phát đầy đủ từ đầu và lặp lại.')}catch(e){setError(e instanceof Error?e.message:'Chưa lưu được nhạc.');setStatus('')}finally{setBusy(false)}
 }
 return <details className="audio-settings"><summary>Nhạc nền</summary><form onSubmit={save}><p>{music.uploaded?'Đang dùng tệp nhạc đã tải lên.':'Tệp nhạc đang có dài khoảng 39 giây. Chọn MP3/M4A đầy đủ để thay bản dài hơn.'}</p><input ref={input} type="file" accept="audio/*,.mp3,.m4a" hidden onChange={e=>{setFile(e.target.files?.[0]||null);e.target.value='';setStatus('');setError('')}}/><div className="audio-actions"><button className="soft-button" type="button" disabled={busy} onClick={()=>input.current?.click()}>{file?'Đổi tệp đã chọn':'Chọn tệp nhạc'}</button><button className="soft-button" type="submit" disabled={!file||busy}>{busy?'Đang lưu…':'Lưu nhạc nền'}</button></div>{file&&<p>{file.name}</p>}{(error||music.error)&&<p className="feedback error" role="alert">{error||music.error}</p>}{status&&<p className="feedback" role="status">{status}</p>}</form></details>;
}
