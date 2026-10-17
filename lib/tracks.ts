export interface MusicTrack {id:string;title:string;src:string|null;start:number;order:number;version?:string}
export const defaultTracks:MusicTrack[]=[
 {id:'den-khi-nao',title:'Đến khi nào',src:'/assets/den-khi-nao.mp3',start:0,order:0}
];
