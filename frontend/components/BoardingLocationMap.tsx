"use client";

import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useState, useEffect, useRef } from "react";

interface BoardingLocationMapProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
}

// Default center: Colombo, Sri Lanka
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 };
const DEFAULT_ZOOM = 13;

export default function BoardingLocationMap({ lat, lng, onSelect }: BoardingLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const onSelectRef = useRef(onSelect);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Keep onSelect ref updated
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "dummy-key",
  });

  // Initialize marker position from props
  useEffect(() => {
    if (lat !== null && lng !== null) {
      setMarkerPosition({ lat, lng });
    } else {
      setMarkerPosition(DEFAULT_CENTER);
    }
  }, [lat, lng]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [lat, lng]);

  // Handle map click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkerPosition(newPosition);
      onSelectRef.current(newPosition.lat, newPosition.lng);
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkerPosition(newPosition);
      onSelectRef.current(newPosition.lat, newPosition.lng);
    }
  };

  // Store map instance reference
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  if (loadError) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-gray-200 bg-slate-50 text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-[400px] w-full rounded-lg border border-gray-200 overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
          }}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>
      <p className="text-xs text-slate-500 text-center">
        Click on the map or drag the marker to set location
      </p>
    </div>
  );
}
