// Database type definitions for Supabase tables

export type OwnerStatus = "Active" | "Not-active";

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string | null;
  role: "owner";
  name: string;
  age: number | null;
  phone: string | null;
  NIC: string | null;
  createdAt: string;
}

export interface ListingRow {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  boardingType: string; // "Single room" | "Shared room" | "Annex" | "Apartment"
  district: string;
  colomboArea: string | null;
  lat: number | null;
  lng: number | null;
  beds: number | null;
  bathrooms: number;
  facilities: string[];
  images: string[];
  rating: number;
  status: OwnerStatus;
  pendingApprovals: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkRow {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

