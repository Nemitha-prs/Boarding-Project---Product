"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapView from "@/components/MapView";
import Link from "next/link";
import { getApiUrl } from "@/lib/auth";
import { stringIdToNumeric } from "@/utils/idConverter";

interface DbListing {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  lat: number | null;
  lng: number | null;
  boardingType?: string;
  district: string;
  colomboArea: string | null;
  status: "Active" | "Not-active";
}

export default function BoardingsMapPage() {
  const [listings, setListings] = useState<Array<{
    id: string;
    title: string;
    lat: number | null;
    lng: number | null;
    roomType?: string;
    numericId?: number;
    price?: string;
    location?: string;
    rating?: number;
    reviewCount?: number;
    description?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<Map<string, { rating: number; count: number }>>(new Map());

  useEffect(() => {
    async function fetchListingsForMap() {
      try {
        setLoading(true);
        setError("");
        
        // Fetch only active listings
        const response = await fetch(getApiUrl("/listings?status=Active"));
        if (!response.ok) {
          throw new Error("Failed to fetch listings for map");
        }
        
        const data: DbListing[] = await response.json();
        
        // Fetch ratings for all listings
        const listingIds = data.map(l => l.id);
        const ratingsMap = new Map<string, { rating: number; count: number }>();
        
        try {
          const reviewPromises = listingIds.map(async (listingId) => {
            try {
              const reviewsResponse = await fetch(getApiUrl(`/reviews/${listingId}`));
              if (reviewsResponse.ok) {
                const reviews = await reviewsResponse.json();
                if (Array.isArray(reviews) && reviews.length > 0) {
                  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
                  ratingsMap.set(listingId, { rating: avgRating, count: reviews.length });
                }
              }
            } catch (err) {
              // Silent fail
            }
          });
          await Promise.all(reviewPromises);
        } catch (err) {
          // Silent fail - ratings just won't show
        }
        
        setRatings(ratingsMap);
        
        // Transform data for MapView with numeric IDs for routing
        const mapListings = data.map((listing) => {
          const location = listing.colomboArea || listing.district;
          const ratingData = ratingsMap.get(listing.id);
          return {
            id: listing.id,
            title: listing.title,
            lat: listing.lat,
            lng: listing.lng,
            roomType: listing.boardingType,
            numericId: stringIdToNumeric(listing.id),
            price: `Rs. ${listing.price.toLocaleString("en-LK")}${listing.negotiable ? " (negotiable)" : ""}`,
            location: location,
            rating: ratingData?.rating,
            reviewCount: ratingData?.count,
            description: listing.description,
          };
        });
        setListings(mapListings);
      } catch (err: any) {
        console.error("Error fetching listings for map:", err);
        setError(err.message || "Failed to load listings for map");
      } finally {
        setLoading(false);
      }
    }
    
    fetchListingsForMap();
  }, []);

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <section className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
          <header className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Explore
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
                  Map of all boardings
                </h1>
              </div>
              <Link
                href="/boardings"
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-gray-300 bg-white/80 px-5 py-2 text-xs font-semibold text-[#1F2937] shadow-sm transition-transform transition-colors hover:scale-[1.02] hover:border-[#FF7A00] hover:text-[#FF7A00] sm:text-sm"
              >
                Back to list
              </Link>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              View all available boardings on a single map.
            </p>
          </header>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
            {loading ? (
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
                Loading boardings map...
              </div>
            ) : error ? (
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-red-50 text-center text-sm text-red-600">
                Error: {error}
              </div>
            ) : (
              <MapView listings={listings} />
            )}
          </div>

          <div className="sm:hidden">
            <Link
              href="/boardings"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#1F2937] shadow-sm transition-colors hover:border-[#FF7A00] hover:text-[#FF7A00]"
            >
              Back to list view
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
