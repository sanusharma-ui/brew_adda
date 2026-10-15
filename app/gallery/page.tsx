import { photos } from "../../lib/catalog";
import Link from "next/link";
export const metadata = { title: "The space" };
export default function Gallery() {
  return (
    <main id="main" className="shell page-content">
      <div className="page-intro">
        <p className="eyebrow">TAKE A LOOK AROUND</p>
        <h1>
          Stay for <em>the feeling.</em>
        </h1>
        <p>
          Warm light, cosy corners, and the little details that make a place
          feel like yours.
        </p>
      </div>
      <div className="gallery-grid">
        {[
          ["/images/cafe-interior.png", "01 / Your everyday escape"],
          [photos.latte, "02 / A little latte art"],
          [photos.pastry, "03 / Golden mornings"],
          [photos.coffee, "04 / The daily ritual"],
        ].map(([src, label]) => (
          <figure key={src}>
            <img src={src} alt={label.slice(5)} loading="lazy" />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      <p className="image-note">
        A visual moodboard for Lumea. Café interior is AI-generated; food and
        coffee images are illustrative.
      </p>
      <div className="center-cta">
        <h2>
          Looks like <em>your kind of place?</em>
        </h2>
        <Link className="button" href="/visit">
          Plan a visit ↗
        </Link>
      </div>
    </main>
  );
}
