export const categories = ['Coffee', 'Cold drinks', 'Tea & more', 'Fresh bakes'] as const;
export type Item = { id: string; name: string; description: string; price: number; category: string; available: boolean; featured: boolean; image: string };
export type Settings = { tagline: string; address: string; hours: string; email: string; phone: string };
export type Catalog = { revision: number; items: Item[]; settings: Settings };
export const photos = {
  latte: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=900&q=85',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85',
  pastry: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85',
  cold: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=85',
};
export const initialCatalog: Catalog = { revision: 0, settings: { tagline: 'Good coffee. A little breathing room.', address: '', hours: 'Monday – Sunday · 8:00 AM – 9:00 PM', email: '', phone: '' }, items: [
  { id: 'house-latte', name: 'The House Latte', description: 'A double espresso, silky steamed milk, and a soft caramel finish.', price: 240, category: 'Coffee', available: true, featured: true, image: photos.latte },
  { id: 'cold-brew', name: 'Slow-steeped Cold Brew', description: 'Smooth, chocolatey coffee, steeped slowly and poured over ice.', price: 260, category: 'Cold drinks', available: true, featured: true, image: photos.cold },
  { id: 'croissant', name: 'Butter Croissant', description: 'Golden, flaky layers. Best enjoyed warm, with your favourite cup.', price: 180, category: 'Fresh bakes', available: true, featured: true, image: photos.pastry },
  { id: 'espresso', name: 'Classic Espresso', description: 'A short, beautifully balanced shot with notes of cocoa and toasted nuts.', price: 150, category: 'Coffee', available: true, featured: false, image: photos.coffee },
  { id: 'cappuccino', name: 'Cappuccino', description: 'Equal parts espresso, warm milk, and cloud-soft foam.', price: 220, category: 'Coffee', available: true, featured: false, image: photos.latte },
  { id: 'iced-latte', name: 'Iced Vanilla Latte', description: 'Espresso and milk over ice, finished with a little vanilla.', price: 280, category: 'Cold drinks', available: true, featured: false, image: photos.cold },
  { id: 'chai', name: 'Spiced Chai', description: 'Black tea, warming spices, and milk. Comfort in a cup.', price: 160, category: 'Tea & more', available: true, featured: false, image: photos.coffee },
  { id: 'pain-chocolat', name: 'Pain au Chocolat', description: 'Buttery pastry wrapped around a rich dark chocolate centre.', price: 210, category: 'Fresh bakes', available: true, featured: false, image: photos.pastry },
] };
export const money = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(price);
