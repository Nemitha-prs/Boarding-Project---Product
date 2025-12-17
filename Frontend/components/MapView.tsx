interface MapViewProps {
  listings: Array<{
    id?: number | string;
    title: string;
    distance: string;
  }>;
}

export default function MapView({ listings }: MapViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Map preview</p>
          <p className="text-base font-medium text-slate-900">Leaflet placeholder</p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">Coming soon</span>
      </div>
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Map tiles would render here via Leaflet.
      </div>
      <ul className="space-y-2 text-xs text-slate-500">
        {listings.slice(0, 3).map((listing) => (
          <li key={listing.id ?? listing.title} className="flex items-center justify-between">
            <span>{listing.title}</span>
            <span>{listing.distance} km</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
