"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LocateFixed, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useDebounced } from "@/lib/hooks";
import type { GeoResult } from "@/lib/types";
import { addBaseLayer, meIcon } from "./leaflet-utils";

export interface PickedLocation {
  lat: number;
  lng: number;
}

/**
 * Pick a spot by moving the map under a fixed centre pin — much easier with one thumb than
 * dragging a tiny marker. Includes "use my location" and an address search.
 */
export default function LocationPicker({
  value,
  onChange,
  autoLocate,
}: {
  value: PickedLocation;
  onChange: (loc: PickedLocation) => void;
  autoLocate?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query.trim(), 450);
  const [found, setFound] = useState<{ q: string; results: GeoResult[] } | null>(null);
  const searchable = debounced.length >= 3;
  const results = searchable && found?.q === debounced ? found.results : [];
  const searching = searchable && found?.q !== debounced;
  const setResults = (r: GeoResult[]) => setFound(r.length ? { q: debounced, results: r } : { q: "", results: [] });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView([value.lat, value.lng], 16);
    addBaseLayer(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("movestart", () => setMoving(true));
    map.on("moveend", () => {
      setMoving(false);
      const c = map.getCenter();
      onChangeRef.current({ lat: Number(c.lat.toFixed(6)), lng: Number(c.lng.toFixed(6)) });
    });
    mapRef.current = map;
    if (autoLocate) locate();
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locate() {
    if (!("geolocation" in navigator)) return setLocError("Your browser doesn't support location");
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const map = mapRef.current;
        if (!map) return;
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        try {
          localStorage.setItem("ibb:lastLocation", JSON.stringify({ lat: ll[0], lng: ll[1] }));
        } catch {}
        meRef.current?.remove();
        accuracyRef.current?.remove();
        meRef.current = L.marker(ll, { icon: meIcon(), interactive: false }).addTo(map);
        if (pos.coords.accuracy < 2000) {
          accuracyRef.current = L.circle(ll, {
            radius: pos.coords.accuracy,
            color: "#2563eb",
            weight: 1,
            fillOpacity: 0.08,
            interactive: false,
          }).addTo(map);
        }
        map.flyTo(ll, 17, { duration: 0.7 });
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked — allow it in browser settings, or move the map to the spot."
            : "Couldn't get your location — move the map to the spot instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  useEffect(() => {
    if (debounced.length < 3) return;
    let cancelled = false;
    api<{ results: GeoResult[] }>("/geo/search", { query: { q: debounced } })
      .then((r) => !cancelled && setFound({ q: debounced, results: r.results }))
      .catch(() => !cancelled && setFound({ q: debounced, results: [] }));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-stone-100 shadow-card ring-1 ring-black/5">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Fixed centre pin — its tip marks the chosen spot */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[450] -translate-x-1/2 -translate-y-full">
        <div className={`transition-transform duration-200 ${moving ? "-translate-y-3" : ""}`}>
          <svg width="44" height="56" viewBox="0 0 44 56" className="drop-shadow-lg">
            <path d="M22 0C9.85 0 0 9.6 0 21.5 0 37.6 22 56 22 56s22-18.4 22-34.5C44 9.6 34.15 0 22 0Z" fill="#f43f5e" />
            <circle cx="22" cy="21" r="8" fill="#fff" />
          </svg>
        </div>
        <div
          className={`mx-auto -mt-1 h-1.5 rounded-full bg-black/30 blur-[1px] transition-all ${moving ? "w-3 opacity-40" : "w-4"}`}
        />
      </div>

      {/* Address search */}
      <div className="absolute inset-x-3 top-3 z-[500]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an area or address…"
            className="h-11 w-full rounded-2xl bg-white pl-10 pr-10 text-sm shadow-card outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searching && <Spinner className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2" />}
        </div>
        {results.length > 0 && (
          <ul className="mt-1.5 max-h-56 overflow-y-auto rounded-2xl bg-white p-1 shadow-lift">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    if (r.lat && r.lng) mapRef.current?.flyTo([r.lat, r.lng], 17, { duration: 0.7 });
                    setResults([]);
                    setQuery("");
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-stone-100"
                >
                  <div className="font-semibold">{r.area ?? r.street ?? r.city}</div>
                  <div className="line-clamp-1 text-xs text-stone-500">{r.displayName}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={locate}
        className="absolute bottom-3 left-3 z-[500] flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-blue-700 shadow-lift active:scale-95"
      >
        {locating ? <Spinner className="size-4 text-blue-600" /> : <LocateFixed className="size-4" />}
        Use my location
      </button>

      {locError && (
        <div className="absolute inset-x-3 bottom-16 z-[500] rounded-2xl bg-ink/90 px-3 py-2 text-xs text-white">{locError}</div>
      )}
    </div>
  );
}
