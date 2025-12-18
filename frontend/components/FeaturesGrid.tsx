import { Zap, ShieldCheck, SlidersHorizontal, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Smart search",
    description:
      "Filter by distance, budget, and amenities to quickly find options that fit your life.",
  },
  {
    icon: ShieldCheck,
    title: "Verified places",
    description:
      "We highlight listings with transparent details so you know exactly what to expect.",
  },
  {
    icon: SlidersHorizontal,
    title: "Student‑first filters",
    description:
      "See commute times, Wi‑Fi availability, and room types tailored specifically for students.",
  },
  {
    icon: LayoutDashboard,
    title: "Owner tools",
    description:
      "Owners manage inquiries and availability from a single, simple dashboard.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
            Everything you need in one place
          </h2>
          <p className="mt-4 text-sm text-gray-600 sm:text-base">
            From discovery to move‑in, Anexlk gives students and owners a clear,
            streamlined way to manage boarding spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-[#F7F7F8] p-6 transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#FF7A00] shadow-sm ring-1 ring-gray-100 group-hover:bg-[#FF7A00] group-hover:text-white">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2937] sm:text-lg">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
