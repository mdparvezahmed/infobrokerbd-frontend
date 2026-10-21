import "server-only";
import { unstable_rethrow } from "next/navigation";

/**
 * Server Component data access. Requests are uncached on purpose (Cache Components treats
 * them as request-time data), so callers must sit inside <Suspense>. This also means
 * `next build` never needs the backend to be running.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const PROXY_SECRET = process.env.PROXY_SECRET;

export async function serverApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      // The shared secret marks this as our own server-side rendering (not rate-limited per IP).
      headers: { accept: "application/json", ...(PROXY_SECRET ? { "x-proxy-secret": PROXY_SECRET } : {}) },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    // Let Next.js handle its own control-flow errors (e.g. a prerender finishing before this fetch).
    unstable_rethrow(err);
    console.error("[serverApi]", err);
    return null;
  }
}
