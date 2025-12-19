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
  }>;
}

// Default center: Sri Lanka
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 7;

export default function MapView({ listings }: MapViewProps) {
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
        {validListings.map((listing) => (
          <Marker
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            onClick={() => setSelectedListing(listing.id)}
          />
        ))}
        {selectedListingData && (
          <InfoWindow
            position={{ lat: selectedListingData.lat, lng: selectedListingData.lng }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{selectedListingData.title}</h3>
              {selectedListingData.roomType && (
                <p className="text-xs text-slate-600 mb-2">{selectedListingData.roomType}</p>
              )}
              {selectedListingData.numericId && (
                <button
                  onClick={() => {
                    router.push(`/boardings/${selectedListingData.numericId}`);
                  }}
                  className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  View Boarding
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
