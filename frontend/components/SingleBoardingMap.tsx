"use client";

import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo } from "react";

interface SingleBoardingMapProps {
  lat: number | null;
  lng: number | null;
  title: string;
}

// Default center: Sri Lanka (fallback if lat/lng are null)
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 15; // Higher zoom for single location

export default function SingleBoardingMap({ lat, lng, title }: SingleBoardingMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "dummy-key",
  });

  const mapCenter = useMemo(() => {
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [lat, lng]);

  if (!apiKey) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-red-50 text-sm text-red-600">
        Google Maps API key not configured.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-red-50 text-sm text-red-600">
        Error loading map. Please check your Google Maps API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  if (lat === null || lng === null) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Location not available
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker position={{ lat, lng }} title={title} />
      </GoogleMap>
    </div>
  );
}

