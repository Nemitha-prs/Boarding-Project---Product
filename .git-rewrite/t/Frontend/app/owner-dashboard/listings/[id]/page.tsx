"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWithAuth, getApiUrl } from "@/lib/auth";
import { getCurrentUserId } from "@/lib/jwt";

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
  updatedAt: string;
  ownerId: string;
}

export default function OwnerListingPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<DbListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        setError("");
        const ownerId = getCurrentUserId();
        
        if (!ownerId) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        // Fetch the specific listing from backend
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

        const listing: DbListing = await response.json();
        
        // Verify the listing belongs to the current owner
        if (listing.ownerId !== ownerId) {
          setError("You don't have permission to view this listing");
          setItem(null);
        } else {
          setItem(listing);
        }
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message || "Failed to load listing");
        setItem(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchListing();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
          <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
          <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-gray-100">
              <p className="text-lg font-semibold text-slate-900">Listing not found</p>
              <p className="mt-2 text-sm text-slate-600">{error || "The listing you're looking for doesn't exist or you don't have permission to view it."}</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-white/80 px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{item.id}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1F2937] sm:text-3xl">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">Status: {item.status}</p>
            </div>
            <div className="grid gap-6 border-t border-gray-100 bg-white/90 p-6 md:grid-cols-[2fr,1fr] md:p-8">
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900">Description</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.description || "No description."}</p>
                <h3 className="text-base font-semibold text-slate-900">Facilities</h3>
                {item.facilities && item.facilities.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-2">
                    {item.facilities.map((f) => (
                      <li key={f} className="rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-700">
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No facilities listed.</p>
                )}
              </div>
              <aside className="space-y-2 rounded-2xl border border-gray-100 bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Monthly</p>
                <p className="text-3xl font-semibold text-slate-900">Rs. {item.price.toLocaleString("en-LK")}</p>
                {item.negotiable && <p className="text-xs text-slate-500">Price negotiable</p>}
                <div className="mt-4 text-sm text-slate-700">
                  <p>Type: {item.boardingType}</p>
                  <p>Bathrooms: {item.bathrooms}</p>
                  {item.boardingType === "Shared room" && typeof item.beds === "number" && (
                    <p>Beds: {item.beds}</p>
                  )}
                </div>
              </aside>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
