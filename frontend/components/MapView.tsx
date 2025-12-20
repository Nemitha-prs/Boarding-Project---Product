"use client";

import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface MapViewProps {
  listings: Array<{
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
  }>;
  showInfoWindow?: boolean; // Default true, set to false to disable popups
  containerClassName?: string; // Optional custom container class
}

// Default center: Sri Lanka
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 7;

export default function MapView({ listings, showInfoWindow = true, containerClassName }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const router = useRouter();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "dummy-key",
  });

  // Filter listings with valid coordinates and calculate bounds
  const validListings = useMemo(() => {
    return listings.filter((listing) => listing.lat !== null && listing.lng !== null) as Array<{
      id: string;
      title: string;
      lat: number;
      lng: number;
      roomType?: string;
      numericId?: number;
      price?: string;
      location?: string;
      rating?: number;
      reviewCount?: number;
      description?: string;
    }>;
  }, [listings]);

  // Calculate map center and zoom to fit all markers
  const mapCenter = useMemo(() => {
    if (validListings.length === 0) {
      return DEFAULT_CENTER;
    }
    if (validListings.length === 1) {
      return { lat: validListings[0].lat, lng: validListings[0].lng };
    }
    // Calculate center of all markers
    const avgLat = validListings.reduce((sum, l) => sum + l.lat, 0) / validListings.length;
    const avgLng = validListings.reduce((sum, l) => sum + l.lng, 0) / validListings.length;
    return { lat: avgLat, lng: avgLng };
  }, [validListings]);

  const mapZoom = useMemo(() => {
    if (validListings.length === 0) return DEFAULT_ZOOM;
    if (validListings.length === 1) return 15;
    // If multiple markers, use a zoom level that shows all of them
    return 8;
  }, [validListings]);

  const selectedListingData = useMemo(() => {
    return selectedListing ? validListings.find((l) => l.id === selectedListing) : null;
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

  if (!isLoaded) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  if (validListings.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        No boardings with location data available.
      </div>
    );
  }

  const defaultContainerClass = "relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner";
  const containerClass = containerClassName || defaultContainerClass;

  return (
    <div className={containerClass} style={{ aspectRatio: "1 / 1" }}>
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
        {validListings.map((listing) => (
          <Marker
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            onClick={() => showInfoWindow && setSelectedListing(listing.id)}
          />
        ))}
        {showInfoWindow && selectedListingData && (
          <InfoWindow
            position={{ lat: selectedListingData.lat, lng: selectedListingData.lng }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="p-0 min-w-[280px] max-w-[320px]">
              <div className="p-4 bg-white rounded-lg">
                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">{selectedListingData.title}</h3>
                
                {/* Location */}
                {selectedListingData.location && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-slate-600">{selectedListingData.location}</p>
                  </div>
                )}
                
                {/* Room Type */}
                {selectedListingData.roomType && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {selectedListingData.roomType}
                    </span>
                  </div>
                )}
                
                {/* Rating */}
                {selectedListingData.rating !== undefined && selectedListingData.rating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xs ${
                            star <= Math.round(selectedListingData.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {selectedListingData.rating.toFixed(1)}
                    </span>
                    {selectedListingData.reviewCount !== undefined && selectedListingData.reviewCount > 0 && (
                      <span className="text-xs text-slate-500">
                        ({selectedListingData.reviewCount} {selectedListingData.reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    )}
                  </div>
                )}
                
                {/* Description */}
                {selectedListingData.description && (
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">{selectedListingData.description}</p>
                )}
                
                {/* Price */}
                {selectedListingData.price && (
                  <div className="mb-3 pb-3 border-b border-slate-200">
                    <p className="text-xs text-slate-500 mb-0.5">Monthly rent</p>
                    <p className="text-lg font-bold text-slate-900">{selectedListingData.price}</p>
                  </div>
                )}
                
                {/* View Button */}
                {selectedListingData.numericId && (
                  <button
                    onClick={() => {
                      router.push(`/boardings/${selectedListingData.numericId}`);
                    }}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
