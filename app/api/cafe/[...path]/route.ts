import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(request: Request) {
  const endpoint = new URL(request.url).pathname.replace(/^\/api\/cafe/, "");
  const allowed = request.method === "GET" ? ["/menu", "/status"] : ["/quote"];
  if (!allowed.includes(endpoint)) return Response.json({ error: "Not found" }, { status: 404 });
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json({ error: "Invalid request origin" }, { status: 403 });
    }
  }
  let body: string | undefined;
  if (request.method === "POST") {
    body = await request.text();
    if (new TextEncoder().encode(body).length > 8192) {
      return Response.json({ error: "Order is too large" }, { status: 413 });
    }
  }
  try {
    // The local credential stays on the Next.js server, never in the browser.
    const session = JSON.parse(await readFile(path.join(process.cwd(), ".selfheal", "cafe-api.json"), "utf8"));
    const url = new URL(session.url);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.username || url.password ||
        typeof session.token !== "string" || !session.token) throw new Error("Invalid cafe session");
    const response = await fetch(new URL(endpoint, url), {
      method: request.method,
      headers: { "Content-Type": "application/json", "X-Cafe-Token": session.token },
      body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    return Response.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Cafe backend is offline or busy. Start cafe_billing.py and retry." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = forward;
export const POST = forward;
