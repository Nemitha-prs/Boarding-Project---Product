"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { isBookmarked, toggleBookmark } from "@/utils/bookmarks";

interface BookmarkButtonProps {
  listingId: number;
  className?: string;
}

export default function BookmarkButton({ listingId, className }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(listingId));
  }, [listingId]);

  const onToggle = () => {
    const state = toggleBookmark(listingId);
    setBookmarked(state);
  };

  return (
    <button
      onClick={onToggle}
      aria-pressed={bookmarked}
      className={
        "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 " +
        (className ?? "")
      }
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-brand-accent" />
      ) : (
        <Bookmark className="h-4 w-4 text-slate-600" />
      )}
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
