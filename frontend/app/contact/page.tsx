import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Contact support</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">We&apos;re here to help.</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Have questions about a listing, ideas to improve the experience, or found something that looks off?
              Reach out and we&apos;ll get back to you as soon as we can.
            </p>
          </header>

          <section className="grid gap-6 md:grid-cols-[3fr,2fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                For inquiries, please use the contact information provided in the sidebar or reach out directly via email or phone.
              </p>
            </div>

            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
              <h2 className="text-base font-semibold text-slate-900">Direct contact</h2>
              <p>You can also reach Nemitha directly using the details below.</p>
              <ul className="space-y-2 text-sm">
                <li><span className="font-medium">Name:</span> Nemitha Prabashwara</li>
                <li><span className="font-medium">Phone:</span> {/* TODO: add your real phone number here */} +94 77 98 98 273</li>
                <li><span className="font-medium">Email:</span> {/* TODO: add your real email here */} nemithaprs@gmail.com</li>
              </ul>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
