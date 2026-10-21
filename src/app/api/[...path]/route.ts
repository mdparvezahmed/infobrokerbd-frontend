import type { NextRequest } from "next/server";

/**
 * Same-origin proxy to the backend: the browser only ever talks to this site, so the login
 * cookie is first-party and there is no CORS. The visitor's IP (set by Vercel / nginx in
 * X-Forwarded-For) is passed on with the shared PROXY_SECRET, so the backend can rate-limit
 * and de-duplicate reports per real visitor instead of per frontend server.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const PROXY_SECRET = process.env.PROXY_SECRET;

const FORWARD_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "cookie", "user-agent"];
// Hop-by-hop / encoding headers must not be copied: fetch has already decoded the body.
const DROP_RESPONSE_HEADERS = new Set(["connection", "keep-alive", "transfer-encoding", "content-encoding", "content-length", "set-cookie"]);

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (PROXY_SECRET) {
    headers.set("x-proxy-secret", PROXY_SECRET);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
    if (ip) headers.set("x-client-ip", ip);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
      cache: "no-store",
      // Stream the request body (photo uploads) instead of buffering it
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ error: "Bad Gateway", message: "Can't reach the server right now — please try again" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!DROP_RESPONSE_HEADERS.has(key)) responseHeaders.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
