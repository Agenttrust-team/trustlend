import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const backend = process.env.BACKEND_URL;
  if (!backend) return Response.json({ message: "TrustLend API is not configured." }, { status: 503 });
  const { path } = await context.params;
  const safePath = path.map(encodeURIComponent).join("/");
  const prefix = ["api", "user", "health", "version"].includes(path[0]) ? "" : "api/";
  const target = new URL(`/${prefix}${safePath}${request.nextUrl.search}`, backend);
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "cookie", "idempotency-key", "last-event-id", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Forward only to the configured backend, never a client-supplied destination.
  const response = await fetch(target, {
    method: request.method, headers, redirect: "manual", cache: "no-store",
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    signal: request.signal,
  });
  const outgoing = new Headers();
  for (const name of ["content-type", "cache-control", "retry-after", "x-request-id"]) {
    const value = response.headers.get(name);
    if (value) outgoing.set(name, value);
  }
  for (const cookie of response.headers.getSetCookie()) outgoing.append("set-cookie", cookie);
  outgoing.set("cache-control", "no-store");
  return new Response(response.body, { status: response.status, headers: outgoing });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD };
