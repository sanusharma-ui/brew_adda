# Lumea Coffee House

A responsive Next.js coffee-house website with a MongoDB-backed owner panel.

## Run locally

Use Node.js 20.19+ (Node.js 22 LTS recommended). Install dependencies with `npm.cmd install`, then:

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to your MongoDB Atlas connection string or local MongoDB URI. Replace the example credentials and URL-encode special characters in passwords. Set `MONGODB_DB` to the intended database.
3. Set a unique `ADMIN_PASSWORD` of at least 12 characters and a random `SESSION_SECRET` of at least 32 characters. Generate a secret using the command in `.env.example`.
4. For Atlas, allow the application's outbound IP in Network Access and give the database user read/write access to the selected database.
5. Run `npm.cmd run dev` and visit `http://localhost:3000`. Owner panel: `http://localhost:3000/admin`.

No real credentials are included. Restart the app after changing environment variables. Never use `NEXT_PUBLIC_` prefixes for these secrets. The old SelfHeal environment file, Python virtual environment, demo backend, billing routes, proxy, and runtime state have been removed.

Without `MONGODB_URI`, public pages show a labelled sample menu preview. Admin writes never fall back to browser storage or a local file. If a configured database is unreachable, public data pages show a retry screen rather than silently presenting old data. An empty database starts with the sample catalog; the first Publish saves it.

## Pages and owner workflow

- `/`: café overview, generated interior hero, featured menu, story, visit links.
- `/menu`: searchable menu, category filters, pricing, availability, allergen note.
- `/about`: café story and philosophy.
- `/gallery`: visual moodboard.
- `/visit`: configurable address, hours, phone, email, map link, and FAQs.
- `/privacy`: data handling disclosure.
- `/admin`: owner sign-in, add/edit/remove menu items, availability and featured controls, shop details.

In the owner panel, choose an item, edit its fields, and click **Apply to draft**. Click **Publish changes** to persist the complete catalog. Removal is also staged until publishing. The first three available featured items appear on the home page. A revision check rejects stale writes from another session. There is no online checkout or automatic reservation confirmation; contact and directions links activate only when configured.

## MongoDB and security

The `catalog` collection holds one document (`_id: main`) containing items, settings, and a revision. Writes use an atomic revision match. `security` holds the shared owner-login attempt window (10 attempts per 15 minutes across application instances). Owner authentication uses an eight-hour signed HttpOnly, SameSite=Strict cookie, Secure on HTTPS. API writes verify both session and Origin. Changing either auth secret invalidates previous sessions. Use HTTPS and a trusted reverse proxy with a consistent request origin for production.

## Validation and deployment

`npx.cmd tsc --noEmit` checks types. `npm.cmd run build` creates the production build; `npm.cmd start` serves it. Hosting must support the Next.js Node runtime and MongoDB connectivity; static export cannot support the admin APIs. Provide the same environment keys on the hosting platform.

Before using real café details: verify phone/address/hours/prices, publish a test menu change against your MongoDB, reload `/menu` in another browser, verify signed-out requests cannot write, and check mobile/desktop layouts. No real MongoDB credentials were provided during implementation, so live database persistence is not claimed as tested.

## Artwork

`public/images/cafe-interior.png` was generated using the built-in imagegen tool for this project. Prompt: “Wide photorealistic editorial photograph of a fictional independent café; warm walnut counter and furniture, cream plaster walls, arched windows, espresso machine, ceramic cups, plants, amber pendants, morning light; darker left side for white copy, sunlit seating on the right; no people, text, logos, or watermark.”

The other images are illustrative Unsplash assets defined in `lib/catalog.ts`; the owner can replace item image URLs with HTTPS images or `/images/filename` assets. Typography uses Google Fonts with local system fallbacks. The café story and menu are fictional concept content, not verified claims about a real business.

Implementation references: [Next.js response cookies](https://nextjs.org/docs/app/api-reference/functions/next-response), [MongoDB atomic compound operations](https://www.mongodb.com/docs/drivers/node/current/crud/compound-operations/).
