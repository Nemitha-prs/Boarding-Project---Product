"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  OwnerListing,
  OwnerStatus,
} from "@/utils/ownerListings";
import { fetchWithAuth, getApiUrl, isAuthenticated } from "@/lib/auth";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/jwt";
import { readImageFile, handleBackendImageError, getErrorMessage, type ImageUploadError } from "@/utils/imageUpload";

const FACILITIES = [
  "CCTV",
  "Locked gates",
  "Air conditioning (A/C)",
  "Hot water shower",
  "Furniture",
  "Kitchen equipment",
  "Refrigerator",
];

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
  ownerId: string;
}

// Convert DbListing to OwnerListing format
function convertDbToOwnerListing(db: DbListing): OwnerListing {
  return {
    id: db.id,
    listingId: null,
    title: db.title,
    description: db.description,
    price: db.price,
    negotiable: db.negotiable,
    district: db.district,
    colomboArea: db.colomboArea,
    lat: db.lat,
    lng: db.lng,
    boardingType: db.boardingType as "Single room" | "Shared room" | "Annex" | "Apartment",
    beds: db.beds,
    bathrooms: db.bathrooms,
    facilities: db.facilities,
    contact: {
      name: "", // Not stored in DB, will need to be added separately
      phone: "", // Not stored in DB, will need to be added separately
    },
    status: db.status,
    updatedAt: new Date().toISOString(),
    images: db.images,
  };
}

export default function EditOwnerListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<OwnerListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Protect route - redirect if not authenticated or not owner
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    
    const userRole = getCurrentUserRole();
    if (userRole !== "owner") {
      router.push("/");
      return;
    }
  }, [router]);

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        setError("");
        const id = params?.id as string;
        const ownerId = getCurrentUserId();
        
        if (!ownerId) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        if (!id) {
          setError("Listing ID is required");
          setLoading(false);
          return;
        }

        // Fetch the listing from backend
        const response = await fetch(getApiUrl(`/listings/${id}`));
        if (!response.ok) {
          if (response.status === 404) {
            setError("Listing not found");
          } else {
            throw new Error("Failed to fetch listing");
          }
          setLoading(false);
          return;
        }

        const dbListing: DbListing = await response.json();
        
        // Verify the listing belongs to the current owner
        if (dbListing.ownerId !== ownerId) {
          setError("You don't have permission to edit this listing");
          setItem(null);
        } else {
          const converted = convertDbToOwnerListing(dbListing);
          setItem(converted);
        }
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message || "Failed to load listing");
        setItem(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (params?.id) {
      fetchListing();
    }
  }, [params?.id]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!item) return e;
    if (!item.images || item.images.length === 0) e["images"] = "Add at least one image (max 3)";
    if (!item.bathrooms || item.bathrooms <= 0) e["bathrooms"] = "Enter number of bathrooms";
    if (item.boardingType === "Shared room" && (!item.beds || item.beds <= 0))
      e["beds"] = "Enter number of beds";
    if (!item.price || item.price <= 0) e["price"] = "Price must be greater than zero";
    if (!/^[0-9]{9,15}$/.test(item.contact.phone)) e["phone"] = "Enter a valid phone number";
    if (item.contact.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(item.contact.email))
      e["email"] = "Enter a valid email";
    return e;
  }, [item]);

  const canSubmit = item && Object.keys(errors).length === 0;
  const showError = (k: string) => !!errors[k] && (touched[k] || hasSubmitted);

  function update<K extends keyof OwnerListing>(key: K, value: OwnerListing[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
          <section className="mx-auto max-w-3xl px-4">
            <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-gray-100 text-center">
              <p className="text-sm text-slate-500">Loading listing...</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (!item || error) {
    return (
      <>
        <Navbar />
        <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
          <section className="mx-auto max-w-3xl px-4">
            <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-gray-100">
              <p className="text-lg font-semibold text-slate-900">Listing not found</p>
              <p className="mt-2 text-sm text-slate-600">{error || "The listing you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it."}</p>
              <Link
                href="/owner-dashboard"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
              >
                Back to dashboard
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    setHasSubmitted(true);
    if (!canSubmit || !item) return;
    
    try {
      setLoading(true);
      setError("");
      
      // Convert OwnerListing back to backend format
      const updateData = {
        title: item.title,
        description: item.description,
        price: item.price,
        negotiable: item.negotiable,
        boardingType: item.boardingType,
        district: item.district,
        colomboArea: item.colomboArea,
        lat: item.lat,
        lng: item.lng,
        beds: item.beds,
        bathrooms: item.bathrooms,
        facilities: item.facilities,
        images: item.images || [],
        status: item.status,
      };
      
      // Update listing via backend API
      await fetchWithAuth(`/listings/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      
      // Trigger refresh event for boardings page
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("listings-refresh"));
      }
      
      // Redirect to dashboard on success
      router.push("/owner-dashboard");
    } catch (err: any) {
      console.error("Error updating listing:", err);
      
      // Handle image-related backend errors
      const backendError = handleBackendImageError(err);
      const errorMessage = getErrorMessage(backendError);
      setError(errorMessage);
      
      // Log technical details to console only
      if (backendError.technical) {
        console.error("Backend error details:", backendError.technical);
      }
      
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-gray-100 sm:p-8">
            <header className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Owner</p>
              <h1 className="mt-1 text-2xl font-semibold text-[#1F2937]">Edit Listing</h1>
              <p className="mt-1 text-xs text-slate-500">You can edit status and details. Name and description cannot be changed.</p>
            </header>

            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Boarding name</span>
                  <input value={item.title} disabled className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <select
                    value={item.status}
                    onChange={(e) => update("status", e.target.value as OwnerStatus)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  >
                    <option>Active</option>
                    <option>Not-active</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Description</span>
                <textarea value={item.description} disabled rows={4} className="resize-y rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900" />
              </label>
            </section>

            <hr className="my-6 border-slate-100" />

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">Images</h2>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Update up to 3 images to best represent your listing.</p>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-700">{(item.images?.length ?? 0)} / 3</span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 3 }).map((_, slot) => {
                  const src = item.images?.[slot];
                  if (src) {
                    return (
                      <div key={slot} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <Image src={src} alt={`Image ${slot + 1}`} width={400} height={128} className="h-28 w-full object-cover sm:h-32" />
                        <div className="absolute inset-0 hidden items-end justify-between bg-black/0 p-2 transition group-hover:flex group-hover:bg-black/10">
                          <label className="rounded-full bg-black/60 px-2 py-1 text-[10px] text-white shadow cursor-pointer" title="Edit">
                            Edit
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                // Clear previous error
                                setImageError(null);
                                
                                try {
                                  const dataUrl = await readImageFile(file);
                                  const base = item.images ?? [];
                                  const next = [...base];
                                  next[slot] = dataUrl;
                                  update("images", next.slice(0, 3));
                                } catch (err: any) {
                                  // Handle image upload error
                                  const uploadError: ImageUploadError = err;
                                  const errorMessage = getErrorMessage(uploadError);
                                  setImageError(errorMessage);
                                  
                                  // Log technical details to console only
                                  if (uploadError.technical) {
                                    console.error("Image upload error:", uploadError.technical);
                                  }
                                  
                                  // Reset file input
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const base = item.images ?? [];
                              const next = [...base];
                              next.splice(slot, 1);
                              update("images", next);
                            }}
                            className="rounded-full bg-black/60 px-2 py-1 text-[10px] text-white shadow"
                            title="Remove"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <label
                      key={slot}
                      className="flex h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-600 shadow-sm transition hover:border-[#FF7A00] hover:bg-slate-50 sm:h-32"
                    >
                      <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#FF7A00]/10 text-[#FF7A00]"></div>
                        <span>Click to upload</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Clear previous error
                          setImageError(null);
                          
                          try {
                            const dataUrl = await readImageFile(file);
                            const base = item.images ?? [];
                            const next = [...base];
                            next[slot] = dataUrl;
                            update("images", next.slice(0, 3));
                          } catch (err: any) {
                            // Handle image upload error
                            const uploadError: ImageUploadError = err;
                            const errorMessage = getErrorMessage(uploadError);
                            setImageError(errorMessage);
                            
                            // Log technical details to console only
                            if (uploadError.technical) {
                              console.error("Image upload error:", uploadError.technical);
                            }
                            
                            // Reset file input
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  );
                })}
              </div>
              {showError("images") ? (
                <span className="text-xs text-red-600">{errors.images}</span>
              ) : imageError ? (
                <span className="text-xs text-red-600">{imageError}</span>
              ) : (
                <span className="text-xs text-slate-500">Supported: JPG, PNG, WebP. Max 5 MB per image. Max 3 images.</span>
              )}
            </section>

            <hr className="my-6 border-slate-100" />

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">Pricing</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Monthly price (Rs.)</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={item.price}
                    onChange={(e) => update("price", Number(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, price: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  />
                  {showError("price") && <span className="text-xs text-red-600">{errors.price}</span>}
                </label>
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700 sm:self-end">
                  <input
                    type="checkbox"
                    checked={item.negotiable}
                    onChange={(e) => update("negotiable", e.target.checked)}
                    className="h-4 w-4 accent-[#FF7A00]"
                  />
                  Price negotiable
                </label>
              </div>
            </section>

            <hr className="my-6 border-slate-100" />

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">Details</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-1">
                  <span>Type</span>
                  <select
                    value={item.boardingType}
                    onChange={(e) => update("boardingType", e.target.value as OwnerListing["boardingType"])}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  >
                    <option>Single room</option>
                    <option>Shared room</option>
                    <option>Annex</option>
                    <option>Apartment</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-1">
                  <span>Bathrooms</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={item.bathrooms}
                    onChange={(e) => update("bathrooms", Number(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, bathrooms: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  />
                  {showError("bathrooms") && (
                    <span className="text-xs text-red-600">{errors.bathrooms}</span>
                  )}
                </label>
                {item.boardingType === "Shared room" && (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-1">
                    <span>Beds</span>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={item.beds ?? 1}
                      onChange={(e) => update("beds", Number(e.target.value))}
                      onBlur={() => setTouched((t) => ({ ...t, beds: true }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    />
                    {showError("beds") && <span className="text-xs text-red-600">{errors.beds}</span>}
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FACILITIES.map((f) => {
                  const checked = item.facilities.includes(f);
                  return (
                    <label key={f} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...item.facilities, f]
                            : item.facilities.filter((x) => x !== f);
                          update("facilities", next);
                        }}
                        className="h-4 w-4 accent-[#FF7A00]"
                      />
                      {f}
                    </label>
                  );
                })}
              </div>
            </section>

            <hr className="my-6 border-slate-100" />

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">Contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Phone</span>
                  <input
                    value={item.contact.phone}
                    onChange={(e) => update("contact", { ...item.contact, phone: e.target.value.replace(/[^0-9]/g, "") })}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  />
                  {showError("phone") && <span className="text-xs text-red-600">{errors.phone}</span>}
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    value={item.contact.email ?? ""}
                    onChange={(e) => update("contact", { ...item.contact, email: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  />
                  {showError("email") && <span className="text-xs text-red-600">{errors.email}</span>}
                </label>
              </div>
            </section>

            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/owner-dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#1F2937] shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-full bg-[#FF7A00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
