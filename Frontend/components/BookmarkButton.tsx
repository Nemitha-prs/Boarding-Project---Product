"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { fetchUserBookmarks, toggleBookmark } from "@/utils/bookmarks";
import { isAuthenticated } from "@/lib/auth";

interface BookmarkButtonProps {
  listingId: string; // Original DB listing ID (string)
  className?: string;
}

export default function BookmarkButton({ listingId, className }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check authentication status and listen for changes
  useEffect(() => {
    const checkAuth = () => {
      setAuthenticated(isAuthenticated());
    };
    
    checkAuth();
    
    // Listen for authentication token changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        checkAuth();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also check on focus in case token changed in same tab
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fetch bookmark status when component mounts or listingId changes
  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }

    async function checkBookmarkStatus() {
      try {
        const bookmarkedIds = await fetchUserBookmarks();
        setBookmarked(bookmarkedIds.includes(listingId));
      } catch (error) {
        console.error("Failed to fetch bookmark status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkBookmarkStatus();
  }, [listingId, authenticated]);

  const onToggle = async () => {
    if (!authenticated || loading) return;
    
    setLoading(true);
    try {
      const newState = await toggleBookmark(listingId, bookmarked);
      setBookmarked(newState);
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      // Optionally show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  // Don't render bookmark button if user is not authenticated
  if (!authenticated) {
    return null;
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      aria-pressed={bookmarked}
      className={
        "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed " +
        (className ?? "")
      }
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-brand-accent" />
      ) : (
        <Bookmark className="h-4 w-4 text-slate-600" />
      )}
      {loading ? "Loading..." : bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
