import { NextResponse } from "next/server";
import {
  authenticated,
  configured,
  cookieName,
  equal,
  sameOrigin,
  token,
} from "../../../../lib/auth";
import { database } from "../../../../lib/store";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(
    { authenticated: await authenticated(), configured: configured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  if (!configured())
    return NextResponse.json(
      {
        error:
          "Set ADMIN_PASSWORD (12+ characters) and SESSION_SECRET (32+ characters) in .env.local, then restart.",
      },
      { status: 503 },
    );
  try {
    const now = Date.now();
    const expired = { $lt: [{ $ifNull: ["$until", 0] }, now] };
    const bucket = await (await database())
      .collection<{ _id: string; until: number; count: number }>("security")
      .findOneAndUpdate(
        { _id: "owner-login" },
        [
          {
            $set: {
              until: { $cond: [expired, now + 900000, "$until"] },
              count: { $cond: [expired, 1, { $add: ["$count", 1] }] },
            },
          },
        ],
        { upsert: true, returnDocument: "after" },
      );
    if (!bucket || bucket.count > 10)
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
  } catch {
    return NextResponse.json(
      {
        error:
          "Database unavailable. Configure MONGODB_URI and check network access.",
      },
      { status: 503 },
    );
  }
  try {
    const body = await request.text();
    if (body.length > 2000) throw new Error();
    const { password } = JSON.parse(body);
    if (
      typeof password !== "string" ||
      !equal(password, process.env.ADMIN_PASSWORD!)
    )
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 },
      );
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(cookieName, token(), {
      httpOnly: true,
      sameSite: "strict",
      secure: new URL(request.url).protocol === "https:",
      maxAge: 28800,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const r = NextResponse.json({ ok: true });
  r.cookies.delete(cookieName);
  return r;
}
