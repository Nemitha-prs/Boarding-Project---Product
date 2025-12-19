interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "md",
  showNumber = false,
  className = ""
}: StarRatingProps) {
  const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className={`${sizeClasses[size]} text-yellow-400`}>
            ★
          </span>
        ))}
        {hasHalfStar && (
          <span className={`${sizeClasses[size]} text-yellow-400`} style={{ opacity: 0.5 }}>
            ★
          </span>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300`}>
            ★
          </span>
        ))}
      </div>
      {showNumber && (
        <span className={`ml-1 font-medium text-slate-600 ${size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm"}`}>
          {roundedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}



