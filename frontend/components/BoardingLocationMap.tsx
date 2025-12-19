"use client";

import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useState, useEffect } from "react";

interface BoardingLocationMapProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
}

// Default center: Sri Lanka
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 7;

export default function BoardingLocationMap({ lat, lng, onSelect }: BoardingLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "dummy-key",
  });

  const center = useMemo(() => {
    if (
      typeof lat === "number" && 
      typeof lng === "number" && 
      !isNaN(lat) && 
      !isNaN(lng) &&
      lat !== null && 
      lng !== null
    ) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [lat, lng]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    try {
      if (e?.latLng && typeof onSelect === "function") {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        if (typeof clickedLat === "number" && typeof clickedLng === "number" && !isNaN(clickedLat) && !isNaN(clickedLng)) {
          onSelect(clickedLat, clickedLng);
        }
      }
    } catch (err) {
      console.error("Error handling map click:", err);
    }
  };

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

  if (!isClient || !isLoaded) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  // Safety check for Google Maps API
  if (typeof window === "undefined" || !window.google) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  const hasValidCoords = 
    typeof lat === "number" && 
    typeof lng === "number" && 
    !isNaN(lat) && 
    !isNaN(lng) &&
    lat !== null && 
    lng !== null;

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={hasValidCoords ? 15 : DEFAULT_ZOOM}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {hasValidCoords && (
          <Marker position={{ lat: lat!, lng: lng! }} />
        )}
      </GoogleMap>
      <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-700 shadow">
        Click on the map to set location
      </span>
    </div>
  );
}

