import { MongoClient } from 'mongodb';
import { Catalog, initialCatalog, categories } from './catalog';
const globalMongo = globalThis as unknown as { coffeeMongo?: Promise<MongoClient> };
export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<') || uri.includes('YOUR_')) throw new Error('Configure MONGODB_URI in .env.local.');
  if (!globalMongo.coffeeMongo) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    globalMongo.coffeeMongo = client.connect().catch(async e => { globalMongo.coffeeMongo = undefined; await client.close(); throw e; });
  }
  return (await globalMongo.coffeeMongo).db(process.env.MONGODB_DB || 'lumea_coffee');
}
export async function readCatalog(): Promise<Catalog> {
  const collection = (await database()).collection<Catalog & { _id: string }>('catalog');
  const doc = await collection.findOne({ _id: 'main' });
  if (!doc) return structuredClone(initialCatalog);
  return { revision: doc.revision, items: doc.items, settings: doc.settings };
}
export async function publicCatalog() {
  if (!process.env.MONGODB_URI) return { catalog: structuredClone(initialCatalog), preview: true };
  return { catalog: await readCatalog(), preview: false };
}
export function validateCatalog(value: unknown): Catalog {
  const c = value as Catalog;
  if (!c || !Number.isSafeInteger(c.revision) || !Array.isArray(c.items) || c.items.length > 150 || !c.settings) throw new Error('Invalid catalog.');
  const text = (x: unknown, max: number, required = false) => typeof x === 'string' && x.length <= max && (!required || x.trim().length > 0);
  const ids = new Set<string>();
  for (const i of c.items) {
    if (!i || !text(i.id, 80, true) || ids.has(i.id) || !text(i.name, 80, true) || !text(i.description, 300, true) || !Number.isFinite(i.price) || i.price < 1 || i.price > 100000 || !categories.includes(i.category as typeof categories[number]) || typeof i.available !== 'boolean' || typeof i.featured !== 'boolean' || !text(i.image, 1500)) throw new Error('Check item names, prices, categories, and descriptions.');
    if (i.image && !/^\/images\/[\w.-]+$/.test(i.image)) { const u = new URL(i.image); if (u.protocol !== 'https:') throw new Error('Images must use HTTPS or /images/ paths.'); }
    ids.add(i.id);
  }
  for (const key of ['tagline', 'address', 'hours', 'email', 'phone'] as const) if (!text(c.settings[key], 300, key === 'tagline' || key === 'hours')) throw new Error('Check shop details.');
  if (c.settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.settings.email)) throw new Error('Enter a valid email.');
  if (c.settings.phone && !/^[+\d\s()-]{6,30}$/.test(c.settings.phone)) throw new Error('Enter a valid phone number.');
  return { revision: c.revision, items: c.items.map(i => ({ id: i.id, name: i.name.trim(), description: i.description.trim(), price: i.price, category: i.category, available: i.available, featured: i.featured, image: i.image })), settings: { tagline: c.settings.tagline, address: c.settings.address, hours: c.settings.hours, email: c.settings.email, phone: c.settings.phone } };
}
export async function saveCatalog(catalog: Catalog) {
  const collection = (await database()).collection<Catalog & { _id: string }>('catalog');
  const updated = { ...catalog, revision: catalog.revision + 1 };
  try {
    const result = await collection.replaceOne({ _id: 'main', revision: catalog.revision }, updated, { upsert: catalog.revision === 0 });
    if (!result.matchedCount && !result.upsertedCount) throw new Error('Menu changed in another session. Reload before saving.');
  } catch(e) { if ((e as {code?:number}).code === 11000) throw new Error('Menu changed in another session. Reload before saving.'); throw e; }
  return updated;
}
