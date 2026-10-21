import type { Metadata } from "next";

/**
 * Public identity of the site, used for canonical URLs, sitemaps and structured data.
 * Set NEXT_PUBLIC_SITE_URL to the real domain in production — it is inlined at build time, so
 * it must be present when `next build` runs. On Vercel the production domain is the fallback.
 */
export const SITE_NAME = "InfoBrokerBD";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3100")
).replace(/\/+$/, "");

export const SITE_TAGLINE = "Best shops, services & places in Bangladesh — reviewed by locals";

export const SITE_DESCRIPTION =
  "Real experiences from real people in Bangladesh: the best phone repair shops, electricians, tour guides, restaurants and places in Dhaka, Chattogram and every district. সেরা দোকান, মিস্ত্রি আর ঘোরার জায়গার খোঁজ — মানুষের সত্যিকারের অভিজ্ঞতা থেকে।";

/**
 * A page's `openGraph` replaces the layout's instead of merging (and drops the file-based
 * app/opengraph-image too), so every page spreads these in. Pages with a photo override `images`.
 */
export const OG_DEFAULTS = {
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "en_BD",
  alternateLocale: ["bn_BD"],
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — the best shops, services and places in Bangladesh` }],
};

/** Title, description, canonical and matching share card for a page with a fixed address. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_DEFAULTS, url: path, title, description },
  };
}

/** Catch-all categories make poor landing pages ("Best Other in Bangladesh"); they stay out of the index. */
export const isListedCategory = (slug: string) => slug !== "other";

/** Landing pages with fewer public posts than this are kept out of the index (thin content). */
export const MIN_POSTS_TO_INDEX = 2;

/** Absolute, percent-encoded URL (Bangla slugs included), as sitemaps and canonical tags require. */
export const absoluteUrl = (path = "/") => new URL(path, `${SITE_URL}/`).href;

/** Safe body for a `<script type="application/ld+json">` tag. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

export const cityHref = (city: string) => `/in/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"))}`;
export const categoryHref = (slug: string, city?: string | null) =>
  `/c/${slug}${city ? `/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"))}` : ""}`;

/** "cox's-bazar" (from a URL) → "cox's bazar", matched case-insensitively against post cities. */
export const cityFromParam = (param: string) => decodeURIComponent(param).replace(/-/g, " ").trim();
