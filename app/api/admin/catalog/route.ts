import { NextResponse } from 'next/server';
import { authenticated, sameOrigin } from '../../../../lib/auth';
import { readCatalog, saveCatalog, validateCatalog } from '../../../../lib/store';
export const runtime = 'nodejs';
export async function GET() { if(!await authenticated()) return NextResponse.json({error:'Please sign in.'},{status:401}); try{return NextResponse.json(await readCatalog(),{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Database unavailable. Check MONGODB_URI and network access.'},{status:503});} }
export async function PUT(request: Request) { if(!sameOrigin(request)||!await authenticated()) return NextResponse.json({error:'Session expired. Sign in again.'},{status:401}); try{const body=await request.text();if(body.length>300000)throw new Error('Catalog too large.');return NextResponse.json(await saveCatalog(validateCatalog(JSON.parse(body))));}catch(e){return NextResponse.json({error:e instanceof Error && e.message.startsWith('Menu changed')?e.message:'Could not save. Check item fields and database connection.'},{status:400});} }
