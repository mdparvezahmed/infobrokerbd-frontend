"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { addBaseLayer, postIcon } from "./leaflet-utils";

/** Small static map showing where a post is. */
export default function MiniMap({ lat, lng, icon, color }: { lat: number; lng: number; icon: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    }).setView([lat, lng], 16);
    addBaseLayer(map);
    L.marker([lat, lng], { icon: postIcon(icon, color), interactive: false }).addTo(map);
    return () => {
      map.remove();
    };
  }, [lat, lng, icon, color]);

  return <div ref={ref} className="size-full" />;
}
