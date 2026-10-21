"use client";

import dynamic from "next/dynamic";

const MiniMap = dynamic(() => import("@/components/map/MiniMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-stone-100" />,
});

export function MiniMapLoader(props: { lat: number; lng: number; icon: string; color: string }) {
  return <MiniMap {...props} />;
}
