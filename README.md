# InfoBrokerBD — Frontend (website)

The website for **InfoBrokerBD**: find the best shops, services and places around you, from people who've been there. Mobile-first, works in Bangla and English.

It talks to the separate **infobrokerbd-backend** repo (Fastify API) — the browser only ever calls this site's `/api`, which is proxied to the backend.

**Stack:** Next.js 16 (App Router, Cache Components / Partial Prerendering) · React 19 · Tailwind CSS 4 · Leaflet + OpenStreetMap · lucide icons.

## Pages

| | |
|---|---|
| `/` | Hero search, categories, latest findings, top contributors |
| `/explore` | Search + filters (category, type, near me + distance, sort) with infinite scroll |
| `/map` | Full-screen map of all findings with clusters; "post here" |
| `/new` | 3-step posting wizard: pin location → details → photos (anonymous or logged in) |
| `/p/[id]` | Post page: photos, helpful vote, directions, share, report, comments, nearby (server-rendered for SEO) |
| `/leaderboard` | Ranking for week / month / all time |
| `/dashboard` | Your rank, points, posts and new comments |
| `/u/[username]` | Public profile |
| `/admin` | Reports queue, posts, comments, users, moderation log (admins only) |
| `/login` `/register` `/guidelines` | |

## Run locally

Requires Node.js ≥ 20.19 and the backend running (default `http://localhost:4000`).

```bash
npm install
cp .env.example .env.local     # API_URL + PROXY_SECRET (same value as the backend's PROXY_SECRET)
npm run dev                    # http://localhost:3000
```

| Script | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

## Deploy to Vercel

Deploy the backend first, then:

1. Push this folder to its own GitHub repo; in Vercel **Add New → Project →** import it (framework: Next.js, detected automatically).
2. **Environment variables:**

   | Name | Value |
   |---|---|
   | `API_URL` | the backend URL, e.g. `https://infobrokerbd-api.vercel.app` (no trailing slash) |
   | `PROXY_SECRET` | **same value** as the backend's `PROXY_SECRET` |
   | `NEXT_PUBLIC_MAP_TILE_URL` | optional — map tile provider for heavy traffic (see `.env.example`) |

3. Deploy, then add your domain under **Settings → Domains**.

`API_URL` is read at build time too, so redeploy the frontend if the backend URL changes.

## How it connects to the backend

- **`src/app/api/[...path]/route.ts`** proxies every `/api/*` request to `API_URL`. Because the browser stays on one origin, the login cookie is first-party (works in Safari / with third-party cookies blocked) and there's no CORS. The proxy adds the visitor's IP (`X-Client-IP`) together with `PROXY_SECRET`, so the backend can rate-limit real visitors rather than this server.
- **Server Components** fetch from the backend through `src/lib/server-api.ts` (uncached, inside `<Suspense>`), so `next build` never needs the backend to be running.
- **Photos** come back as full URLs (Vercel Blob / S3) and render with a plain `<img>`; for a backend storing photos on its own disk, `/uploads/*` is rewritten to the backend in `next.config.ts`.

## Project structure

```
src/
  app/                 routes (see Pages); api/[...path]/route.ts = backend proxy
  components/          UI: header & bottom nav, post cards, maps (Leaflet), post page parts, ui.tsx primitives
  lib/                 api client, server fetch, hooks (infinite list, geolocation), formatting, types, image compression
```

Notes: map tiles default to OpenStreetMap's free servers (moderate traffic only); photos are compressed in the browser before upload so a post stays under Vercel's 4.5 MB request limit.
