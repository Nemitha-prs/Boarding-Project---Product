// Pending approvals tracking per listing
// Now stored in database, fetched from backend

import { getApiUrl } from "@/lib/auth";

/**
 * Increment pending approvals count for a specific listing via backend API
 * This is called when someone clicks "Contact owner"
 */
export async function incrementPendingApprovals(listingId: string): Promise<number> {
  try {
    const response = await fetch(getApiUrl(`/listings/${listingId}/increment-pending-approvals`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to increment pending approvals");
    }
    const data = await response.json();
    return data.pendingApprovals || 0;
  } catch (error) {
    console.error("Error incrementing pending approvals:", error);
    return 0;
  }
}

/**
 * Get pending approvals count for a specific listing from the listing data
 * This is a helper function that extracts pendingApprovals from listing data
 */
export function getPendingApprovalsForListing(listing: { pendingApprovals?: number }): number {
  return listing.pendingApprovals ?? 0;
}

