'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
const links = [['/', 'Home'], ['/menu', 'Our menu'], ['/about', 'Our story'], ['/gallery', 'The space'], ['/visit', 'Visit us']];
export default function Header() {
 const [open, setOpen] = useState(false); const pathname = usePathname();
 const [scrolled, setScrolled] = useState(false);
 useEffect(() => {
   const updateScroll = () => setScrolled(window.scrollY > 24);
   updateScroll();
   window.addEventListener('scroll', updateScroll, { passive: true });
   return () => window.removeEventListener('scroll', updateScroll);
 }, []);
 useEffect(() => { setOpen(false); }, [pathname]);
 return <><a className="skip-link" href="#main">Skip to content</a><header className={`site-header ${pathname === '/' && !scrolled ? 'over-hero' : 'glass-header'}`}><Link className="brand" href="/" aria-label="Lumea Coffee House home">lumea<span>COFFEE HOUSE</span></Link><button className="nav-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? 'Close ✕' : 'Menu ☰'}</button><nav id="main-nav" className={open ? 'navigation open' : 'navigation'} aria-label="Main navigation" onKeyDown={e => { if(e.key === 'Escape') setOpen(false); }}>{links.map(([href,label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav><Link className="button nav-visit" href="/visit">Find your corner <span>↗</span></Link></header></>;
}
