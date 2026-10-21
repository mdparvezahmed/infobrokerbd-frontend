import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/site";
import { MapLoader } from "./MapLoader";

export const metadata: Metadata = pageMetadata({
  title: "Map of Local Reviews & Places in Bangladesh",
  description: "See what people shared around you on the map — the best shops, services, places and tips across Bangladesh, pinned to the exact spot.",
  path: "/map",
});

export default function MapPage() {
  return (
    <>
      {/* The map is full-screen, so its heading is for screen readers and search engines only */}
      <h1 className="sr-only">Map of local reviews, shops, services and places in Bangladesh</h1>
      <Suspense>
        <MapLoader />
      </Suspense>
    </>
  );
}
