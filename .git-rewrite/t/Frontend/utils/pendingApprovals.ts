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
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to increment pending approvals:", response.status, errorData);
      throw new Error(errorData.error || "Failed to increment pending approvals");
    }
    const data = await response.json();
    const newCount = data.pendingApprovals || 0;
    console.log(`Successfully incremented pending approvals for listing ${listingId}: ${newCount}`);
    return newCount;
  } catch (error: any) {
    console.error("Error incrementing pending approvals:", error);
    // Re-throw error so caller can handle it
    throw error;
  }
}

/**
 * Get pending approvals count for a specific listing from the listing data
 * This is a helper function that extracts pendingApprovals from listing data
 */
export function getPendingApprovalsForListing(listing: { pendingApprovals?: number }): number {
  return listing.pendingApprovals ?? 0;
}

