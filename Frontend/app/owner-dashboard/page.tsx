"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getViews } from "@/utils/views";
import { getPendingApprovalsForListing } from "@/utils/pendingApprovals";
import { fetchWithAuth, getApiUrl, setToken, isAuthenticated } from "@/lib/auth";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/jwt";
import { stringIdToNumeric } from "@/utils/idConverter";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

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
  pendingApprovals?: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "not-active">("all");
  const [ownerListings, setOwnerListings] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState([
    { label: "Active listings", value: 0, icon: Home },
    { label: "Total views", value: 0, icon: Eye },
    { label: "Pending approvals", value: 0, icon: Home },
  ]);

  // Handle token from redirect
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      // Remove token from URL
      router.replace("/owner-dashboard");
    }
  }, [searchParams, router]);

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

  // Fetch owner's listings from backend
  useEffect(() => {
    async function fetchOwnerListings() {
      try {
        setLoading(true);
        const ownerId = getCurrentUserId();
        if (!ownerId) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        // Fetch only owner's listings using query parameter for better performance
        const response = await fetch(getApiUrl(`/listings?ownerId=${ownerId}`));
        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }
        const myListings: DbListing[] = await response.json();
        setOwnerListings(myListings);
        setError("");
      } catch (err: any) {
        console.error("Error fetching owner listings:", err);
        setError(err.message || "Failed to load listings");
        setOwnerListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOwnerListings();
  }, []);

  // Compute stats whenever ownerListings changes
  useEffect(() => {
    const activeCount = ownerListings.filter((l) => l.status === "Active").length;
    // Calculate total views by converting string IDs to numeric and summing views
    const totalViews = ownerListings.reduce((sum, listing) => {
      const numericId = stringIdToNumeric(listing.id);
      return sum + getViews(numericId);
    }, 0);
    // Pending approvals: sum per-listing pending counts from database
    const pendingApprovals = ownerListings.reduce((sum, listing) => {
      return sum + getPendingApprovalsForListing(listing);
    }, 0);
    setStats((prev) => [
      { ...prev[0], value: activeCount },
      { ...prev[1], value: totalViews },
      { ...prev[2], value: pendingApprovals },
    ]);
  }, [ownerListings]);

  const filtered = useMemo(() => {
    if (selectedStatus === "all") return ownerListings;
    if (selectedStatus === "active") return ownerListings.filter((l) => l.status === "Active");
    return ownerListings.filter((l) => l.status !== "Active");
  }, [ownerListings, selectedStatus]);

  async function deleteOwner(id: string) {
    setIsDeleting(true);
    try {
      // Permanently delete listing from backend
      await fetchWithAuth(`/listings/${id}`, {
        method: "DELETE",
      });
      // Remove from local state so it disappears immediately
      setOwnerListings((prev) => prev.filter((x) => x.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Error deleting listing:", err);
      alert(err.message || "Failed to delete listing. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const listingToDelete = deleteConfirmId
    ? ownerListings.find((l) => l.id === deleteConfirmId)
    : null;

  const formatPrice = (n: number) => `Rs. ${n.toLocaleString("en-LK")} / mo`;

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Owner dashboard</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Manage your boardings in one place.</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Manage your boarding listings, track views, and update availability status.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => {
              const Icon: any = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Your listings</h2>
                <p className="text-xs text-slate-500">Local preview of your listings with basic actions.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("all")}
                    className={`rounded-full px-3 py-1 ${selectedStatus === "all" ? "bg-white text-slate-900 shadow-sm" : ""}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("active")}
                    className={`rounded-full px-3 py-1 ${selectedStatus === "active" ? "bg-white text-slate-900 shadow-sm" : ""}`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("not-active")}
                    className={`rounded-full px-3 py-1 ${selectedStatus === "not-active" ? "bg-white text-slate-900 shadow-sm" : ""}`}
                  >
                    Not-active
                  </button>
                </div>

                <Link
                  href="/owner-dashboard/new"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  Add new listing
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <p className="text-sm font-medium text-slate-600">Loading listings...</p>
              </div>
            ) : error ? (
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
                <p className="text-sm font-medium text-red-700">Error loading listings</p>
                <p className="mt-2 text-xs text-red-500">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <p className="text-sm font-medium text-slate-600">No listings yet</p>
                <p className="mt-2 text-xs text-slate-500">
                  Get started by creating your first boarding listing.
                </p>
                <Link
                  href="/owner-dashboard/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  Create your first listing
                </Link>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Listing</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Views</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Last updated</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filtered.map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">ID: {listing.id.slice(0, 8)}</p>
                          <p className="text-sm font-medium text-slate-900">{listing.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-900">{formatPrice(listing.price)}</td>
                      <td className="px-5 py-4 text-sm text-slate-900">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                          {getViews(stringIdToNumeric(listing.id))}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${
                            listing.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(listing.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/boardings/${stringIdToNumeric(listing.id)}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/owner-dashboard/edit/${listing.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(listing.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      {listingToDelete && (
        <DeleteConfirmModal
          isOpen={deleteConfirmId !== null}
          listingTitle={listingToDelete.title}
          onConfirm={() => deleteOwner(deleteConfirmId!)}
          onCancel={() => setDeleteConfirmId(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
