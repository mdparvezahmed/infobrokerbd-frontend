"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui";

// Leaflet touches `window`, so the map only renders in the browser.
const ExploreMap = dynamic(() => import("@/components/map/ExploreMap"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-stone-100">
      <Spinner className="size-8" />
    </div>
  ),
});

export function MapLoader() {
  return <ExploreMap />;
}
