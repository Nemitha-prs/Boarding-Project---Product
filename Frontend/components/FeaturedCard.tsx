"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { scaleOnHover } from "@/utils/animations";
import { BoardingListing } from "@/lib/fakeData";

export default function FeaturedCard({ listing }: { listing: BoardingListing }) {
  return (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={scaleOnHover}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-premium transition-shadow duration-300 h-full"
    >
      <Link href={`/boardings/${listing.id}`} className="flex flex-col h-full">
        {/* Image Container */}
        <div className="relative h-60 w-full overflow-hidden bg-gray-200">
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Price Badge */}
          <div className="absolute bottom-4 left-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-brand-text backdrop-blur-sm shadow-sm">
              {listing.price}<span className="text-xs font-normal text-gray-500">/mo</span>
            </span>
          </div>

          {/* Room Type Badge */}
          <div className="absolute top-4 right-4">
             <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                {listing.roomType}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-brand-accent" />
              {listing.distance}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              {listing.rating}
            </div>
          </div>

          <h3 className="mb-2 text-xl font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">
            {listing.title}
          </h3>
          
          <p className="mb-4 text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
          
          {/* Facilities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {listing.facilities.slice(0, 2).map((fac, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    {fac}
                </span>
            ))}
            {listing.facilities.length > 2 && (
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    +{listing.facilities.length - 2}
                </span>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-brand-accent font-semibold text-sm">
            <span>View Details</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
