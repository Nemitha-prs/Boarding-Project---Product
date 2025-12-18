"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import ListingCard from "@/components/ListingCard";
import { getBookmarks, fetchUserBookmarks } from "@/utils/bookmarks";
import { getApiUrl, isAuthenticated } from "@/lib/auth";
import type { BoardingListing } from "@/lib/fakeData";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { stringIdToNumeric } from "@/utils/idConverter";
import {
  UNIVERSITY_COORDS,
  DISTRICT_COORDS,
  COLOMBO_CITY_COORDS,
  getReferenceCoordinate as getRefCoord,
  haversineKm,
  type Coordinate,
} from "@/utils/distance";

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
  
  // Convert string ID to number using the shared utility function
  const numericId = stringIdToNumeric(db.id);
  
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
  // Central Areas (Colombo 1-15)
  { code: "Colombo 01", name: "Fort" },
  { code: "Pettah", name: "Pettah" },
  { code: "Colombo 02", name: "Slave Island" },
  { code: "Kompanna Veediya", name: "Kompanna Veediya" },
  { code: "Colombo 03", name: "Kollupitiya" },
  { code: "Colombo 07", name: "Cinnamon Gardens" },
  { code: "Colombo 04", name: "Bambalapitiya" },
  { code: "Colombo 06", name: "Wellawatte" },
  { code: "Thimbirigasyaya", name: "Thimbirigasyaya" },
  { code: "Colombo 05", name: "Havelock Town" },
  { code: "Kirulapone", name: "Kirulapone" },
  { code: "Narahenpita", name: "Narahenpita" },
  { code: "Colombo 08", name: "Borella" },
  { code: "Colombo 10", name: "Maradana" },
  { code: "Colombo 12", name: "Hulftsdorp" },
  // Northern & Port-side Areas
  { code: "Colombo 13", name: "Kotahena" },
  { code: "Colombo 14", name: "Grandpass" },
  { code: "Maligawatte", name: "Maligawatte" },
  { code: "Colombo 15", name: "Mutwal" },
  { code: "Mattakkuliya", name: "Mattakkuliya" },
  { code: "Modara", name: "Modara" },
  { code: "Colombo 09", name: "Dematagoda" },
  { code: "Kolonnawa", name: "Kolonnawa" },
  { code: "Angoda", name: "Angoda" },
  { code: "Wellampitiya", name: "Wellampitiya" },
  // Eastern / Administrative Belt
  { code: "Rajagiriya", name: "Rajagiriya" },
  { code: "Battaramulla", name: "Battaramulla" },
  { code: "Ethul Kotte", name: "Ethul Kotte" },
  { code: "Sri Jayawardenepura Kotte", name: "Sri Jayawardenepura Kotte" },
  { code: "Nawala", name: "Nawala" },
  { code: "Koswatta", name: "Koswatta" },
  // Southern Belt
  { code: "Dehiwala", name: "Dehiwala" },
  { code: "Kalubowila", name: "Kalubowila" },
  { code: "Mount Lavinia", name: "Mount Lavinia" },
  { code: "Rathmalana", name: "Rathmalana" },
  { code: "Moratuwa", name: "Moratuwa" },
  // South-East / University & Residential Areas
  { code: "Nugegoda", name: "Nugegoda" },
  { code: "Kohuwala", name: "Kohuwala" },
  { code: "Udahamulla", name: "Udahamulla" },
  { code: "Maharagama", name: "Maharagama" },
  { code: "Piliyandala", name: "Piliyandala" },
  { code: "Kottawa", name: "Kottawa" },
  // Outer Colombo District
  { code: "Athurugiriya", name: "Athurugiriya" },
  { code: "Homagama", name: "Homagama" },
  { code: "Godagama", name: "Godagama" },
  { code: "Meegoda", name: "Meegoda" },
  // Northern Suburbs
  { code: "Peliyagoda", name: "Peliyagoda" },
  { code: "Kelaniya", name: "Kelaniya" },
  { code: "Wattala", name: "Wattala" },
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

function getReferenceCoordinate(location: LocationState): Coordinate | null {
  return getRefCoord(
    location.selectedUniversity,
    location.selectedDistrict,
    location.selectedCity
  );
}

function getListingCoordinate(
  listing: BoardingListing,
  dbListings: DbListing[],
  idMapping: Map<number, string>
): Coordinate | null {
  const dbId = idMapping.get(listing.id);
  if (!dbId) return null;
  const dbListing = dbListings.find((l) => l.id === dbId);
  if (!dbListing || dbListing.lat === null || dbListing.lng === null) return null;
  return { lat: dbListing.lat, lng: dbListing.lng };
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

function calculateDistances(
  boardings: BoardingListing[],
  location: LocationState,
  dbListings: DbListing[],
  idMapping: Map<number, string>
): BoardingListing[] {
  const reference = getReferenceCoordinate(location);
  
  // If no reference location selected, return listings with distance "—"
  if (!reference) {
    return boardings.map((listing) => ({ ...listing, distance: "—" }));
  }

  // Calculate distance for each listing
  return boardings.map((listing) => {
    const listingCoord = getListingCoordinate(listing, dbListings, idMapping);
    if (!listingCoord) {
      return { ...listing, distance: "—" };
    }
    
    const distanceKm = haversineKm(reference, listingCoord);
    const distanceText = distanceKm < 1 
      ? `${(distanceKm * 1000).toFixed(0)} m`
      : `${distanceKm.toFixed(1)} km`;
    
    return { ...listing, distance: distanceText };
  });
}

function applyFilters(
  boardings: BoardingListing[],
  filters: FiltersState,
  location: LocationState,
  dbListings: DbListing[],
  idMapping: Map<number, string>
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

    // Distance filter only applies when a reference location is selected
    if (filters.maxDistanceKm !== null && reference) {
      const listingCoord = getListingCoordinate(listing, dbListings, idMapping);
      if (listingCoord) {
        // Calculate distance for filtering (reuses same logic as display calculation)
        const distanceValue = haversineKm(reference, listingCoord);
        if (distanceValue > filters.maxDistanceKm) {
          return false;
        }
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
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  const [listings, setListings] = useState<BoardingListing[]>([]);
  const [dbListings, setDbListings] = useState<DbListing[]>([]); // Store original DB listings for ID mapping
  const [idMapping, setIdMapping] = useState<Map<number, string>>(new Map()); // Map numeric ID to DB ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<Map<string, { rating: number; count: number }>>(new Map());
  const bookmarkSet = useMemo(() => new Set(bookmarkIds), [bookmarkIds]);
  // Track if listings have been fetched to prevent unnecessary re-fetches
  const listingsFetchedRef = useRef(false);

  // Fetch listings and bookmarks together (only on mount)
  useEffect(() => {
    // Skip if already fetched (prevents unnecessary re-fetches on re-renders)
    if (listingsFetchedRef.current) {
      return;
    }

    async function fetchAllPageData() {
      setLoading(true);
      try {
        // Fetch only active listings from backend (filtered server-side)
        const listingsResponse = await fetch(getApiUrl("/listings?status=Active"));
        if (!listingsResponse.ok) {
          throw new Error("Failed to fetch listings");
        }
        
        const dbListingsData: DbListing[] = await listingsResponse.json();
        
        // Process listings immediately (already filtered by backend)
        const activeDbListings: DbListing[] = [];
        const convertedListings: BoardingListing[] = [];
        const mapping = new Map<number, string>();
        
        // Quick processing loop - use original function for clarity
        for (const dbListing of dbListingsData) {
          activeDbListings.push(dbListing);
          const converted = convertDbListingToBoarding(dbListing);
          convertedListings.push(converted);
          mapping.set(converted.id, dbListing.id);
        }
        
        // Show listings immediately
        setDbListings(activeDbListings);
        setListings(convertedListings);
        setIdMapping(mapping);
        setError("");
        listingsFetchedRef.current = true;
        setLoading(false);
        
        // Fetch bookmarks separately and update when ready (non-blocking)
        if (isAuthenticated()) {
          fetchUserBookmarks()
            .then((dbBookmarkIds: string[]) => {
              const bookmarkSet = new Set(dbBookmarkIds);
              const numericBookmarkIds: number[] = [];
              mapping.forEach((dbId, numericId) => {
                if (bookmarkSet.has(dbId)) {
                  numericBookmarkIds.push(numericId);
                }
              });
              setBookmarkIds(numericBookmarkIds);
            })
            .catch(() => {
              // Silent fail - bookmarks just won't show
            });
        }

        // Fetch ratings for all listings (non-blocking)
        fetchRatingsForListings(activeDbListings.map(l => l.id))
          .then((ratingsMap) => {
            setRatings(ratingsMap);
          })
          .catch((err) => {
            console.error("Error fetching ratings:", err);
            // Silent fail - ratings just won't show
          });
      } catch (err: any) {
        console.error("Error fetching listings:", err);
        setError(err.message || "Failed to load listings");
        setListings([]);
        setBookmarkIds([]);
        setLoading(false);
      }
    }
    
    fetchAllPageData();
  }, []); // Only run on mount

  // Helper function to fetch ratings for multiple listings
  async function fetchRatingsForListings(listingIds: string[]): Promise<Map<string, { rating: number; count: number }>> {
    const ratingsMap = new Map<string, { rating: number; count: number }>();
    
    // Fetch reviews for all listings in parallel
    const reviewPromises = listingIds.map(async (listingId) => {
      try {
        const response = await fetch(getApiUrl(`/reviews/${listingId}`));
        if (response.ok) {
          const reviews = await response.json();
          if (Array.isArray(reviews) && reviews.length > 0) {
            const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
            ratingsMap.set(listingId, { rating: avgRating, count: reviews.length });
          }
        }
      } catch (err) {
        // Silent fail for individual listings
        console.error(`Error fetching reviews for ${listingId}:`, err);
      }
    });

    await Promise.all(reviewPromises);
    return ratingsMap;
  }
  
  // Listen for bookmark changes when not authenticated (legacy localStorage)
  useEffect(() => {
    if (!isAuthenticated()) {
      const onStorage = (e: StorageEvent) => {
        if (e.key === "bookmarks") {
          setBookmarkIds(getBookmarks());
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener("storage", onStorage);
      };
    }
  }, []);

  // Calculate distances when a reference location is selected
  const listingsWithDistances = useMemo(
    () => calculateDistances(listings, location, dbListings, idMapping),
    [listings, location, dbListings, idMapping]
  );

  const filteredListings = useMemo(
    () => applyFilters(listingsWithDistances, filters, location, dbListings, idMapping),
    [listingsWithDistances, filters, location, dbListings, idMapping]
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
  }, [filteredListings, bookmarkSet, bookmarkIds.length]);

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

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-12 text-center">
              <p className="text-sm font-medium text-slate-600">Loading listings...</p>
            </div>
          ) : sortedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-gray-100">
              <p className="font-medium text-slate-700">No boardings match your filters.</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Try widening the price range, increasing the distance, or selecting a different room type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedListings.map((listing) => {
                const dbId = idMapping.get(listing.id);
                const ratingData = dbId ? ratings.get(dbId) : undefined;
                const cardProps: any = {
                  ...listing,
                  bookmarked: bookmarkSet.has(listing.id),
                };
                if (ratingData?.rating !== undefined) {
                  cardProps.rating = ratingData.rating;
                }
                if (ratingData?.count !== undefined) {
                  cardProps.reviewCount = ratingData.count;
                }
                return (
                  <ListingCard 
                    key={listing.id} 
                    {...cardProps}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
