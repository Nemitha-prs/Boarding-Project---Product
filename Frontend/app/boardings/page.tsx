"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import ListingCard from "@/components/ListingCard";
import { getBookmarks } from "@/utils/bookmarks";
import { getApiUrl } from "@/lib/auth";
import type { BoardingListing } from "@/lib/fakeData";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

type FiltersState = {
  maxPrice: number;
  maxDistanceKm: number | null;
  roomType: string | null;
};

type SearchMode = "university" | "district";

type LocationState = {
  searchMode: SearchMode;
  selectedUniversity: string | null;
  selectedDistrict: string | null;
  selectedCity: string | null;
};

type Coordinate = {
  lat: number;
  lng: number;
};

type DropdownOption = {
  value: string;
  label: string;
};

// Database listing type (from backend)
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
  createdAt: string;
}

// Convert DB listing to BoardingListing format
function convertDbListingToBoarding(db: DbListing): BoardingListing {
  // Use first image as cover image
  const coverImage = db.images && db.images.length > 0 ? db.images[0] : "/images/board1.jpg";
  const location = db.colomboArea || db.district;
  
  // Convert string ID to number for compatibility with existing components
  // Use a hash of the string ID to get a consistent number
  let numericId = 0;
  if (db.id) {
    for (let i = 0; i < db.id.length; i++) {
      numericId = ((numericId << 5) - numericId) + db.id.charCodeAt(i);
      numericId = numericId & numericId; // Convert to 32-bit integer
    }
    numericId = Math.abs(numericId);
  }
  
  return {
    id: numericId,
    title: db.title,
    description: db.description,
    price: `Rs. ${db.price.toLocaleString("en-LK")}`,
    image: coverImage, // First image is the cover
    location: location,
    district: db.district,
    areaCode: db.colomboArea,
    roomType: db.boardingType,
    distance: "—", // Will be calculated if lat/lng available
    rating: 0,
    facilities: db.facilities,
    availableBeds: db.beds || undefined,
  };
}

const DEFAULT_FILTERS: FiltersState = {
  maxPrice: 100000,
  maxDistanceKm: null,
  roomType: null,
};

const UNIVERSITY_OPTIONS: string[] = [
  "University of Colombo",
  "University of Peradeniya",
  "University of Sri Jayewardenepura",
  "University of Kelaniya",
  "University of Moratuwa",
  "University of Ruhuna",
  "University of Jaffna",
  "Eastern University, Sri Lanka",
  "South Eastern University of Sri Lanka",
  "Rajarata University of Sri Lanka",
  "Wayamba University of Sri Lanka",
  "Uva Wellassa University",
  "Open University of Sri Lanka",
  "University of the Visual & Performing Arts",
  "General Sir John Kotelawala Defence University (KDU)",
  "University of Vocational Technology (UNIVOTEC)",
  "Informatics Institute of Technology (IIT)",
  "Sri Lanka Institute of Information Technology (SLIIT)",
  "NSBM Green University",
  "Sri Lanka Technological Campus (SLTC)",
  "Horizon Campus",
  "Saegis Campus",
  "Royal Institute of Colombo",
  "CINEC Campus",
  "International Institute of Health Sciences (IIHS)",
  "ECU Sri Lanka (Edith Cowan University – partner campus)",
  "Limkokwing University Sri Lanka",
];

const DISTRICT_OPTIONS: string[] = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

const COLOMBO_CITY_OPTIONS: { code: string; name: string }[] = [
  { code: "Colombo 01", name: "Fort" },
  { code: "Colombo 02", name: "Slave Island" },
  { code: "Colombo 03", name: "Kollupitiya" },
  { code: "Colombo 04", name: "Bambalapitiya" },
  { code: "Colombo 05", name: "Havelock Town" },
  { code: "Colombo 06", name: "Wellawatte" },
  { code: "Colombo 07", name: "Cinnamon Gardens" },
  { code: "Colombo 08", name: "Borella" },
  { code: "Colombo 09", name: "Dematagoda" },
  { code: "Colombo 10", name: "Maradana" },
  { code: "Colombo 11", name: "Pettah" },
  { code: "Colombo 12", name: "Hulftsdorp" },
  { code: "Colombo 13", name: "Kotahena" },
  { code: "Colombo 14", name: "Grandpass" },
  { code: "Colombo 15", name: "Mutwal" },
  { code: "Dehiwala", name: "Dehiwala" },
  { code: "Mount Lavinia", name: "Mount Lavinia" },
  { code: "Nugegoda", name: "Nugegoda" },
  { code: "Maharagama", name: "Maharagama" },
];

const UNIVERSITY_AREAS: Record<string, string[]> = {
  "University of Colombo": [
    "Colombo 07",
    "Borella",
    "Cinnamon Gardens",
    "Thimbirigasyaya",
    "Maradana",
  ],
  "University of Peradeniya": [
    "Peradeniya",
    "Kandy",
    "Katugastota",
    "Kundasale",
    "Tennekumbura",
  ],
  "University of Sri Jayewardenepura": [
    "Gangodawila",
    "Nugegoda",
    "Maharagama",
    "Delkanda",
    "Pagoda",
  ],
  "University of Kelaniya": [
    "Kelaniya",
    "Kiribathgoda",
    "Peliyagoda",
    "Wattala",
    "Makola",
  ],
  "University of Moratuwa": [
    "Katubedda",
    "Moratuwa",
    "Rathmalana",
    "Ratmalana",
    "Panadura",
    "Dehiwala",
  ],
  "University of Ruhuna": [
    "Wellamadama",
    "Matara",
    "Walgama",
    "Nupe",
    "Akuressa",
  ],
  "University of Jaffna": [
    "Thirunelvely",
    "Jaffna",
    "Jaffna Town",
    "Nallur",
    "Kokuvil",
    "Chunnakam",
  ],
  "Eastern University, Sri Lanka": [
    "Vantharumoolai",
    "Batticaloa",
    "Eravur",
    "Kattankudy",
    "Chenkalady",
  ],
  "South Eastern University of Sri Lanka": [
    "Oluvil",
    "Ampara",
    "Akkaraipattu",
    "Sammanthurai",
    "Kalmunai",
  ],
  "Rajarata University of Sri Lanka": [
    "Mihintale",
    "Anuradhapura",
    "Saliyapura",
    "Kekirawa",
  ],
  "Wayamba University of Sri Lanka": [
    "Kuliyapitiya",
    "Makandura",
    "Narammala",
    "Pannala",
    "Giriulla",
  ],
  "Uva Wellassa University": [
    "Badulla",
    "Haliela",
    "Passara",
    "Bandarawela",
  ],
  "Open University of Sri Lanka": [
    "Nawala",
    "Rajagiriya",
    "Koswatte",
    "Battaramulla",
  ],
  "University of the Visual & Performing Arts": [
    "Colombo 07",
    "Borella",
    "Town Hall",
    "Maradana",
    "Rajagiriya",
  ],
  "General Sir John Kotelawala Defence University (KDU)": [
    "Ratmalana",
    "Rathmalana",
    "Moratuwa",
    "Dehiwala",
    "Mount Lavinia",
  ],
  "University of Vocational Technology (UNIVOTEC)": [
    "Ratmalana",
    "Rathmalana",
    "Attidiya",
    "Boralesgamuwa",
    "Dehiwala",
  ],
  "Informatics Institute of Technology (IIT)": [
    "Bambalapitiya",
    "Wellawatte",
    "Kollupitiya",
    "Narahenpita",
  ],
  "Sri Lanka Institute of Information Technology (SLIIT)": [
    "Malabe",
    "Kaduwela",
    "Battaramulla",
    "Athurugiriya",
  ],
  "NSBM Green University": [
    "Pitipana",
    "Homagama",
    "Godagama",
    "Kottawa",
    "Athurugiriya",
  ],
  "Sri Lanka Technological Campus (SLTC)": [
    "Padukka",
    "Hanwella",
    "Meegoda",
    "Homagama",
  ],
  "Horizon Campus": [
    "Malabe",
    "Kaduwela",
    "Battaramulla",
    "Athurugiriya",
  ],
  "Saegis Campus": [
    "Nugegoda",
    "Delkanda",
    "Maharagama",
    "Pagoda",
  ],
  "Royal Institute of Colombo": [
    "Colombo 05",
    "Havelock Town",
    "Narahenpita",
    "Kirulapone",
    "Borella",
  ],
  "CINEC Campus": [
    "Malabe",
    "Kaduwela",
    "Battaramulla",
    "Athurugiriya",
  ],
  "International Institute of Health Sciences (IIHS)": [
    "Welisara",
    "Ragama",
    "Kandana",
    "Wattala",
  ],
  "ECU Sri Lanka (Edith Cowan University – partner campus)": [
    "Rajagiriya",
    "Battaramulla",
    "Nawala",
    "Borella",
  ],
  "Limkokwing University Sri Lanka": [
    "Malabe",
    "Kaduwela",
    "Athurugiriya",
    "Battaramulla",
  ],
};

const UNIVERSITY_COORDS: Record<string, Coordinate> = {
  "University of Colombo": { lat: 6.9016, lng: 79.8607 },
  "University of Moratuwa": { lat: 6.7969, lng: 79.9018 },
  "SLIIT Malabe": { lat: 6.9147, lng: 79.9733 },
  "University of Sri Jayewardenepura": { lat: 6.8528, lng: 79.9040 },
};

const DISTRICT_COORDS: Record<string, Coordinate> = {
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Gampaha: { lat: 7.0873, lng: 80.0144 },
  Kalutara: { lat: 6.5854, lng: 79.9607 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Matale: { lat: 7.4675, lng: 80.6234 },
  "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
  Galle: { lat: 6.0535, lng: 80.2210 },
  Matara: { lat: 5.9549, lng: 80.5550 },
  Hambantota: { lat: 6.1246, lng: 81.1185 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kilinochchi: { lat: 9.3975, lng: 80.4053 },
  Mannar: { lat: 8.9770, lng: 79.9040 },
  Vavuniya: { lat: 8.7542, lng: 80.4983 },
  Mullaitivu: { lat: 9.2671, lng: 80.8140 },
  Batticaloa: { lat: 7.7436, lng: 81.7010 },
  Ampara: { lat: 7.3018, lng: 81.6747 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
  Kurunegala: { lat: 7.4863, lng: 80.3623 },
  Puttalam: { lat: 8.0408, lng: 79.8390 },
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0023 },
  Badulla: { lat: 6.9934, lng: 81.0550 },
  Monaragala: { lat: 6.8726, lng: 81.3509 },
  Ratnapura: { lat: 6.7056, lng: 80.3847 },
  Kegalle: { lat: 7.2513, lng: 80.3464 },
};

const COLOMBO_CITY_COORDS: Record<string, Coordinate> = {
  "Colombo 01": { lat: 6.9355, lng: 79.8428 },
  "Colombo 02": { lat: 6.9214, lng: 79.8482 },
  "Colombo 03": { lat: 6.9100, lng: 79.8539 },
  "Colombo 04": { lat: 6.9008, lng: 79.8652 },
  "Colombo 05": { lat: 6.8912, lng: 79.8777 },
  "Colombo 06": { lat: 6.8750, lng: 79.8697 },
  "Colombo 07": { lat: 6.9067, lng: 79.8680 },
  "Colombo 08": { lat: 6.9106, lng: 79.8870 },
  "Colombo 09": { lat: 6.9380, lng: 79.8656 },
  "Colombo 10": { lat: 6.9350, lng: 79.8773 },
  "Colombo 11": { lat: 6.9430, lng: 79.8795 },
  "Colombo 12": { lat: 6.9560, lng: 79.8845 },
  "Colombo 13": { lat: 6.9587, lng: 79.8710 },
  "Colombo 14": { lat: 6.9650, lng: 79.8715 },
  "Colombo 15": { lat: 6.9730, lng: 79.8670 },
  Dehiwala: { lat: 6.8402, lng: 79.8655 },
  "Mount Lavinia": { lat: 6.8400, lng: 79.8650 },
  Nugegoda: { lat: 6.8723, lng: 79.8893 },
  Maharagama: { lat: 6.8410, lng: 79.9285 },
};

const LISTING_COORDS: Record<number, Coordinate> = {
  1: { lat: 6.9067, lng: 79.8680 }, // Colombo 07
  2: { lat: 6.8723, lng: 79.8893 }, // Nugegoda
  3: { lat: 6.9040, lng: 79.9600 }, // Malabe
  4: { lat: 6.9180, lng: 79.8770 }, // Rajagiriya
  5: { lat: 6.8410, lng: 79.9285 }, // Maharagama
  6: { lat: 6.8960, lng: 79.9180 }, // Battaramulla
};

const DEFAULT_LOCATION: LocationState = {
  searchMode: "university",
  selectedUniversity: null,
  selectedDistrict: null,
  selectedCity: null,
};

function parsePrice(price: string): number {
  // Prices are whole-rupee amounts like "Rs. 15,000" – strip everything except digits
  const numeric = price.replace(/[^0-9]/g, "");
  const value = Number(numeric);
  return Number.isFinite(value) ? value : 0;
}

function parseDistanceKm(distance: string): number {
  const numeric = distance.replace(/[^0-9.]/g, "");
  const value = Number(numeric);
  return Number.isFinite(value) ? value : 0;
}

function haversineKm(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function getReferenceCoordinate(location: LocationState): Coordinate | null {
  if (location.searchMode === "university" && location.selectedUniversity) {
    return UNIVERSITY_COORDS[location.selectedUniversity] ?? null;
  }

  if (location.searchMode === "district" && location.selectedDistrict) {
    if (location.selectedDistrict === "Colombo" && location.selectedCity) {
      return COLOMBO_CITY_COORDS[location.selectedCity] ?? null;
    }

    return DISTRICT_COORDS[location.selectedDistrict] ?? null;
  }

  return null;
}

function getListingCoordinate(listing: BoardingListing): Coordinate | null {
  return LISTING_COORDS[listing.id] ?? null;
}

function LocationDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
      >
        <span className={selected ? "" : "text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-4 py-2 text-left hover:bg-slate-50 ${
                option.value === value ? "bg-slate-50 text-slate-900" : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function applyFilters(
  boardings: BoardingListing[],
  filters: FiltersState,
  location: LocationState
): BoardingListing[] {
  const reference = getReferenceCoordinate(location);

  return boardings.filter((listing) => {
    // Location-based filtering by university when in university mode
    if (location.searchMode === "university" && location.selectedUniversity) {
      const areas = UNIVERSITY_AREAS[location.selectedUniversity] ?? [];
      if (areas.length > 0) {
        const listingLocation = listing.location.toLowerCase();
        const matchesUniversityArea = areas.some((area) =>
          listingLocation.includes(area.toLowerCase())
        );

        if (!matchesUniversityArea) {
          return false;
        }
      }
    }

    // Location-based filtering by district/area when in district mode
    if (location.searchMode === "district") {
      // If a specific district is selected, only keep listings from that district
      if (location.selectedDistrict && location.selectedDistrict.length > 0) {
        if (listing.district !== location.selectedDistrict) {
          return false;
        }
      }

      // If a specific Colombo area is selected, match listings whose location mentions that area name
      if (
        location.selectedDistrict === "Colombo" &&
        location.selectedCity &&
        location.selectedCity.length > 0
      ) {
        const cityOption = COLOMBO_CITY_OPTIONS.find(
          (city) => city.code === location.selectedCity
        );
        const areaName = (cityOption?.name ?? location.selectedCity).toLowerCase();
        const listingLocation = listing.location.toLowerCase();

        if (!listingLocation.includes(areaName)) {
          return false;
        }
      }
    }

    const priceValue = parsePrice(listing.price);
    if (filters.maxPrice && priceValue > filters.maxPrice) {
      return false;
    }

    if (filters.maxDistanceKm !== null) {
      let distanceValue: number | null = null;

      const listingCoord = getListingCoordinate(listing);
      if (reference && listingCoord) {
        distanceValue = haversineKm(reference, listingCoord);
      } else {
        distanceValue = parseDistanceKm(listing.distance);
      }

      if (distanceValue !== null && distanceValue > filters.maxDistanceKm) {
        return false;
      }
    }

    if (filters.roomType && filters.roomType.length > 0) {
      // Case-insensitive comparison to handle any casing differences
      if (listing.roomType.toLowerCase() !== filters.roomType.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
}

export default function BoardingsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  const [listings, setListings] = useState<BoardingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bookmarkSet = useMemo(() => new Set(bookmarkIds), [bookmarkIds]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch listings from backend
  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        // Add cache-busting query parameter to ensure fresh data
        const response = await fetch(`${getApiUrl("/listings")}?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }
        const dbListings: DbListing[] = await response.json();
        // Filter only Active listings
        const activeListings = dbListings
          .filter((l) => l.status === "Active")
          .map(convertDbListingToBoarding);
        setListings(activeListings);
        setError("");
      } catch (err: any) {
        console.error("Error fetching listings:", err);
        setError(err.message || "Failed to load listings");
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
    
    // Refresh listings when page becomes visible (e.g., when returning from creating/editing a listing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchListings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Refresh when page is shown (handles navigation back to page)
    const handlePageshow = (e: PageTransitionEvent) => {
      if (e.persisted || document.visibilityState === "visible") {
        fetchListings();
      }
    };
    window.addEventListener("pageshow", handlePageshow);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageshow);
    };
  }, [refreshKey]);
  
  // Force refresh when page is navigated to or focused
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener("focus", handleFocus);
    
    // Listen for custom refresh event from other pages
    const handleRefresh = () => {
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener("listings-refresh", handleRefresh);
    
    // Refresh on mount to ensure fresh data
    setRefreshKey((prev) => prev + 1);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("listings-refresh", handleRefresh);
    };
  }, []);

  useEffect(() => {
    setBookmarkIds(getBookmarks());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bookmarks") {
        setBookmarkIds(getBookmarks());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filteredListings = useMemo(
    () => applyFilters(listings, filters, location),
    [listings, filters, location]
  );

  const sortedListings = useMemo(() => {
    if (!bookmarkIds.length) return filteredListings;
    const copy = [...filteredListings];
    copy.sort((a, b) => {
      const aB = bookmarkSet.has(a.id) ? 1 : 0;
      const bB = bookmarkSet.has(b.id) ? 1 : 0;
      if (aB !== bB) return bB - aB; // bookmarked first
      return 0;
    });
    return copy;
  }, [filteredListings, bookmarkSet]);

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <section className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Explore
            </p>
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
                Boardings near you
              </h2>
              <Link
                href="/boardings/map"
                className="inline-flex items-center justify-center rounded-full bg-[#1F2937] px-5 py-2 text-xs font-semibold text-white shadow-md transition-transform transition-colors hover:scale-[1.02] hover:bg-black sm:text-sm"
              >
                View map
              </Link>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Use the smart filters to narrow down listings by price, distance to campus, and preferred room type.
              Everything below is powered by mock data so you can focus on UI tweaks.
            </p>
          </header>

          <div className="relative z-[100] rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-gray-100 backdrop-blur-sm sm:p-5 space-y-4">
            <section className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Location search
                  </p>
                  <p className="text-xs text-slate-500">
                    Search by university or district to personalise distance filters.
                  </p>
                </div>
                <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() =>
                      setLocation((prev) => ({
                        ...prev,
                        searchMode: "university",
                        selectedUniversity: prev.selectedUniversity ?? null,
                        selectedDistrict: null,
                        selectedCity: null,
                      }))
                    }
                    className={`rounded-full px-3 py-1 transition ${
                      location.searchMode === "university"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "hover:bg-white/60"
                    }`}
                  >
                    By university
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLocation({
                        searchMode: "district",
                        selectedUniversity: null,
                        selectedDistrict: null,
                        selectedCity: null,
                      })
                    }
                    className={`rounded-full px-3 py-1 transition ${
                      location.searchMode === "district"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "hover:bg:white/60"
                    }`}
                  >
                    By district
                  </button>
                </div>
              </div>

              {location.searchMode === "university" ? (
                <div className="max-w-xs">
                  <label className="flex flex-col gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                    Select university
                    <LocationDropdown
                      value={location.selectedUniversity ?? ""}
                      placeholder="All universities"
                      options={[
                        { value: "", label: "All universities" },
                        ...UNIVERSITY_OPTIONS.map((name) => ({ value: name, label: name })),
                      ]}
                      onChange={(nextValue) =>
                        setLocation((prev) => ({
                          ...prev,
                          selectedUniversity: nextValue || null,
                        }))
                      }
                    />
                  </label>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                    District
                    <LocationDropdown
                      value={location.selectedDistrict ?? ""}
                      placeholder="Select district"
                      options={[
                        { value: "", label: "All districts" },
                        ...DISTRICT_OPTIONS.map((name) => ({ value: name, label: name })),
                      ]}
                      onChange={(nextValue) => {
                        const district = nextValue || null;
                        setLocation((prev) => ({
                          ...prev,
                          selectedDistrict: district,
                          selectedCity: district === "Colombo" ? prev.selectedCity : null,
                        }));
                      }}
                    />
                  </label>

                  {location.selectedDistrict === "Colombo" && (
                    <label className="flex flex-col gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                      Area in Colombo
                      <LocationDropdown
                        value={location.selectedCity ?? ""}
                        placeholder="Select area"
                        options={[
                          { value: "", label: "All areas" },
                          ...COLOMBO_CITY_OPTIONS.map((city) => ({
                            value: city.code,
                            label: city.name,
                          })),
                        ]}
                        onChange={(nextValue) =>
                          setLocation((prev) => ({
                            ...prev,
                            selectedCity: nextValue || null,
                          }))
                        }
                      />
                    </label>
                  )}
                </div>
              )}
            </section>

            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {sortedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-gray-100">
              <p className="font-medium text-slate-700">No boardings match your filters.</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Try widening the price range, increasing the distance, or selecting a different room type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedListings.map((listing) => (
                <ListingCard key={listing.id} {...listing} bookmarked={bookmarkSet.has(listing.id)} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
