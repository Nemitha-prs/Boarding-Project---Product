export default function NotFound() {
  return (
    <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16">
      <section className="mx-auto max-w-2xl px-4 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Not found</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">This page could not be found.</h1>
          <p className="mt-2 text-sm text-slate-600">Check the URL or go back to the previous page.</p>
        </div>
      </section>
    </main>
  );
}
