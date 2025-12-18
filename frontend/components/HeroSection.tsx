"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/jwt";

export default function HeroSection() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "owner" | null>(null);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUserRole(getCurrentUserRole());
    
    // Listen for storage changes
    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
      setUserRole(getCurrentUserRole());
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Check periodically for auth changes
    const interval = setInterval(() => {
      setAuthenticated(isAuthenticated());
      setUserRole(getCurrentUserRole());
    }, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Only show "List Your Property" button if not authenticated or authenticated as owner
  const showListPropertyButton = !authenticated || userRole === "owner";
  return (
    <section
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
    >
      {/* Soft overlay for readability */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />

      {/* Soft accent shapes (kept subtle and away from logo) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-24 -left-24 h-[360px] w-[360px] rounded-full bg-[#FF7A00]/12 blur-3xl animate-[floatUp_14s_ease-in-out_infinite]" />
        <div className="absolute -bottom-16 -right-24 h-[260px] w-[260px] rounded-full bg-[#D05D00]/12 blur-3xl animate-[floatDown_16s_ease-in-out_infinite]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="space-y-8 animate-[fadeIn_0.8s_ease-out_forwards] opacity-0">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1F2937] sm:text-5xl md:text-6xl">
            Find your <span className="text-[#FF7A00]">perfect</span> place to stay.
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Discover verified boarding options near your university – safe, modern, and
            designed for the way students actually live and study.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 animate-[fadeIn_1.1s_ease-out_forwards]">
            <Link
              href="/boardings"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1F2937] px-8 text-sm font-semibold text-white shadow-md transition-transform transition-colors hover:scale-[1.02] hover:bg-black"
            >
              <Search className="h-4 w-4" />
              Start Searching
              <ArrowRight className="h-4 w-4" />
            </Link>

            {showListPropertyButton && (
              <Link
                href="/owner-dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/80 px-8 text-sm font-semibold text-[#1F2937] shadow-sm transition-transform transition-colors hover:scale-[1.02] hover:border-[#FF7A00] hover:text-[#FF7A00]"
              >
                <ShieldCheck className="h-4 w-4" />
                List Your Property
              </Link>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-500 sm:text-sm">
            <span>500+ Listings</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>15+ Universities</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>2k+ Students</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>10+ Cities</span>
          </div>
        </div>
      </div>

      {/* Local keyframes for subtle animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -18px, 0); }
        }
        @keyframes floatDown {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, 16px, 0); }
        }
      `}</style>
    </section>
  );
}
