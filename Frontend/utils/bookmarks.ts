"use client";

import { fetchWithAuth, isAuthenticated } from "@/lib/auth";

/**
 * Fetch user's bookmarks from backend API
 * Returns array of listing IDs (strings) that the user has bookmarked
 */
export async function fetchUserBookmarks(): Promise<string[]> {
  if (!isAuthenticated()) {
    return [];
  }
  
  try {
    const data = await fetchWithAuth<{ listingIds: string[] }>("/bookmarks");
    return data.listingIds || [];
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return [];
  }
}

/**
 * Check if a listing is bookmarked (using backend API)
 * Returns true if the listing ID is in the user's bookmarks
 */
export function isBookmarked(bookmarkedIds: string[], listingId: string): boolean {
  return bookmarkedIds.includes(listingId);
}

/**
 * Toggle bookmark status for a listing (using backend API)
 * Returns the new bookmark state (true if bookmarked, false if removed)
 */
export async function toggleBookmark(listingId: string, currentlyBookmarked: boolean): Promise<boolean> {
  if (!isAuthenticated()) {
    throw new Error("User must be authenticated to bookmark");
  }
  
  try {
    if (currentlyBookmarked) {
      // Remove bookmark
      await fetchWithAuth(`/bookmarks/${listingId}`, {
        method: "DELETE",
      });
      return false;
    } else {
      // Add bookmark
      await fetchWithAuth(`/bookmarks/${listingId}`, {
        method: "POST",
      });
      return true;
    }
  } catch (error) {
    console.error("Failed to toggle bookmark:", error);
    throw error;
  }
}

// Legacy functions for backward compatibility (deprecated - use fetchUserBookmarks instead)
export function getBookmarks(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("bookmarks");
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}
