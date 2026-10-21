"use client";

import { LocateFixed, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTIONS = ["Phone repair", "Electrician", "AC servicing", "ইলেকট্রিশিয়ান", "Tour guide", "Kacchi"];

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const go = (query: string) => router.push(`/explore?q=${encodeURIComponent(query)}`);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go(q.trim());
          else router.push("/explore");
        }}
        className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lift"
      >
        <Search className="ml-2.5 size-5 shrink-0 text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What do you need? e.g. laptop repair"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-stone-400"
          enterKeyHint="search"
        />
        <button className="h-11 shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 sm:px-5">
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => router.push("/explore?near=1")}
          className="flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-brand-800 shadow-sm active:scale-95"
        >
          <LocateFixed className="size-3.5" /> Near me
        </button>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            onClick={() => go(s)}
            className={`${i >= 3 ? "max-sm:hidden " : ""}h-8 rounded-full bg-white/15 px-3 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/25 active:scale-95`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
