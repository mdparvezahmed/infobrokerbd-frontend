"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ArrowLeft, ArrowRight, Layers, LocateFixed, MessageCircle, Plus, Search, ThumbsUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryChips } from "@/components/CategoryChips";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { KINDS, postHref } from "@/lib/format";
import { readLastLocation, useCategories, useDebounced } from "@/lib/hooks";
import type { MapCluster } from "@/lib/types";
import { addBaseLayer, clusterIcon, DEFAULT_CENTER, DEFAULT_ZOOM, meIcon, postIcon } from "./leaflet-utils";

type SelectedPost = NonNullable<MapCluster["post"]>;

/**
 * The information map: every post as a pin, grouped into clusters by the API when zoomed out.
 * Data is fetched for the visible viewport only, so it stays fast with any number of posts.
 */
export default function ExploreMap() {
  const router = useRouter();
  const params = useSearchParams();
  const categories = useCategories();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [category, setCategory] = useState<string | null>(params.get("category"));
  const [q, setQ] = useState(params.get("q") ?? "");
  const debouncedQ = useDebounced(q.trim(), 400);
  const [selected, setSelected] = useState<SelectedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtersRef = useRef({ category, q: debouncedQ });
  useEffect(() => {
    filtersRef.current = { category, q: debouncedQ };
  }, [category, debouncedQ]);

  const load = useCallback(async () => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    const b = map.getBounds();
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const data = await api<{ clusters: MapCluster[] }>("/map", {
        signal: ctrl.signal,
        query: {
          west: b.getWest().toFixed(5),
          south: b.getSouth().toFixed(5),
          east: b.getEast().toFixed(5),
          north: b.getNorth().toFixed(5),
          zoom: map.getZoom(),
          category: filtersRef.current.category,
          q: filtersRef.current.q,
        },
      });
      layer.clearLayers();
      let count = 0;
      for (const c of data.clusters) {
        count += c.count;
        if (c.post) {
          const p = c.post;
          L.marker([c.lat, c.lng], { icon: postIcon(p.category.icon, p.category.color), riseOnHover: true })
            .on("click", () => setSelected(p))
            .addTo(layer);
        } else {
          L.marker([c.lat, c.lng], { icon: clusterIcon(c.count) })
            .on("click", () => map.flyTo([c.lat, c.lng], Math.min(map.getZoom() + 2, 18), { duration: 0.6 }))
            .addTo(layer);
        }
      }
      setTotal(count);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMessage("Couldn't load the map data — check your connection");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    const last = readLastLocation();
    const center: [number, number] =
      lat && lng ? [lat, lng] : last ? [last.lat, last.lng] : DEFAULT_CENTER;
    const zoom = Number(params.get("z")) || (lat || last ? 14 : DEFAULT_ZOOM);

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView(center, zoom);
    addBaseLayer(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    let t: ReturnType<typeof setTimeout>;
    map.on("moveend", () => {
      clearTimeout(t);
      t = setTimeout(load, 200);
    });
    map.on("click", () => setSelected(null));
    void load();

    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change.
  useEffect(() => {
    if (mapRef.current) void load();
  }, [category, debouncedQ, load]);

  const locate = () => {
    if (!("geolocation" in navigator)) return setMessage("Your browser doesn't support location");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        try {
          localStorage.setItem("ibb:lastLocation", JSON.stringify({ lat: ll[0], lng: ll[1] }));
        } catch {}
        const map = mapRef.current;
        if (!map) return;
        meRef.current?.remove();
        meRef.current = L.marker(ll, { icon: meIcon(), interactive: false, zIndexOffset: 1000 }).addTo(map);
        map.flyTo(ll, 15, { duration: 0.8 });
      },
      () => {
        setLocating(false);
        setMessage("Location permission denied — enable it in your browser settings");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const postHere = () => {
    const c = mapRef.current?.getCenter();
    router.push(c ? `/new?lat=${c.lat.toFixed(6)}&lng=${c.lng.toFixed(6)}` : "/new");
  };

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div className="fixed inset-0 bottom-16 md:bottom-0">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Top overlay: back, search, categories */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-white/90 via-white/60 to-transparent px-3 pb-6 pt-3">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-2">
          <Link href="/" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-card" aria-label="Home">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the map…"
              className="h-12 w-full rounded-2xl bg-white pl-10 pr-10 text-[15px] shadow-card outline-none focus:ring-2 focus:ring-brand-500"
            />
            {loading ? (
              <Spinner className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2" />
            ) : q ? (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400" aria-label="Clear">
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-auto mx-auto mt-2 max-w-3xl">
          <CategoryChips categories={categories} value={category} onChange={setCategory} className="mx-0 px-0" />
        </div>
      </div>

      {/* Count pill */}
      {total !== null && (
        <div className="pointer-events-none absolute left-1/2 top-[132px] z-[500] -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Layers className="mr-1 inline size-3.5" />
          {total === 0 ? "No posts in this area" : `${total} ${total === 1 ? "post" : "posts"} here`}
        </div>
      )}

      {/* Floating actions */}
      <div className="absolute bottom-28 right-3 z-[500] flex flex-col gap-2 md:bottom-32">
        <button
          onClick={locate}
          className="grid size-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-lift active:scale-95"
          aria-label="Show my location"
        >
          {locating ? <Spinner className="text-blue-600" /> : <LocateFixed className="size-5" />}
        </button>
      </div>
      <button
        onClick={postHere}
        className="absolute bottom-4 left-1/2 z-[500] flex h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-5 text-sm font-bold text-white shadow-lift active:scale-95"
        style={{ display: selected ? "none" : undefined }}
      >
        <Plus className="size-5" /> <span className="sm:hidden">Post here</span>
        <span className="max-sm:hidden">Post at map center</span>
      </button>

      {message && (
        <div className="absolute inset-x-3 top-36 z-[600] mx-auto max-w-md animate-fade-up rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lift">
          {message}
        </div>
      )}

      {/* Selected post preview */}
      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-[600] mx-auto max-w-md animate-fade-up">
          <Link href={postHref(selected)} className="flex gap-3 rounded-3xl bg-white p-3 shadow-lift">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl">
              {selected.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.image} alt="" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-3xl" style={{ background: `${selected.category.color}22` }}>
                  {selected.category.icon}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-stone-500">
                {KINDS[selected.kind].emoji} {KINDS[selected.kind].label} · {selected.category.name}
              </div>
              <div className="line-clamp-2 font-bold leading-snug">{selected.title}</div>
              <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
                {selected.rating && <span className="font-bold text-amber-600">★ {selected.rating}.0</span>}
                {selected.area && <span className="truncate">{selected.area}</span>}
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-3" /> {selected.helpfulCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3" /> {selected.commentCount}
                </span>
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0 self-center text-stone-300" />
          </Link>
          <button
            onClick={() => setSelected(null)}
            className="absolute -top-3 right-3 grid size-8 place-items-center rounded-full bg-white shadow-card"
            aria-label="Close preview"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
