import type { PostKind, ReportReason } from "./types";

export const KINDS: Record<PostKind, { label: string; labelBn: string; emoji: string; hint: string; tone: string }> = {
  REVIEW: {
    label: "Review",
    labelBn: "রিভিউ",
    emoji: "⭐",
    hint: "Rate a shop, service or person you used",
    tone: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  RECOMMENDATION: {
    label: "Best pick",
    labelBn: "সেরা খোঁজ",
    emoji: "🏆",
    hint: "Who is the best around here for something",
    tone: "bg-brand-50 text-brand-800 ring-brand-200",
  },
  EXPERIENCE: {
    label: "Experience",
    labelBn: "অভিজ্ঞতা",
    emoji: "🧳",
    hint: "A trip, tour, guide or place you visited",
    tone: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  TIP: {
    label: "Local tip",
    labelBn: "টিপস",
    emoji: "💡",
    hint: "Useful local knowledge others should know",
    tone: "bg-violet-50 text-violet-800 ring-violet-200",
  },
  WARNING: {
    label: "Warning",
    labelBn: "সতর্কতা",
    emoji: "⚠️",
    hint: "Scams, bad service or things to avoid",
    tone: "bg-accent-50 text-accent-600 ring-accent-100",
  },
};

export const KIND_ORDER: PostKind[] = ["REVIEW", "RECOMMENDATION", "EXPERIENCE", "TIP", "WARNING"];
export const RATED_KINDS = new Set<PostKind>(["REVIEW", "RECOMMENDATION", "EXPERIENCE"]);

export const REPORT_REASONS: Record<ReportReason, string> = {
  SPAM: "Spam or advertising",
  FAKE: "Fake or misleading review",
  SCAM: "Scam or fraud",
  OFFENSIVE: "Offensive or abusive",
  WRONG_INFO: "Wrong information",
  PRIVACY: "Shares someone's private info",
  OTHER: "Something else",
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDistance(meters: number | null | undefined) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** True if the text is mostly Bangla — used to switch to the Bangla font/line-height. */
export function isBangla(text: string | null | undefined) {
  if (!text) return false;
  const bn = text.match(/[ঀ-৿]/g)?.length ?? 0;
  return bn > text.replace(/\s/g, "").length * 0.3;
}

export function placeLine(p: { placeName?: string | null; area?: string | null; city?: string | null }) {
  return [p.area, p.city].filter(Boolean).join(", ");
}

/** Stable pleasant color for avatars. */
export function colorFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase();
}

/** URL slug that keeps Bangla intact (its vowel signs are combining marks) but drops Latin accents. */
export function slugify(text: string) {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .normalize("NFC")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= 60) return slug;
  // Cut on a word boundary so the URL never ends in half a word
  const cut = slug.lastIndexOf("-", 60);
  return slug.slice(0, cut > 20 ? cut : 60);
}

/** `/p/42-honest-phone-repair-mirpur`. Only the leading id is read back; the slug is for people and search engines. */
export const postHref = (p: { id: number; title?: string }) => {
  const slug = p.title ? slugify(p.title) : "";
  return `/p/${p.id}${slug ? `-${slug}` : ""}`;
};
