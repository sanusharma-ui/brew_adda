'use client';
export default function ErrorPage({reset}:{reset:()=>void}) { return <main id="main" className="shell page-content empty"><p className="eyebrow">A BRIEF COFFEE BREAK</p><h1>We’ll be <em>right back.</em></h1><p>We couldn’t load the latest café details. Please try again shortly.</p><button className="button" onClick={reset}>Try again</button></main>; }
