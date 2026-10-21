"use client";

import { ArrowLeft, ArrowRight, Camera, Check, ImagePlus, Info, MapPin, Star, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { PickedLocation } from "@/components/map/LocationPicker";
import { toast } from "@/components/Toaster";
import { Button, cn, Field, Input, Spinner, Textarea } from "@/components/ui";
import { api, ApiError, upload } from "@/lib/api";
import { KIND_ORDER, KINDS, RATED_KINDS } from "@/lib/format";
import { readLastLocation, useCategories } from "@/lib/hooks";
import { compressImage } from "@/lib/image";
import type { GeoResult, PostKind } from "@/lib/types";
import { DEFAULT_CENTER } from "@/components/map/constants";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center rounded-3xl bg-stone-100">
      <Spinner />
    </div>
  ),
});

const MAX_PHOTOS = 6;
// Hosting limits a request to 4.5 MB, so photos are shrunk until the whole post fits.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const STEPS = ["Location", "Details", "Photos"] as const;

interface Photo {
  id: string;
  file: File;
  preview: string;
}

export function NewPostWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const categories = useCategories();

  const [step, setStep] = useState(0);

  // Step 1 — location
  const initialLoc = (() => {
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    if (lat && lng) return { lat, lng, fromUrl: true };
    const last = typeof window !== "undefined" ? readLastLocation() : null;
    return last ? { lat: last.lat, lng: last.lng, fromUrl: false } : { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1], fromUrl: false };
  })();
  const [location, setLocation] = useState<PickedLocation>({ lat: initialLoc.lat, lng: initialLoc.lng });
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Step 2 — details
  const [kind, setKind] = useState<PostKind>("REVIEW");
  const [category, setCategory] = useState<string | null>(params.get("category"));
  const [title, setTitle] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const touchedPlace = useRef({ area: false, city: false, address: false });

  // Step 3 — photos & identity
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reverse-geocode the pin (debounced) to pre-fill area / city / address.
  useEffect(() => {
    const t = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const r = await api<GeoResult>("/geo/reverse", { query: { lat: location.lat.toFixed(5), lng: location.lng.toFixed(5) } });
        setGeo(r);
        if (!touchedPlace.current.area) setArea(r.area ?? "");
        if (!touchedPlace.current.city) setCity(r.city ?? "");
        if (!touchedPlace.current.address) setAddress(r.street ?? "");
      } catch {
        setGeo(null);
      } finally {
        setGeoLoading(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [location.lat, location.lng]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const rated = RATED_KINDS.has(kind);

  function validateDetails() {
    const e: Record<string, string> = {};
    if (!category) e.category = "Choose a category";
    if (title.trim().length < 5) e.title = "Write a short title (at least 5 characters)";
    if (body.trim().length < 10) e.body = "Tell people a bit more (at least 10 characters)";
    if (phone.trim() && !/^[+\d][\d\s\-()]{4,}$/.test(phone.trim())) e.phone = "Enter a valid phone number";
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  const next = () => {
    if (step === 1 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    if (files.length > room) toast.error(`You can add up to ${MAX_PHOTOS} photos`);
    setPhotos((p) => [...p, ...picked]);
  }

  async function submit() {
    if (!validateDetails()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setProgress(0);
    try {
      const form = new FormData();
      form.append(
        "data",
        JSON.stringify({
          kind,
          category,
          title: title.trim(),
          body: body.trim(),
          rating: rated && rating ? rating : null,
          placeName: placeName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          area: area.trim() || null,
          city: city.trim() || null,
          lat: location.lat,
          lng: location.lng,
          authorName: user ? null : authorName.trim() || null,
        }),
      );
      let blobs = await Promise.all(photos.map((p) => compressImage(p.file)));
      const total = () => blobs.reduce((n, b) => n + b.size, 0);
      if (total() > MAX_UPLOAD_BYTES) blobs = await Promise.all(photos.map((p) => compressImage(p.file, 1280, 0.72)));
      if (total() > MAX_UPLOAD_BYTES) blobs = await Promise.all(photos.map((p) => compressImage(p.file, 1024, 0.65)));
      if (total() > MAX_UPLOAD_BYTES) {
        toast.error("Your photos are too large together — remove one or two and try again");
        setSubmitting(false);
        return;
      }
      blobs.forEach((blob, i) =>
        form.append("images", blob, photos[i].file.name.replace(/\.\w+$/, "") + (blob.type === "image/jpeg" ? ".jpg" : "")),
      );
      const res = await upload<{ id: number }>("/posts", form, setProgress);
      toast.success(user ? "Posted! You earned 10 points 🎉" : "Posted — thank you for sharing! 🙌");
      router.push(`/p/${res.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't publish — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col px-4 pb-28 pt-4">
      {/* Progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <h1 className="text-xl font-extrabold tracking-tight">Share a finding</h1>
          <span className="font-semibold text-stone-500">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-brand-600" : "bg-stone-200")} />
              <div className={cn("mt-1.5 text-xs font-semibold", i === step ? "text-brand-700" : "text-stone-400")}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Location ── */}
      {step === 0 && (
        <section className="flex flex-1 animate-fade-up flex-col">
          <p className="mb-3 text-sm text-stone-600">
            <span className="font-semibold text-ink">Where is it?</span> Move the map so the red pin sits on the shop, house or place.
          </p>
          <div className="h-[55dvh] min-h-80">
            <LocationPicker value={location} onChange={setLocation} autoLocate={!initialLoc.fromUrl} />
          </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-white p-3.5 shadow-card">
            <MapPin className="mt-0.5 size-5 shrink-0 text-accent-500" />
            <div className="min-w-0 text-sm">
              {geoLoading ? (
                <span className="text-stone-400">Finding address…</span>
              ) : geo?.displayName ? (
                <>
                  <div className="font-semibold">{[geo.area, geo.city].filter(Boolean).join(", ") || "Selected spot"}</div>
                  <div className="line-clamp-2 text-xs text-stone-500">{geo.displayName}</div>
                </>
              ) : (
                <span className="text-stone-500">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Step 2: Details ── */}
      {step === 1 && (
        <section className="animate-fade-up space-y-6">
          <div>
            <div className="mb-2 text-sm font-semibold">What are you sharing?</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {KIND_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-2xl p-3 text-left ring-1 transition active:scale-[0.98]",
                    kind === k ? "bg-brand-50 ring-2 ring-brand-500" : "bg-white ring-black/10 hover:bg-stone-50",
                  )}
                >
                  <div className="text-xl">{KINDS[k].emoji}</div>
                  <div className="mt-1 text-sm font-bold">
                    {KINDS[k].label} <span className="bn font-medium text-stone-400">· {KINDS[k].labelBn}</span>
                  </div>
                  <div className="mt-0.5 text-xs leading-snug text-stone-500">{KINDS[k].hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div id="f-category">
            <div className="mb-2 text-sm font-semibold">Category</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm font-semibold ring-1 transition active:scale-95",
                    category === c.slug ? "text-white ring-transparent" : "bg-white text-stone-700 ring-black/10",
                  )}
                  style={category === c.slug ? { background: c.color } : undefined}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
            {errors.category && <p className="mt-1.5 text-sm text-accent-600">{errors.category}</p>}
          </div>

          <div id="f-title">
            <Field label="Title" error={errors.title} hint="e.g. “Honest phone repair near Mirpur 10” or “মিরপুরে সেরা ইলেকট্রিশিয়ান”">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Short and clear" />
            </Field>
          </div>

          <Field label="Name of the shop, person or place" optional>
            <Input value={placeName} onChange={(e) => setPlaceName(e.target.value)} maxLength={160} placeholder="e.g. Smart Fix Mobile Care" />
          </Field>

          {rated && (
            <div>
              <div className="mb-2 text-sm font-semibold">
                Your rating <span className="text-xs font-normal text-stone-400">optional</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(rating === i ? 0 : i)}
                    className="rounded-xl p-1.5 transition active:scale-90"
                    aria-label={`${i} star${i > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "size-9 transition",
                        i <= rating ? "animate-pop fill-amber-400 text-amber-400" : "fill-stone-100 text-stone-300",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div id="f-body">
            <Field
              label="Your experience"
              error={errors.body}
              hint={`${body.trim().length}/5000 · What happened? Price? Would you go again? Bangla or English are both fine.`}
            >
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Share the details that would help the next person…"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div id="f-phone">
              <Field label="Phone number" optional error={errors.phone} hint="Only for businesses / service people">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={40} placeholder="01XXX-XXXXXX" />
              </Field>
            </div>
            <Field label="Address" optional>
              <Input
                value={address}
                onChange={(e) => {
                  touchedPlace.current.address = true;
                  setAddress(e.target.value);
                }}
                maxLength={300}
                placeholder="House, road, market…"
              />
            </Field>
            <Field label="Area" optional>
              <Input
                value={area}
                onChange={(e) => {
                  touchedPlace.current.area = true;
                  setArea(e.target.value);
                }}
                maxLength={120}
                placeholder="e.g. Mirpur 10"
              />
            </Field>
            <Field label="City / District" optional>
              <Input
                value={city}
                onChange={(e) => {
                  touchedPlace.current.city = true;
                  setCity(e.target.value);
                }}
                maxLength={80}
                placeholder="e.g. Dhaka"
              />
            </Field>
          </div>
        </section>
      )}

      {/* ── Step 3: Photos & publish ── */}
      {step === 2 && (
        <section className="animate-fade-up space-y-6">
          <div>
            <div className="mb-2 text-sm font-semibold">
              Photos <span className="text-xs font-normal text-stone-400">optional · up to {MAX_PHOTOS}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.preview);
                      setPhotos((ps) => ps.filter((x) => x.id !== p.id));
                    }}
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white"
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 text-brand-700 transition hover:bg-brand-50">
                    <ImagePlus className="size-7" />
                    <span className="text-xs font-semibold">Gallery</span>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 sm:hidden">
                    <Camera className="size-7" />
                    <span className="text-xs font-semibold">Camera</span>
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-stone-500">Location data inside photos is removed automatically.</p>
          </div>

          {!authLoading && !user && (
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
              <Field label="Show my name as" optional hint="Leave empty to post as “Anonymous”.">
                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={60} placeholder="Anonymous" />
              </Field>
              <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  <Link href="/login?next=/new" className="font-bold underline">
                    Log in
                  </Link>{" "}
                  or{" "}
                  <Link href="/register?next=/new" className="font-bold underline">
                    create an account
                  </Link>{" "}
                  to earn points, appear on the ranking and manage your posts.
                </span>
              </div>
            </div>
          )}

          {/* Review summary */}
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">Preview</div>
            <div className="text-xs font-semibold text-stone-500">
              {KINDS[kind].emoji} {KINDS[kind].label} · {categories.find((c) => c.slug === category)?.name}
            </div>
            <div className="mt-1 font-bold">{title || "Untitled"}</div>
            {rated && rating > 0 && <div className="mt-0.5 text-sm font-bold text-amber-600">{"★".repeat(rating)}</div>}
            <div className="mt-1 line-clamp-3 text-sm text-stone-600">{body}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="size-3.5 text-accent-500" /> {[area, city].filter(Boolean).join(", ") || "Pinned location"}
            </div>
          </div>

          <p className="text-xs text-stone-500">
            By posting you agree to our{" "}
            <Link href="/guidelines" className="font-semibold underline">
              community guidelines
            </Link>
            . Be honest and fair — posts can be reported and removed by admins.
          </p>
        </section>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-[900] border-t border-black/5 bg-white/95 pb-safe backdrop-blur">
        {submitting && (
          <div className="h-1 bg-brand-100">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
        <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
          <Button variant="outline" size="lg" onClick={back} disabled={submitting} className="shrink-0">
            <ArrowLeft className="size-5" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="lg" onClick={next} className="flex-1">
              {step === 0 ? "This is the spot" : "Next"} <ArrowRight className="size-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={submit} loading={submitting} className="flex-1">
              {!submitting && <Check className="size-5" />}
              {submitting ? (progress < 1 ? `Uploading ${Math.round(progress * 100)}%` : "Publishing…") : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
