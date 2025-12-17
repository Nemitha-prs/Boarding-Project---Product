"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/jwt";

type FormData = {
  basic: {
    name: string;
    description: string;
  };
  images: string[]; // data URLs, max 3
  location: {
    district: string;
    colomboArea: string | null;
    lat: number | null;
    lng: number | null;
  };
  boardingType: "Single room" | "Shared room" | "Annex" | "Apartment" | "";
  beds: number | null; // required if Shared room
  bathrooms: number | null; // required
  facilities: string[];
  price: number | null; // required > 0
  negotiable: boolean;
  contact: {
    name: string;
    phone: string; // required, numeric, length >= 9
    email: string;
  };
};

const DISTRICTS = [
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

const COLOMBO_AREAS = [
  "Fort", // 01
  "Slave Island", // 02
  "Kollupitiya", // 03
  "Bambalapitiya", // 04
  "Havelock Town", // 05
  "Wellawatte", // 06
  "Cinnamon Gardens", // 07
  "Borella", // 08
  "Dematagoda", // 09
  "Maradana", // 10
  "Pettah", // 11
  "Hulftsdorp", // 12
  "Kotahena", // 13
  "Grandpass", // 14
  "Mutwal", // 15
  "Dehiwala",
  "Mount Lavinia",
  "Nugegoda",
  "Maharagama",
];

const FACILITIES = [
  "CCTV",
  "Locked gates",
  "Air conditioning (A/C)",
  "Hot water shower",
  "Furniture",
  "Kitchen equipment",
  "Refrigerator",
];

export default function AddNewListingPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState<null | FormData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    basic: { name: "", description: "" },
    images: [],
    location: { district: "", colomboArea: null, lat: null, lng: null },
    boardingType: "",
    beds: null,
    bathrooms: null,
    facilities: [],
    price: null,
    negotiable: false,
    contact: { name: "", phone: "", email: "" },
  });
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

  const isColombo = form.location.district === "Colombo";
  const isShared = form.boardingType === "Shared room";

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setBasic<K extends keyof FormData["basic"]>(key: K, value: FormData["basic"][K]) {
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, [key]: value } }));
  }

  function setLocation<K extends keyof FormData["location"]>(
    key: K,
    value: FormData["location"][K]
  ) {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, [key]: value },
    }));
  }

  function setContact<K extends keyof FormData["contact"]>(
    key: K,
    value: FormData["contact"][K]
  ) {
    setForm((prev) => ({
      ...prev,
      contact: { ...prev.contact, [key]: value },
    }));
  }

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.basic.name.trim()) e["name"] = "Boarding name is required";
    if (!form.basic.description.trim()) e["description"] = "Description is required";
    if (form.images.length === 0) e["images"] = "Please add at least one image (max 3)";
    if (!form.location.district) e["district"] = "District is required";
    if (isColombo && !form.location.colomboArea)
      e["colomboArea"] = "Area is required for Colombo";
    if (form.location.lat === null || form.location.lng === null)
      e["map"] = "Please mark the location on the map";
    if (!form.boardingType) e["boardingType"] = "Select a boarding type";
    if (isShared && (!form.beds || form.beds <= 0)) e["beds"] = "Enter number of beds";
    if (!form.bathrooms || form.bathrooms <= 0)
      e["bathrooms"] = "Enter number of bathrooms";
    if (!form.price || form.price <= 0) e["price"] = "Price must be greater than zero";
    if (!/^[0-9]{9,15}$/.test(form.contact.phone))
      e["phone"] = "Enter a valid phone number";
    if (form.contact.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.contact.email))
      e["email"] = "Enter a valid email";
    return e;
  }, [form, isColombo, isShared]);

  const canSubmit = Object.keys(errors).length === 0;

  const showError = (key: string) => !!errors[key] && (touched[key] || hasSubmitted);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSubmitted(true);
    if (!canSubmit) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Convert form data to backend API format
      const listingData = {
        title: form.basic.name,
        description: form.basic.description,
        price: form.price!,
        negotiable: form.negotiable,
        boardingType: form.boardingType,
        district: form.location.district,
        colomboArea: form.location.colomboArea || null,
        lat: form.location.lat,
        lng: form.location.lng,
        beds: form.beds,
        bathrooms: form.bathrooms!,
        facilities: form.facilities,
        images: form.images, // Array of image data URLs (first one is cover)
        status: "Active" as const,
      };
      
      // Save to backend database
      const savedListing = await fetchWithAuth<{ id: string }>("/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData),
      });
      
      console.log("Listing saved:", savedListing);
      
      // Trigger refresh event for boardings page
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("listings-refresh"));
      }
      
      // Show confirmation and redirect after a short delay
      const payload: FormData = JSON.parse(JSON.stringify(form));
      setSubmitted(payload);
      
      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/owner-dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Error saving listing:", err);
      setError(err.message || "Failed to save listing. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSubmitted(null);
    setForm({
      basic: { name: "", description: "" },
      images: [],
      location: { district: "", colomboArea: null, lat: null, lng: null },
      boardingType: "",
      beds: null,
      bathrooms: null,
      facilities: [],
      price: null,
      negotiable: false,
      contact: { name: "", phone: "", email: "" },
    });
    setTouched({});
    setHasSubmitted(false);
  }

  // Map click handler (UI-only). Convert click to a rough lat/lng within Sri Lanka bounds
  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nx = Math.min(Math.max(x / rect.width, 0), 1);
    const ny = Math.min(Math.max(y / rect.height, 0), 1);
    // Sri Lanka rough bounds: lat 5.9..9.9, lng 79.6..81.9
    const lat = 5.9 + (1 - ny) * (9.9 - 5.9);
    const lng = 79.6 + nx * (81.9 - 79.6);
    setLocation("lat", Number(lat.toFixed(5)));
    setLocation("lng", Number(lng.toFixed(5)));
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
          <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto rounded-3xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
              <h1 className="text-2xl font-semibold text-[#1F2937]">Listing submitted successfully!</h1>
              <p className="mt-2 text-sm text-slate-600">
                Your listing has been saved to the database and is now visible on the public boardings page. You will be redirected to your dashboard shortly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/owner-dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Back to dashboard
                </Link>
                <button
                  onClick={() => {
                    resetForm();
                    // Refresh the page to show the new listing
                    window.location.href = "/owner-dashboard";
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#1F2937] shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
                >
                  View dashboard
                </button>
              </div>
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
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="mx-auto rounded-3xl bg-white p-6 shadow-lg ring-1 ring-gray-100 sm:p-8"
          >
            <header className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Owner
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#1F2937]">Add New Listing</h1>
              <p className="mt-1 text-xs text-slate-500">
                Fill out the details below. Fields marked required must be completed.
              </p>
            </header>

            {/* Basic Info */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">Basic Information</h2>
              <div className="grid gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Boarding name <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.basic.name}
                    onChange={(e) => setBasic("name", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="e.g., Sunrise Student Annex"
                  />
                  {showError("name") && (
                    <span className="text-xs text-red-600">{errors.name}</span>
                  )}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Boarding description <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    value={form.basic.description}
                    onChange={(e) => setBasic("description", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                    rows={4}
                    maxLength={1200}
                    className="resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="Describe your boarding (amenities, nearby places, rules, etc.)"
                  />
                  {showError("description") && (
                    <span className="text-xs text-red-600">{errors.description}</span>
                  )}
                </label>

                {/* Images (up to 3, professional layout) */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F2937]">Images</h3>
                      <p className="text-xs text-slate-500">Add clear, well-lit photos. Match the style of your listing.</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-700">
                      {form.images.length} / 3
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {Array.from({ length: 3 }).map((_, slot) => {
                      const src = form.images[slot];
                      if (src) {
                        return (
                          <div key={slot} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            <img src={src} alt={`Image ${slot + 1}`} className="h-28 w-full object-cover sm:h-32" />
                            <div className="absolute inset-0 hidden items-end justify-end bg-black/0 p-2 transition group-hover:flex group-hover:bg-black/10">
                              <button
                                type="button"
                                onClick={() => set("images", form.images.filter((_, i) => i !== slot))}
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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const url = String(reader.result || "");
                                const next = [...form.images];
                                next[slot] = url;
                                set("images", next.slice(0, 3));
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    {showError("images") ? (
                      <span className="text-xs text-red-600">{errors.images}</span>
                    ) : (
                      <span className="text-xs text-slate-500">Supported: JPG, PNG. Max 3 images.</span>
                    )}
                  </div>
                </section>
              </div>
            </section>

            {/* 1. Location Details */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">1. Location Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    District <span className="text-red-500">*</span>
                  </span>
                  <select
                    value={form.location.district}
                    onChange={(e) => {
                      const d = e.target.value;
                      setLocation("district", d);
                      setLocation("colomboArea", d === "Colombo" ? form.location.colomboArea : null);
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, district: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  >
                    <option value="">Select district</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {showError("district") && (
                    <span className="text-xs text-red-600">{errors.district}</span>
                  )}
                </label>

                {isColombo && (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 transition-all">
                    <span>
                      Area in Colombo <span className="text-red-500">*</span>
                    </span>
                    <select
                      value={form.location.colomboArea ?? ""}
                      onChange={(e) => setLocation("colomboArea", e.target.value || null)}
                      onBlur={() => setTouched((t) => ({ ...t, colomboArea: true }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    >
                      <option value="">Select area</option>
                      {COLOMBO_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    {showError("colomboArea") && (
                      <span className="text-xs text-red-600">{errors.colomboArea}</span>
                    )}
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Map location <span className="text-red-500">*</span></p>
                <div
                  onClick={onMapClick}
                  className="relative h-56 w-full cursor-crosshair overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner"
                  aria-label="Map selector (UI-only)"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      // simulate center click
                      const target = e.currentTarget as HTMLDivElement;
                      const rect = target.getBoundingClientRect();
                      const fakeEvent = {
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2,
                        target,
                      } as unknown as React.MouseEvent<HTMLDivElement>;
                      onMapClick(fakeEvent);
                    }
                  }}
                >
                  {form.location.lat !== null && form.location.lng !== null && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{}}
                    >
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FF7A00] shadow"
                        style={{
                          left: `${50 + ((form.location.lng - 79.6) / (81.9 - 79.6)) * 100 - 50}%`,
                          top: `${50 - ((form.location.lat - 5.9) / (9.9 - 5.9)) * 100}%`,
                          width: 14,
                          height: 14,
                        }}
                        aria-hidden
                      />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-700 shadow">
                    Click to set approximate location
                  </span>
                </div>
                {showError("map") && <span className="text-xs text-red-600">{errors.map}</span>}
                {form.location.lat !== null && form.location.lng !== null && (
                  <p className="text-xs text-slate-600">
                    Selected: lat {form.location.lat}, lng {form.location.lng}
                  </p>
                )}
              </div>
            </section>

            <hr className="my-6 border-slate-100" />

            {/* 2. Boarding Type */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">2. Boarding Type</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Type <span className="text-red-500">*</span>
                  </span>
                  <select
                    value={form.boardingType}
                    onChange={(e) => set("boardingType", e.target.value as FormData["boardingType"])}
                    onBlur={() => setTouched((t) => ({ ...t, boardingType: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                  >
                    <option value="">Select type</option>
                    <option>Single room</option>
                    <option>Shared room</option>
                    <option>Annex</option>
                    <option>Apartment</option>
                  </select>
                  {showError("boardingType") && (
                    <span className="text-xs text-red-600">{errors.boardingType}</span>
                  )}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Bathrooms <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.bathrooms ?? ""}
                    onChange={(e) => set("bathrooms", e.target.value ? Number(e.target.value) : null)}
                    onBlur={() => setTouched((t) => ({ ...t, bathrooms: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="e.g., 1"
                  />
                  {showError("bathrooms") && (
                    <span className="text-xs text-red-600">{errors.bathrooms}</span>
                  )}
                </label>
              </div>

              {isShared && (
                <div className="transition-all">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>
                      Number of beds <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={form.beds ?? ""}
                      onChange={(e) => set("beds", e.target.value ? Number(e.target.value) : null)}
                      onBlur={() => setTouched((t) => ({ ...t, beds: true }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                      placeholder="e.g., 2"
                    />
                    {showError("beds") && <span className="text-xs text-red-600">{errors.beds}</span>}
                  </label>
                </div>
              )}
            </section>

            <hr className="my-6 border-slate-100" />

            {/* 3. Facilities & Safety */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">3. Facilities & Safety Features</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FACILITIES.map((f) => {
                  const checked = form.facilities.includes(f);
                  return (
                    <label key={f} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          set("facilities", e.target.checked
                            ? [...form.facilities, f]
                            : form.facilities.filter((x) => x !== f));
                        }}
                        className="h-4 w-4 accent-[#FF7A00]"
                      />
                      {f}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                These will be displayed on the listing details page for students.
              </p>
            </section>

            <hr className="my-6 border-slate-100" />

            {/* 4. Pricing */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">4. Pricing</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Monthly price (Rs.) <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={form.price ?? ""}
                    onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)}
                    onBlur={() => setTouched((t) => ({ ...t, price: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="e.g., 15000"
                  />
                  <span className="min-h-[16px] text-xs text-red-600">
                    {showError("price") ? errors.price : ""}
                  </span>
                </label>

                <div className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:self-center sm:translate-y-1.5">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.negotiable}
                      onChange={(e) => set("negotiable", e.target.checked)}
                      className="h-4 w-4 accent-[#FF7A00]"
                    />
                    Price negotiable
                  </label>
                  <span className="min-h-[16px] text-xs">&nbsp;</span>
                </div>
              </div>
            </section>

            <hr className="my-6 border-slate-100" />

            {/* 5. Owner Contact Details */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1F2937]">5. Owner Contact Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Contact name
                  <input
                    type="text"
                    value={form.contact.name}
                    onChange={(e) => setContact("name", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, contactName: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="e.g., Mr. Silva"
                  />
                  <span className="min-h-[16px] text-xs">&nbsp;</span>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Phone number <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.contact.phone}
                    onChange={(e) => setContact("phone", e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="e.g., 0771234567"
                  />
                  <span className="min-h-[16px] text-xs text-red-600">
                    {showError("phone") ? errors.phone : ""}
                  </span>
                </label>

                <label className="sm:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Email (optional)
                  <input
                    type="email"
                    value={form.contact.email}
                    onChange={(e) => setContact("email", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#FF7A00] focus:bg-white focus:outline-none"
                    placeholder="e.g., name@example.com"
                  />
                  <span className="min-h-[16px] text-xs text-red-600">
                    {showError("email") ? errors.email : ""}
                  </span>
                </label>
              </div>
            </section>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-center text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
            
            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/owner-dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#1F2937] shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="inline-flex items-center justify-center rounded-full bg-[#FF7A00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Submit listing"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
