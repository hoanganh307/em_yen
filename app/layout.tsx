import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Chỉ dành riêng cho em',description:'Vì em xứng đáng với mọi điều tốt hơn thế nữa.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
