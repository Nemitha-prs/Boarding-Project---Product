"use client";

import { getCurrentUserId } from "@/lib/jwt";

export type OwnerStatus = "Active" | "Not-active";

export interface OwnerContact {
  name: string;
  phone: string;
  email?: string;
}

export interface OwnerListing {
  id: string; // internal id (e.g., BRD-1024 or generated)
  listingId?: number | null; // optional link to public listing
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  district: string;
  colomboArea?: string | null;
  lat: number | null;
  lng: number | null;
  boardingType: "Single room" | "Shared room" | "Annex" | "Apartment";
  beds?: number | null;
  bathrooms: number;
  facilities: string[];
  contact: OwnerContact;
  status: OwnerStatus;
  updatedAt: string;
  occupancy?: string;
  images?: string[]; // data URLs for up to 3 images (MVP)
  ownerId?: string; // owner's user ID
}

function getStorageKey(): string {
  const ownerId = getCurrentUserId();
  if (!ownerId) return "ownerListings";
  return `ownerListings_${ownerId}`;
}

function readAll(): OwnerListing[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey();
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as OwnerListing[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: OwnerListing[]) {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey();
    const ownerId = getCurrentUserId();
    // Add ownerId to each item if not present
    const itemsWithOwner = items.map((item) => ({
      ...item,
      ownerId: ownerId || item.ownerId,
    }));
    window.localStorage.setItem(key, JSON.stringify(itemsWithOwner));
  } catch {}
}

export function getOwnerListings(): OwnerListing[] {
  const ownerId = getCurrentUserId();
  if (!ownerId) return [];
  
  const all = readAll();
  // Filter to only show listings for current owner
  return all.filter((item) => item.ownerId === ownerId);
}

export function getOwnerListing(id: string): OwnerListing | undefined {
  const listings = getOwnerListings();
  return listings.find((x) => x.id === id);
}

export function upsertOwnerListing(item: OwnerListing) {
  const ownerId = getCurrentUserId();
  if (!ownerId) {
    console.error("Cannot save listing: No owner ID found");
    return;
  }
  
  const all = readAll();
  const itemWithOwner = { ...item, ownerId };
  const idx = all.findIndex((x) => x.id === item.id && x.ownerId === ownerId);
  
  if (idx >= 0) {
    all[idx] = itemWithOwner;
  } else {
    all.unshift(itemWithOwner);
  }
  writeAll(all);
}

export function deleteOwnerListing(id: string) {
  const ownerId = getCurrentUserId();
  if (!ownerId) return;
  
  const all = readAll();
  const filtered = all.filter((x) => !(x.id === id && x.ownerId === ownerId));
  writeAll(filtered);
}

export function generateOwnerId(): string {
  const ts = Date.now().toString().slice(-6);
  return `BRD-${ts}`;
}
