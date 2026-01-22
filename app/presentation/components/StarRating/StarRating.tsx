interface StarRatingProps {
  rating: number;
}

const StarRating = ({ rating }: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return (
            <span
              key={i}
              className="text-yellow-400 text-lg transform hover:scale-125 transition-transform duration-200"
            >
              ⭐
            </span>
          );
        } else if (i === fullStars && hasHalfStar) {
          return (
            <span
              key={i}
              className="text-yellow-400 text-lg transform hover:scale-125 transition-transform duration-200"
            >
              ⭐
            </span>
          );
        } else {
          return (
            <span key={i} className="text-gray-300 text-lg">
              ⭐
            </span>
          );
        }
      })}
      <span className="ml-1 text-sm font-medium text-gray-600">
        {(rating || 0).toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating;
