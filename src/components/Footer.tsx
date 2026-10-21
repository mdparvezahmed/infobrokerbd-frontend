import Link from "next/link";
import { serverApi } from "@/lib/server-api";
import { categoryHref, cityHref, SITE_NAME } from "@/lib/site";
import { topCities } from "@/lib/places";
import type { Category, Place } from "@/lib/types";
import { FooterGate } from "./FooterGate";
import { LogoMark } from "./Logo";

/**
 * Server-rendered links to every category and the busiest cities. Besides helping people,
 * this is how search engines discover the landing pages from any page on the site.
 */
export async function Footer() {
  const [cats, places] = await Promise.all([
    serverApi<{ categories: Category[] }>("/categories"),
    serverApi<{ places: Place[] }>("/seo/places"),
  ]);
  const categories = cats?.categories ?? [];
  const cities = topCities(places?.places ?? [], 12);

  return (
    <FooterGate>
      <footer className="border-t border-black/5 bg-white pb-28 pt-10 md:pb-10">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark size={28} />
              <span className="font-extrabold tracking-tight">
                InfoBroker<span className="text-brand-600">BD</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-stone-500">
              Honest reviews, tips and warnings about shops, services and places across Bangladesh — shared by the people who used
              them.
            </p>
            <p className="bn mt-2 text-sm text-stone-500" lang="bn">
              বাংলাদেশের সেরা দোকান, মিস্ত্রি আর ঘোরার জায়গা — মানুষের সত্যিকারের অভিজ্ঞতা থেকে।
            </p>
          </div>

          {categories.length > 0 && (
            <nav aria-label="Categories">
              <h2 className="text-xs font-bold uppercase tracking-wide text-stone-400">Find the best</h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={categoryHref(c.slug)} className="block leading-tight text-stone-600 hover:text-brand-700">
                      {c.name}
                      <span className="bn block text-xs text-stone-400" lang="bn">
                        {c.nameBn}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {cities.length > 0 && (
            <nav aria-label="Cities">
              <h2 className="text-xs font-bold uppercase tracking-wide text-stone-400">Cities & areas</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {cities.map((c) => (
                  <li key={c.city}>
                    <Link href={cityHref(c.city)} className="text-stone-600 hover:text-brand-700">
                      Best in {c.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label={SITE_NAME}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-stone-400">{SITE_NAME}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {[
                ["/explore", "Explore all findings"],
                ["/map", "Map"],
                ["/leaderboard", "Top contributors"],
                ["/new", "Share a finding"],
                ["/guidelines", "Community guidelines"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-stone-600 hover:text-brand-700">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </FooterGate>
  );
}
