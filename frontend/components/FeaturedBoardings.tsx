import Image from "next/image";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { listings } from "@/lib/fakeData";

export default function FeaturedBoardings() {
  return (
    <section className="relative bg-[#F7F7F8] py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
              Featured boardings
            </h2>
            <p className="mt-3 max-w-xl text-sm text-gray-600 sm:text-base">
              A curated selection of student‑friendly places with great locations and reliable amenities.
            </p>
          </div>
          <Link
            href="/boardings"
            className="text-sm font-semibold text-[#FF7A00] hover:text-[#D05D00]"
          >
            View all listings →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, 3).map((card, index) => (
            <article
              key={card.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-transform transition-shadow hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {card.location}
                </div>
                <h3 className="text-lg font-semibold text-[#1F2937] group-hover:text-[#FF7A00]">
                  {card.title}
                </h3>
                <div className="flex items-center gap-2">
                  <StarRating rating={card.rating} size="sm" showNumber />
                  <span className="text-xs text-slate-500">({Math.floor(Math.random() * 20) + 10} reviews)</span>
                </div>
                <p className="flex-1 text-sm text-gray-600">{card.description}</p>
                <div className="mt-2 flex items-center justify-between pt-2 text-sm font-semibold text-[#1F2937]">
                  <span>{card.price} / mo</span>
                  <Link
                    href={`/boardings/${card.id}`}
                    className="text-xs font-medium text-[#FF7A00] hover:text-[#D05D00]"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
