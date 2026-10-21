import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCardSkeleton } from "@/components/PostCard";
import { pageMetadata } from "@/lib/site";
import { Explorer } from "./Explorer";

// Every search and filter variant points back here; categories and cities have their own pages.
export const metadata: Metadata = pageMetadata({
  title: "Search Local Reviews & Recommendations in Bangladesh",
  description:
    "Search honest reviews, recommendations, tips and scam warnings shared by people across Bangladesh — in English or বাংলা. Find the best shops, services and places near you.",
  path: "/explore",
});

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-3 px-4 pt-4">
          <div className="h-13 animate-pulse rounded-2xl bg-white shadow-card" />
          {Array.from({ length: 4 }, (_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <Explorer />
    </Suspense>
  );
}
