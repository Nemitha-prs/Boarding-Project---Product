"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookmarkCheck, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { getViews } from "@/utils/views";
import StarRating from "@/components/StarRating";
import type { BoardingListing } from "@/lib/fakeData";

type ListingCardProps = BoardingListing & { 
  bookmarked?: boolean;
  reviewCount?: number;
};

export default function ListingCard({ id, image, title, description, price, location, roomType, bookmarked, availableBeds, rating, reviewCount }: ListingCardProps) {
  const [views, setViews] = useState<number>(0);

  useEffect(() => {
    setViews(getViews(id));
    const onStorage = (e: StorageEvent) => {
      if (e.key === "listingViews") {
        setViews(getViews(id));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);
  return (
    <Link href={`/boardings/${id}`} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl">
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {bookmarked && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800 shadow">
              <BookmarkCheck className="h-3 w-3 text-brand-accent" />
              Bookmarked
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">{location}</p>

          <h3 className="mt-2 text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-brand-accent transition-colors">
            {title}
          </h3>

          {/* Rating Display */}
          {rating !== undefined && rating > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={rating} size="sm" showNumber />
              {reviewCount !== undefined && reviewCount > 0 && (
                <span className="text-xs text-slate-500">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              )}
            </div>
          )}

          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{description}</p>
          {roomType === "Shared Room" && typeof availableBeds === "number" && (
            <p className="mt-2 text-xs font-medium text-brand-primary">Available beds: {availableBeds}</p>
          )}

          <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-500">Monthly rent</p>
              <p className="text-xl font-bold text-brand-primary">{price}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                <Eye className="h-3 w-3" /> {views}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-background text-brand-primary transition-colors group-hover:bg-brand-accent group-hover:text-white">
                <ArrowRight size={16} />
              </div>
            </div>
            <span className="inline-flex sm:hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
              <Eye className="h-3 w-3" /> {views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
