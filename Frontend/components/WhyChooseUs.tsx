import { CheckCircle2 } from "lucide-react";

const whyChooseBenefits = [
  "Built specifically for Sri Lankan students and universities",
  "Clean, focused interface that works beautifully on any device",
  "Transparent information so you can compare places with confidence",
  "A simple way for owners and students to stay in sync",
];

export default function WhyChooseUs() {
  return (
    <section className="relative py-20">
      {/* Map background layer */}
      <div className="absolute inset-0 z-0">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/map.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="animate-staggered-fade-in rounded-3xl bg-[#F7F7F7]/95 p-8 shadow-xl shadow-gray-900/10 backdrop-blur-sm transition-transform duration-500 ease-out hover:-translate-y-1 sm:p-10">
          <h2 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
            Why students choose Anexlk
          </h2>
          <p className="mt-5 text-sm text-gray-700 sm:text-base">
            Finding a good boarding place shouldn't feel risky or confusing.
            Anexlk focuses on clarity, trust, and the details that actually
            matter when you're living away from home.
          </p>

          <ul className="mt-8 space-y-4">
            {whyChooseBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#FF7A00]" />
                <span className="text-sm font-medium text-[#1F2937] sm:text-base">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
