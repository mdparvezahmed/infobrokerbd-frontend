"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "./api";

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

const LAST_LOCATION_KEY = "ibb:lastLocation";

export function readLastLocation(): Coords | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    return raw ? (JSON.parse(raw) as Coords) : null;
  } catch {
    return null;
  }
}

/** Browser geolocation with friendly error messages. Remembers the last fix for the session. */
export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(
    () =>
      new Promise<Coords | null>((resolve) => {
        if (!("geolocation" in navigator)) {
          setStatus("error");
          setError("Your browser doesn't support location");
          return resolve(null);
        }
        setStatus("locating");
        setError(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
            setCoords(c);
            setStatus("ready");
            try {
              localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(c));
            } catch {}
            resolve(c);
          },
          (err) => {
            setStatus("error");
            setError(
              err.code === err.PERMISSION_DENIED
                ? "Location permission denied — allow it in your browser settings, or pick the spot on the map"
                : "Couldn't get your location — try again or pick the spot on the map",
            );
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
        );
      }),
    [],
  );

  return { coords, status, error, locate, setCoords };
}

/** Cursor-paginated list with "load more" and an IntersectionObserver sentinel. */
export function useInfiniteList<T, C = string | number>(
  fetchPage: (cursor: C | null) => Promise<{ items: T[]; nextCursor: C | null }>,
  deps: unknown[],
  initial?: { items: T[]; nextCursor: C | null },
) {
  const [items, setItems] = useState<T[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState<C | null>(initial?.nextCursor ?? null);
  const [done, setDone] = useState(initial ? initial.nextCursor === null : false);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);
  const skipFirst = useRef(!!initial);
  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const load = useCallback(async (reset: boolean, from: C | null) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRef.current(from);
      if (id !== reqId.current) return;
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      setCursor(page.nextCursor);
      setDone(page.nextCursor === null);
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setItems([]);
    setDone(false);
    void load(true, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(() => {
    if (!loading && !done) void load(false, cursor);
  }, [loading, done, cursor, load]);

  // Callback ref (not a ref object) so the returned value is plain data for the React Compiler.
  const [sentinel, observe] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel;
    if (!el || done) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: "600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, done, sentinel]);

  return { items, setItems, loading, error, done, loadMore, observe, reload: () => load(true, null) };
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

let categoriesPromise: Promise<import("./types").Category[]> | null = null;
/** Categories rarely change — fetch once per page load and share. */
export function useCategories() {
  const [categories, setCategories] = useState<import("./types").Category[]>([]);
  useEffect(() => {
    categoriesPromise ??= api<{ categories: import("./types").Category[] }>("/categories").then((r) => r.categories);
    categoriesPromise.then(setCategories).catch(() => {
      categoriesPromise = null;
    });
  }, []);
  return categories;
}

const noopSubscribe = () => () => {};
/** False on the server and during hydration, true afterwards — for UI that must match the server HTML first. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
