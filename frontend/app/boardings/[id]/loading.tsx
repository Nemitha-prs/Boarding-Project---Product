export default function Loading() {
  return (
    <main className="bg-[#F7F7F8] min-h-screen pt-28 pb-16">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="h-64 bg-slate-200" />
          <div className="space-y-4 p-6">
            <div className="h-6 w-1/3 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-10 rounded-2xl bg-slate-200" />
              <div className="h-10 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
