"use client";

import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "./ErrorBoundary";

interface MapViewProps {
  listings: Array<{
    id: string;
    title: string;
    lat: number | null;
    lng: number | null;
    roomType?: string;
    numericId?: number;
    price?: number;
    location?: string;
  }>;
}

// Default center: Sri Lanka
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 7;

function MapViewContent({ listings }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure we're on client before loading Google Maps
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "dummy-key",
    libraries: ["places"],
  });

  // Filter listings with valid coordinates and calculate bounds
  const validListings = useMemo(() => {
    if (!Array.isArray(listings)) return [];
    return listings
      .filter((listing) => 
        listing && 
        typeof listing.lat === "number" && 
        typeof listing.lng === "number" &&
        !isNaN(listing.lat) &&
        !isNaN(listing.lng)
      )
      .map((listing) => ({
        id: listing?.id || "",
        title: listing?.title || "Untitled",
        lat: listing.lat!,
        lng: listing.lng!,
        roomType: listing?.roomType,
        numericId: listing?.numericId,
        price: typeof listing?.price === "number" ? listing.price : undefined,
        location: listing?.location,
      }));
  }, [listings]);

  // Calculate map center and zoom to fit all markers
  const mapCenter = useMemo(() => {
    if (!validListings || validListings.length === 0) {
      return DEFAULT_CENTER;
    }
    if (validListings.length === 1) {
      const listing = validListings[0];
      if (listing && typeof listing.lat === "number" && typeof listing.lng === "number") {
        return { lat: listing.lat, lng: listing.lng };
      }
      return DEFAULT_CENTER;
    }
    // Calculate center of all markers
    const valid = validListings.filter(l => l && typeof l.lat === "number" && typeof l.lng === "number");
    if (valid.length === 0) return DEFAULT_CENTER;
    const avgLat = valid.reduce((sum, l) => sum + (l.lat || 0), 0) / valid.length;
    const avgLng = valid.reduce((sum, l) => sum + (l.lng || 0), 0) / valid.length;
    return { lat: avgLat, lng: avgLng };
  }, [validListings]);

  const mapZoom = useMemo(() => {
    if (validListings.length === 0) return DEFAULT_ZOOM;
    if (validListings.length === 1) return 15;
    // If multiple markers, use a zoom level that shows all of them
    return 8;
  }, [validListings]);

  const selectedListingData = useMemo(() => {
    if (!selectedListing || !validListings || validListings.length === 0) return null;
    const found = validListings.find((l) => l && l.id === selectedListing);
    return found || null;
  }, [selectedListing, validListings]);

  if (!apiKey) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-red-50 text-center text-sm text-red-600">
        Google Maps API key not configured.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-red-50 text-center text-sm text-red-600">
        Error loading map. Please check your Google Maps API key.
      </div>
    );
  }

  if (!isClient || !isLoaded) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  if (!validListings || validListings.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        No boardings with location data available.
      </div>
    );
  }

  // Safety check for Google Maps API
  if (typeof window === "undefined" || !window.google) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner" style={{ aspectRatio: "1 / 1" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {validListings.map((listing) => {
          if (!listing || !listing.id || typeof listing.lat !== "number" || typeof listing.lng !== "number") {
            return null;
          }
          return (
            <Marker
              key={listing.id}
              position={{ lat: listing.lat, lng: listing.lng }}
              onClick={() => {
                try {
                  setSelectedListing(listing.id);
                } catch (err) {
                  console.error("Error setting selected listing:", err);
                }
              }}
            />
          );
        })}
        {selectedListingData && selectedListingData.lat && selectedListingData.lng && (
          <InfoWindow
            position={{ lat: selectedListingData.lat, lng: selectedListingData.lng }}
            onCloseClick={() => {
              try {
                setSelectedListing(null);
              } catch (err) {
                console.error("Error closing info window:", err);
              }
            }}
          >
            <div className="p-0 min-w-[280px] max-w-[320px]">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Header with status badge */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-slate-900 leading-tight flex-1 line-clamp-2">
                      {selectedListingData.title || "Untitled"}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 whitespace-nowrap flex-shrink-0">
                      Active
                    </span>
                  </div>
                  
                  {/* Price - prominent */}
                  {selectedListingData.price && typeof selectedListingData.price === "number" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-[#1F2937]">
                        Rs. {selectedListingData.price.toLocaleString("en-LK")}
                      </span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">Price not available</div>
                  )}
                </div>

                {/* Meta information */}
                <div className="px-4 py-3 space-y-2">
                  {selectedListingData.roomType && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide min-w-[70px]">Type</span>
                      <span className="text-sm text-slate-700 font-medium">{selectedListingData.roomType}</span>
                    </div>
                  )}
                  
                  {selectedListingData.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide min-w-[70px]">Location</span>
                      <span className="text-sm text-slate-700">{selectedListingData.location}</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {selectedListingData.numericId && typeof selectedListingData.numericId === "number" && !isNaN(selectedListingData.numericId) && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        try {
                          e.stopPropagation();
                          e.preventDefault();
                          if (selectedListingData.numericId && typeof selectedListingData.numericId === "number") {
                            router.push(`/boardings/${selectedListingData.numericId}`);
                          }
                        } catch (err) {
                          console.error("Error navigating to listing:", err);
                        }
                      }}
                      className="w-full rounded-lg bg-[#1F2937] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#111827] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#1F2937] focus:ring-offset-2"
                    >
                      View Details →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default function MapView({ listings }: MapViewProps) {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  // Delay map loading by 500ms to prevent blocking initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadMap(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoadMap) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
          Map temporarily unavailable. Please refresh the page.
        </div>
      }
    >
      <MapViewContent listings={listings || []} />
    </ErrorBoundary>
  );
}
