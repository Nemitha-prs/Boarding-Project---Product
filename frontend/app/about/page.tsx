import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Mail, MapPin, Phone, User } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">About</p>
            <h1 className="text-3xl font-semibold text-[#1F2937] sm:text-4xl max-w-3xl">
              The person behind Anexlk.
            </h1>
          </header>

          <section className="grid gap-10 md:grid-cols-2 items-start">
            {/* Left: About Me card */}
            <div className="rounded-3xl bg-white/95 shadow-lg shadow-black/5 border border-slate-100 p-6 sm:p-8 space-y-6 opacity-0 animate-[fadeIn_0.7s_ease-out_forwards]">
              <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-center md:gap-6 gap-4">
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden">
                  <Image
                    src="/images/profile.png"
                    alt="Nemitha Prabashwara"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-[#1F2937]">Nemitha Prabashwara</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F7F7] px-3 py-1 font-medium">
                      <User className="h-3 w-3 text-[#FF7A00]" />
                      <span>Age 19</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F7F7] px-3 py-1 font-medium">
                      <MapPin className="h-3 w-3 text-[#FF7A00]" />
                      <span>Matara, Sri Lanka</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-700 max-w-xl">
                I&apos;m a Computer Science student who built Anexlk out of real boarding search struggles
                — trying to find a safe, clear option while juggling lectures and travel. I care about
                calm, thoughtful interfaces, trust between students and owners, and solving small
                problems that make the experience feel a bit lighter.
              </p>
            </div>

            {/* Right: Mission, Vision, Contact cards */}
            <div className="space-y-5 opacity-0 animate-[fadeIn_0.85s_ease-out_forwards]">
              <div className="rounded-3xl bg-white shadow-md shadow-black/5 border border-slate-100 p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  <span>Mission</span>
                </div>
                <p className="text-sm leading-relaxed text-[#1F2937]">
                  To design a boarding experience that feels clear and human for students — focused on
                  the essentials, gentle to navigate, and honest about what you&apos;re signing up for.
                </p>
              </div>

              <div className="rounded-3xl bg-white shadow-md shadow-black/5 border border-slate-100 p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  <span>Vision</span>
                </div>
                <p className="text-sm leading-relaxed text-[#1F2937]">
                  To quietly raise the bar for how students in Sri Lanka discover boardings — more
                  transparent, less stressful, and supported by tools that respect both students and
                  owners.
                </p>
              </div>

              <div className="rounded-3xl bg-white shadow-md shadow-black/5 border border-slate-100 p-5 sm:p-6 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Contact
                </div>
                <div className="flex flex-col gap-3 text-sm text-[#1F2937]">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#FF7A00]" />
                    <span className="text-xs uppercase tracking-wide text-slate-500">Phone</span>
                    <span className="ml-1 font-medium">+94 77 98 98 273</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#FF7A00]" />
                    <span className="text-xs uppercase tracking-wide text-slate-500">Email</span>
                    <span className="ml-1 font-medium">nemithaprs@gmail.com</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
