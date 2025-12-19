import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Privacy policy</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">How we think about your data.</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              This page is a simple, non-legal explanation of how a student-focused boarding platform like Anexlk would
              treat basic information.
            </p>
          </header>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
            <div>
              <h2 className="text-base font-semibold text-slate-900">What this product does today</h2>
              <p className="mt-2">
                Right now, this project is a front-end UI prototype built by Nemitha Prabashwara (age 19). It does not
                store, sync, or share real user data.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">Information you might share</h2>
              <p className="mt-2">
                In a real deployment, you might share basic details such as your name, email address, preferred
                locations, and favourite listings. Those details would be used only to help you discover and manage
                boardings more easily.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">Third parties</h2>
              <p className="mt-2">
                This demo does not integrate with external analytics or advertising networks. If such tools were added
                in the future, they would be documented clearly with options to opt out wherever possible.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">Your control</h2>
              <p className="mt-2">
                A real version of Anexlk would allow you to update or delete your information, manage notification
                preferences, and close your account if you no longer want to use the service.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              This text is for demonstration only and is not legal advice. For a production product, you should work with
              a legal professional to draft a full privacy policy tailored to your region and use case.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
