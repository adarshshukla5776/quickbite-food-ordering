import type { Metadata } from 'next';
import './globals.css';
import './customer-auth.css';
export const metadata: Metadata={title:'QuickBite | Good food, good mood',description:'Crave-worthy food delivered to your door. Explore delicious picks on QuickBite.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
