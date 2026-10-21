import type { NextConfig } from "next";

/** The InfoBrokerBD backend (Fastify API). */
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/**
 * Crawlers that don't run JavaScript must get <title>/<meta> in the initial <head> instead of streamed.
 * Next's default list (copied from next/dist/shared/lib/router/utils/html-bots) plus the AI answer
 * engines, which read raw HTML. Setting this option replaces the default list, hence the copy.
 */
const HTML_LIMITED_BOTS = new RegExp(
  [
    "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare",
    "quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot",
    "LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight",
    "GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User|Amazonbot|CCBot",
    "meta-externalagent|Bytespider|YouBot|DuckAssistBot|cohere-ai|MistralAI-User|TelegramBot|Viber",
  ].join("|"),
  "i",
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  htmlLimitedBots: HTML_LIMITED_BOTS,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // /api/* is proxied by src/app/api/[...path]/route.ts (it forwards the visitor's IP securely).
  // Photos stored on the backend's own disk (STORAGE_DRIVER=local) are served from /uploads;
  // with Vercel Blob / S3 the photo URLs point straight at the storage and this isn't used.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` }];
  },
};

export default nextConfig;
