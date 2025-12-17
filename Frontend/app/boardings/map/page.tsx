import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapView from "@/components/MapView";
import { listings } from "@/lib/fakeData";
import Link from "next/link";

export default function BoardingsMapPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <section className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
          <header className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Explore
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
                  Map of boardings near you
                </h1>
              </div>
              <Link
                href="/boardings"
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-gray-300 bg-white/80 px-5 py-2 text-xs font-semibold text-[#1F2937] shadow-sm transition-transform transition-colors hover:scale-[1.02] hover:border-[#FF7A00] hover:text-[#FF7A00] sm:text-sm"
              >
                Back to list
              </Link>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              View all nearby boardings on a single map. This map preview is powered by placeholder content and can later be wired up to a real map provider.
            </p>
          </header>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
            <MapView listings={listings} />
          </div>

          <div className="sm:hidden">
            <Link
              href="/boardings"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#1F2937] shadow-sm transition-colors hover:border-[#FF7A00] hover:text-[#FF7A00]"
            >
              Back to list view
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
