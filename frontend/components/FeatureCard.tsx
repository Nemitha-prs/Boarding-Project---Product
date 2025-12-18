import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  animationDelay: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  animationDelay,
}: FeatureCardProps) {
  return (
    <div
      className="animate-staggered-fade-in group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay }}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-accent/5 transition-transform duration-500 group-hover:scale-150" />
      
      <div className="relative">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-background text-brand-accent shadow-sm transition-colors group-hover:bg-brand-accent group-hover:text-white">
          <Icon size={28} />
        </div>
        <h3 className="mb-3 text-xl font-bold text-gray-900">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}