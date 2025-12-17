import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Terms of service</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Simple, prototype-friendly terms.</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              These terms describe how a student boarding platform like Anexlk is expected to be used while this
              project is in a demo / prototype stage.
            </p>
          </header>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
            <div>
              <h2 className="text-base font-semibold text-slate-900">No real bookings</h2>
              <p className="mt-2">
                The interface you see is for design and UX purposes only. It does not create legally binding
                reservations or agreements between students and owners.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">Fair use</h2>
              <p className="mt-2">
                You agree to use this prototype respectfully: don&apos;t attempt to attack, spam, or misuse the demo. The
                goal is to showcase what a polished boarding experience could look like.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">Content accuracy</h2>
              <p className="mt-2">
                All listings, prices, and details are mock data. They do not represent real properties or real
                agreements. Always confirm details directly with an owner in a real-world scenario.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">Changes</h2>
              <p className="mt-2">
                Because this is a personal project by Nemitha Prabashwara, things may change frequently as the design
                and code improve. The experience can be updated or taken offline at any time.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              This page is a non-legal, simplified explanation of how a prototype is intended to be used. For a real
              launch, proper legal terms should be written with professional support.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
