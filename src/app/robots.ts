import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PRIVATE = ["/admin", "/dashboard", "/api/", "/login", "/register", "/new"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Search-result and filter combinations of /explore are endless; the category and city pages cover them.
      { userAgent: "*", allow: "/", disallow: [...PRIVATE, "/explore?"] },
      // Named so the AI answer engines (ChatGPT, Claude, Perplexity, Gemini…) can read and cite the site.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "Amazonbot",
          "CCBot",
        ],
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
