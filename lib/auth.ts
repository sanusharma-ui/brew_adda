import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
export const cookieName = 'lumea_owner';
export function configured() { return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12 && !process.env.ADMIN_PASSWORD.includes('YOUR_') && process.env.ADMIN_PASSWORD !== 'a-long-unique-owner-password' && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 && !process.env.SESSION_SECRET.includes('YOUR_')); }
export function equal(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
function sign(value: string) { return createHmac('sha256', process.env.SESSION_SECRET!).update(value).update(process.env.ADMIN_PASSWORD!).digest('hex'); }
export function token() { const value = `${Date.now() + 8 * 60 * 60 * 1000}.${randomBytes(16).toString('hex')}`; return `${value}.${sign(value)}`; }
export async function authenticated() {
  if (!configured()) return false;
  const value = (await cookies()).get(cookieName)?.value || '';
  const [expiry, nonce, signature, extra] = value.split('.');
  return !extra && !!nonce && !!signature && Number(expiry) > Date.now() && equal(signature, sign(`${expiry}.${nonce}`));
}
export function sameOrigin(request: Request) { return request.headers.get('origin') === new URL(request.url).origin; }
