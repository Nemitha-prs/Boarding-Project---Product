"use client";

type FiltersState = {
  maxPrice: number;
  maxDistanceKm: number | null;
  roomType: string | null;
};

const roomTypes = [
  { label: "All types", value: "" },
  { label: "Single room", value: "Single room" },
  { label: "Shared room", value: "Shared room" },
  { label: "Annex", value: "Annex" },
  { label: "Apartment", value: "Apartment" },
];

const distanceOptions = [
  { label: "Any distance", value: null },
  { label: "≤ 0.5 km", value: 0.5 },
  { label: "≤ 1 km", value: 1 },
  { label: "≤ 2 km", value: 2 },
  { label: "≤ 5 km", value: 5 },
];

interface FilterBarProps {
  filters: FiltersState;
  onChange: (nextFilters: FiltersState) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const handlePriceChange = (value: number) => {
    onChange({ ...filters, maxPrice: value });
  };

  const handleRoomTypeChange = (value: string) => {
    onChange({ ...filters, roomType: value || null });
  };

  const handleDistanceChange = (value: string) => {
    const parsed = value === "" ? null : Number(value);
    onChange({ ...filters, maxDistanceKm: Number.isNaN(parsed) ? null : parsed });
  };

  const formattedPrice = filters.maxPrice.toLocaleString("en-LK");

  return (
    <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
      <label className="flex flex-col gap-3 text-sm font-medium text-slate-700">
        Max price (Rs {formattedPrice})
        <input
          type="range"
          min={5000}
          max={100000}
          step={1000}
          value={filters.maxPrice}
          onChange={(event) => handlePriceChange(Number(event.target.value))}
          className="accent-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Room type
        <select
          value={filters.roomType ?? ""}
          onChange={(event) => handleRoomTypeChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
        >
          {roomTypes.map((type) => (
            <option key={type.label} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Distance
        <select
          value={filters.maxDistanceKm ?? ""}
          onChange={(event) => handleDistanceChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
        >
          {distanceOptions.map((option) => (
            <option key={option.label} value={option.value ?? ""}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
