export default function Loading() {
  return (
    <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-40 w-full rounded-2xl bg-slate-200" />
              <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-4 h-8 w-24 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
