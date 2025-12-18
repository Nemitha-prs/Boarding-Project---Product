"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const SingleBoardingMap = dynamic(() => import("@/components/SingleBoardingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Loading map...
    </div>
  ),
});
import Gallery from "@/components/Gallery";
import BookmarkButton from "@/components/BookmarkButton";
import { incrementView } from "@/utils/views";
import { incrementPendingApprovals } from "@/utils/pendingApprovals";
import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/auth";
import type { BoardingListing } from "@/lib/fakeData";
import { stringIdToNumeric } from "@/utils/idConverter";
import { getReferenceCoordinate, getReferenceName, haversineKm } from "@/utils/distance";

interface BoardingDetailsPageProps {
  params: {
    id: string;
  };
}

interface DbListing {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  boardingType: string;
  district: string;
  colomboArea: string | null;
  lat: number | null;
  lng: number | null;
  beds: number | null;
  bathrooms: number;
  facilities: string[];
  images: string[];
  status: "Active" | "Not-active";
  pendingApprovals?: number;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
}

// Convert DB listing to BoardingListing format (same as boardings page)
function convertDbListingToBoarding(db: DbListing): BoardingListing {
  const coverImage = db.images && db.images.length > 0 ? db.images[0] : "/images/board1.jpg";
  const location = db.colomboArea || db.district;
  
  // Convert string ID to number using the shared utility function
  const numericId = stringIdToNumeric(db.id);
  
  return {
    id: numericId,
    title: db.title,
    description: db.description,
    price: `Rs. ${db.price.toLocaleString("en-LK")}`,
    image: coverImage,
    location: location,
    district: db.district,
    areaCode: db.colomboArea,
    roomType: db.boardingType,
    distance: "—",
    rating: 0,
    facilities: db.facilities,
    availableBeds: db.beds || undefined,
  };
}

export default function BoardingDetailsPage({ params }: BoardingDetailsPageProps) {
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<BoardingListing | null>(null);
  const [dbListing, setDbListing] = useState<DbListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastViewedId = useRef<string | null>(null);

  // Get location selection from URL params
  const selectedUniversity = searchParams.get("university");
  const selectedDistrict = searchParams.get("district");
  const selectedCity = searchParams.get("city");

  // Calculate distance and location name
  const distanceInfo = useMemo(() => {
    if (!dbListing || dbListing.lat === null || dbListing.lng === null) {
      return { distance: null, locationName: null };
    }

    const reference = getReferenceCoordinate(selectedUniversity, selectedDistrict, selectedCity);
    if (!reference) {
      return { distance: null, locationName: null };
    }

    const listingCoord = { lat: dbListing.lat, lng: dbListing.lng };
    const distanceKm = haversineKm(reference, listingCoord);
    const locationName = getReferenceName(selectedUniversity, selectedDistrict, selectedCity);

    const distanceText = distanceKm < 1
      ? `${(distanceKm * 1000).toFixed(0)} m`
      : `${distanceKm.toFixed(1)} km`;

    return { distance: distanceText, locationName };
  }, [dbListing, selectedUniversity, selectedDistrict, selectedCity]);

  useEffect(() => {
    async function fetchListing() {
      setLoading(true);
      setError("");
      try {
        
        // Parse the numeric ID from URL
        const numericId = parseInt(params.id, 10);
        if (isNaN(numericId)) {
          setError("Invalid listing ID");
          setListing(null);
          setDbListing(null);
          setLoading(false);
          return;
        }
        
        // Fetch the specific listing by numeric ID (single request)
        const response = await fetch(getApiUrl(`/listings/by-numeric-id/${numericId}`));
        if (!response.ok) {
          if (response.status === 404) {
            setError("Listing not found");
          } else {
            setError("Failed to load listing");
          }
          setListing(null);
          setDbListing(null);
          setLoading(false);
          return;
        }
        
        const listingWithOwner: DbListing = await response.json();
        
        // Verify the listing is Active
        if (listingWithOwner.status !== "Active") {
          setError("Listing not found");
          setListing(null);
          setDbListing(null);
          setLoading(false);
          return;
        }
        
        const convertedListing = convertDbListingToBoarding(listingWithOwner);
        
        setDbListing(listingWithOwner);
        setListing(convertedListing);
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message || "Failed to load listing");
        setListing(null);
        setDbListing(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchListing();
  }, [params.id]);

  // Increment view count when the listing page is opened (once per page load)
  useEffect(() => {
    // Only increment if this is a new page load (params.id changed) and listing is loaded
    if (listing && params.id && lastViewedId.current !== params.id) {
      incrementView(listing.id);
      lastViewedId.current = params.id;
    }
  }, [listing, params.id]);

  // Use all images from the database listing, or repeat the first image if only one
  const galleryImages = dbListing && dbListing.images && dbListing.images.length > 0
    ? dbListing.images.length >= 3
      ? dbListing.images.slice(0, 3)
      : [...dbListing.images, ...Array(3 - dbListing.images.length).fill(dbListing.images[0])]
    : listing?.image
    ? [listing.image, listing.image, listing.image]
    : [];

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {!listing && error ? (
            <div className="mx-auto max-w-3xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Not found</p>
              <h2 className="text-2xl font-semibold text-slate-900">We could not find that boarding.</h2>
              <Link
                href="/boardings"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
              >
                Back to listings
              </Link>
            </div>
          ) : !listing && loading ? (
            <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="border-b border-gray-100 bg-white/80 px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="grid gap-6 border-t border-gray-100 bg-white/90 p-6 md:grid-cols-[3fr,2fr] md:p-8">
                <div className="space-y-5">
                  <div className="aspect-video bg-slate-200 rounded-2xl animate-pulse" />
                  <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
                </div>
              </div>
            </article>
          ) : listing ? (
            <>
              <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="border-b border-gray-100 bg-white/80 px-6 py-6 sm:px-8 sm:py-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Listing #{listing.id}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[#1F2937] sm:text-3xl">
                        {listing.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {listing.roomType}
                        {distanceInfo.distance && distanceInfo.locationName && (
                          <> · {distanceInfo.distance} to {distanceInfo.locationName}</>
                        )}
                      </p>
                    </div>
                    {dbListing && <BookmarkButton listingId={dbListing.id} />}
                  </div>
                </div>

                <div className="grid gap-6 border-t border-gray-100 bg-white/90 p-6 md:grid-cols-[3fr,2fr] md:p-8">
              <div className="space-y-5">
                <Gallery images={galleryImages} title={listing.title} />

                <section className="rounded-2xl border border-gray-100 bg-slate-50/80 p-5">
                  <h3 className="text-base font-semibold text-slate-900">Facilities</h3>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {listing.facilities.map((facility) => (
                      <li
                        key={facility}
                        className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
                      >
                        <span className="h-2 w-2 rounded-full bg-brand-accent" />
                        {facility}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="space-y-4">
                <section className="rounded-2xl border border-gray-100 bg-slate-50/80 p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Monthly
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-slate-900 sm:text-4xl">
                        {listing.price}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 sm:text-sm">Utilities included</p>
                  </div>
                  {listing.roomType === "Shared Room" && typeof listing.availableBeds === "number" && (
                    <p className="mt-2 text-xs font-medium text-brand-primary">Available beds: {listing.availableBeds}</p>
                  )}
                  <p className="mt-4 text-sm text-slate-600">{listing.description}</p>
                  {dbListing?.owner?.phone ? (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        
                        // Increment pending approvals when contact button is clicked (atomic operation)
                        if (dbListing?.id) {
                          try {
                            const newCount = await incrementPendingApprovals(dbListing.id);
                            console.log("Pending approvals incremented to:", newCount);
                            // Update local state with new count from API response
                            if (dbListing && typeof newCount === 'number') {
                              setDbListing({ ...dbListing, pendingApprovals: newCount });
                            }
                          } catch (error) {
                            console.error("Failed to increment pending approvals:", error);
                            // Continue with phone call even if increment fails
                          }
                        }
                        
                        // Open phone dialer after increment completes
                        window.location.href = `tel:${dbListing.owner?.phone || ''}`;
                      }}
                      className="mt-6 block w-full rounded-full bg-brand-accent px-6 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      Contact owner
                    </button>
                  ) : (
                    <button
                      disabled
                      className="mt-6 w-full rounded-full bg-slate-300 px-6 py-3 text-sm font-semibold text-slate-500 shadow-lg cursor-not-allowed"
                    >
                      Contact info unavailable
                    </button>
                  )}
                </section>

                {dbListing && dbListing.lat !== null && dbListing.lng !== null && (
                  <section className="rounded-2xl border border-dashed border-brand-accent/30 bg-white p-4">
                    <SingleBoardingMap
                      lat={dbListing.lat}
                      lng={dbListing.lng}
                      title={listing.title}
                    />
                  </section>
                )}
              </div>
            </div>
            </article>
            <div className="mt-6 text-center">
              <Link
                href="/boardings"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
              >
                Back to listings
              </Link>
            </div>
          </>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
