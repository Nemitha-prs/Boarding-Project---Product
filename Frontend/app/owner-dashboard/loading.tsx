export default function Loading() {
  return (
    <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-6 w-1/3 rounded bg-slate-200" />
              <div className="mt-2 h-8 w-1/4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-1/4 rounded bg-slate-200" />
          <div className="mt-4 h-10 w-full rounded-2xl bg-slate-200" />
          <div className="mt-3 h-10 w-full rounded-2xl bg-slate-200" />
          <div className="mt-3 h-10 w-full rounded-2xl bg-slate-200" />
        </div>
      </section>
    </main>
  );
}
