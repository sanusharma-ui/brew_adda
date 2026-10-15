import { publicCatalog } from '../../lib/store';
import MenuBrowser from '../components/menu-browser';
export const metadata = { title: 'Our menu' };
export const dynamic = 'force-dynamic';
export default async function Menu() { const {catalog:{items},preview} = await publicCatalog(); return <main id="main" className="shell page-content"><div className="page-intro"><p className="eyebrow">FIND YOUR KIND OF COMFORT</p><h1>A cup for <em>every mood.</em></h1><p>Good coffee, something buttery, and all the time you need.</p>{preview && <span className="preview-note">Sample menu preview</span>}</div><MenuBrowser items={items}/><aside className="allergen-note"><strong>A little note before you order.</strong><p>Our menu may contain milk, gluten, nuts, and other allergens. Please ask the team about ingredients and dietary preferences before ordering. Prices are in INR. Final pricing and availability are confirmed in store.</p></aside></main>; }
