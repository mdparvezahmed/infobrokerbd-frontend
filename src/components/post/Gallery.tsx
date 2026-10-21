"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PostImage } from "@/lib/types";

/** Swipeable photo strip on phones, grid on desktop, with a full-screen viewer. */
export function Gallery({ images, title }: { images: PostImage[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (!images.length) return null;

  return (
    <>
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setOpen(i)}
            className={`relative shrink-0 snap-center overflow-hidden rounded-2xl bg-stone-200 ${
              images.length === 1 ? "w-full sm:col-span-3" : "w-[85%] sm:w-auto"
            } ${i === 0 && images.length > 2 ? "sm:col-span-2 sm:row-span-2" : ""}`}
            style={{ aspectRatio: images.length === 1 ? `${img.width} / ${img.height}` : "4 / 3" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={i === 0 ? img.url : img.thumbUrl}
              alt={`${title} — photo ${i + 1}`}
              className="size-full max-h-[70vh] object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/95" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[open].url} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Close">
            <X className="size-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open - 1 + images.length) % images.length);
                }}
                className="absolute left-3 rounded-full bg-white/10 p-2 text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="size-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open + 1) % images.length);
                }}
                className="absolute right-3 rounded-full bg-white/10 p-2 text-white"
                aria-label="Next"
              >
                <ChevronRight className="size-7" />
              </button>
              <div className="absolute bottom-6 text-sm font-semibold text-white/80">
                {open + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
