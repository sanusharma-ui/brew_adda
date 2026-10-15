import type { Metadata } from 'next';
import Header from './components/header';
import Footer from './components/footer';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Lumea Coffee House — A little pause, a better cup.', template: '%s | Lumea Coffee House' }, description: 'Find your everyday escape at Lumea. Explore our coffees, fresh bakes, and a warm space to slow down.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><Header/>{children}<Footer/></body></html>; }
