"use client";

import { useState } from "react";

const destinations = [
  {
    name: "Amalfi Coast",
    country: "Italy",
    image:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=85",
    tag: "slow summer",
  },
  {
    name: "Kyoto",
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=85",
    tag: "old soul",
  },
  {
    name: "Marrakech",
    country: "Morocco",
    image:
      "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1000&q=85",
    tag: "sun & spice",
  },
];

const Arrow = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 10h13M11 5l5 5-5 5" />
  </svg>
);

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) setSubscribed(true);
  }

  return (
    <main>
      <nav className="nav shell">
        <a href="#" className="logo" aria-label="Lumea home">
          lume<span>a</span>
        </a>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#philosophy" onClick={() => setMenuOpen(false)}>Our approach</a>
          <a href="#destinations" onClick={() => setMenuOpen(false)}>Destinations</a>
          <a href="#journal" onClick={() => setMenuOpen(false)}>The journal</a>
          <a href="/billing" onClick={() => setMenuOpen(false)}>Cafe billing</a>
        </div>
        <a href="#start" className="nav-cta">Plan a trip <Arrow /></a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span />
        </button>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Travel, made luminous</p>
          <h1>Go somewhere<br /><em>that stays</em> with you.</h1>
          <p className="hero-description">
            Thoughtful journeys for curious people. We find the beautiful in-between
            places, and make getting there feel effortless.
          </p>
          <div className="hero-actions">
            <a href="#destinations" className="button button-dark">Find your somewhere <Arrow /></a>
            <a href="#philosophy" className="text-link">Why Lumea <span>↗</span></a>
          </div>
        </div>
        <div className="hero-art" aria-label="A sunlit coastal village viewed from above">
          <div className="sun-glow" />
          <div className="hero-image" />
          <div className="hero-note"><span>01</span><span>Places with<br />a pulse</span></div>
          <div className="scroll-note">scroll to explore <span>↓</span></div>
        </div>
      </section>

      <section className="marquee" aria-label="Lumea values">
        <div>GO SLOW <span>✳</span> LOOK CLOSER <span>✳</span> STAY CURIOUS <span>✳</span> GO SLOW <span>✳</span> LOOK CLOSER <span>✳</span></div>
      </section>

      <section className="philosophy shell" id="philosophy">
        <div className="section-label"><span>02</span><span>Our approach</span></div>
        <div className="philosophy-content">
          <h2>Not just a trip.<br /><em>A point of view.</em></h2>
          <div>
            <p className="large-copy">The best journeys change the way you see things. Lumea is a quieter way to travel — a collection of considered places, local rituals, and small moments worth going out of your way for.</p>
            <a href="#journal" className="text-link underline-link">Read our story <Arrow /></a>
          </div>
        </div>
      </section>

      <section className="destinations shell" id="destinations">
        <div className="section-heading">
          <div><div className="section-label"><span>03</span><span>Right now, somewhere</span></div><h2>Go where the<br /><em>light is good.</em></h2></div>
          <a href="#start" className="text-link">View all places <Arrow /></a>
        </div>
        <div className="destination-grid">
          {destinations.map((destination, index) => (
            <a className={`destination-card card-${index + 1}`} href="#start" key={destination.name}>
              <div className="destination-image" style={{ backgroundImage: `url(${destination.image})` }} />
              <div className="card-shade" />
              <div className="card-top"><span>0{index + 1}</span><span>{destination.tag}</span></div>
              <div className="card-bottom"><span><strong>{destination.name}</strong><small>{destination.country}</small></span><span className="circle-arrow"><Arrow /></span></div>
            </a>
          ))}
        </div>
      </section>

      <section className="itinerary shell" id="journal">
        <div className="itinerary-image" />
        <div className="itinerary-copy">
          <div className="section-label"><span>04</span><span>From the journal</span></div>
          <p className="kicker">A three-day guide</p>
          <h2>The art of<br /><em>doing less</em><br />in Hydra.</h2>
          <p>Salt on your skin, a book with no plot, and nowhere else to be. Our field notes for a slower kind of Greek island summer.</p>
          <a href="#start" className="button button-outline">Read the guide <Arrow /></a>
        </div>
      </section>

      <section className="quote-section shell">
        <div className="quote-mark">“</div>
        <blockquote>Travel is not about<br />escaping life. <em>It&apos;s about<br />making it bigger.</em></blockquote>
        <p className="quote-author">— Lumea field notes, vol. 01</p>
      </section>

      <section className="newsletter" id="start">
        <div className="newsletter-inner shell">
          <div className="section-label light"><span>05</span><span>Come along</span></div>
          <h2>Keep a little<br /><em>light on.</em></h2>
          <p>New places, thoughtful stays, and a reason to look up — in your inbox, once in a while.</p>
          {subscribed ? (
            <p className="success-message">You&apos;re on the list. See you out there ✳</p>
          ) : (
            <form onSubmit={subscribe} className="subscribe-form">
              <label htmlFor="email" className="sr-only">Your email address</label>
              <input id="email" type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <button type="submit" aria-label="Subscribe"><Arrow /></button>
            </form>
          )}
        </div>
        <div className="newsletter-orb" />
      </section>

      <footer className="footer shell">
        <a href="#" className="logo">lume<span>a</span></a>
        <p>Thoughtful journeys for curious people.</p>
        <div className="footer-links"><a href="#philosophy">Instagram</a><a href="#journal">Contact</a><a href="#start">Terms</a></div>
        <small>© 2024 Lumea Travel Co.</small>
      </footer>
    </main>
  );
}
