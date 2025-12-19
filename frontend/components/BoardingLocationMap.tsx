"use client";

import { useEffect, useRef, useState } from "react";

interface BoardingLocationMapProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
}

export default function BoardingLocationMap({ lat, lng, onSelect }: BoardingLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const onSelectRef = useRef(onSelect);
  const initialLatRef = useRef(lat);
  const initialLngRef = useRef(lng);

  // Keep onSelect ref updated
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Keep initial lat/lng refs updated (only on first render)
  useEffect(() => {
    if (initialLatRef.current === null && lat !== null) {
      initialLatRef.current = lat;
    }
    if (initialLngRef.current === null && lng !== null) {
      initialLngRef.current = lng;
    }
  }, [lat, lng]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      // Initialize map with initial values
      const defaultLat = initialLatRef.current ?? 6.9271;
      const defaultLng = initialLngRef.current ?? 79.8612;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add marker
      const newMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      // Handle marker drag
      newMarker.on("dragend", () => {
        const position = newMarker.getLatLng();
        onSelectRef.current(position.lat, position.lng);
      });

      // Handle map click
      map.on("click", (e: any) => {
        newMarker.setLatLng(e.latlng);
        onSelectRef.current(e.latlng.lat, e.latlng.lng);
      });

      setMapInstance(map);
      setMarker(newMarker);
    };

    loadLeaflet();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when lat/lng props change
  useEffect(() => {
    if (marker && lat !== null && lng !== null) {
      marker.setLatLng([lat, lng]);
      if (mapInstance) {
        mapInstance.setView([lat, lng], 13);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css"
      />
      <div
        ref={mapRef}
        className="h-[400px] w-full rounded-lg border border-gray-200"
      />
      <p className="text-xs text-slate-500 text-center">
        Click on the map or drag the marker to set location
      </p>
    </div>
  );
}