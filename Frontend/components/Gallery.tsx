"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export default function Gallery({ images, title, className }: GalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const close = () => setOpen(false);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <div className={"grid grid-cols-1 gap-3 sm:grid-cols-3 " + (className ?? "") }>
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            onClick={() => openAt(i)}
            className="group relative h-40 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-44"
            aria-label={`Open image ${i + 1}`}
          >
            <Image
              src={src}
              alt={`${title} photo ${i + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={i === 0}
            />
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={close}
              aria-label="Close"
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <X className="h-5 w-5 text-slate-800" />
            </button>

            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6 text-slate-800" />
            </button>

            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronRight className="h-6 w-6 text-slate-800" />
            </button>

            <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl bg-black">
              <Image
                src={images[index]}
                alt={`${title} large image ${index + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <p className="mt-3 text-center text-xs text-white/80">{index + 1} / {images.length}</p>
          </div>
        </div>
      )}
    </>
  );
}
