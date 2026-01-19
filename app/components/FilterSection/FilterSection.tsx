interface FilterSectionProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const FilterSection = ({
  activeFilter,
  setActiveFilter,
}: FilterSectionProps) => {
  const filters = [
    { id: "all", label: "All Items", color: "indigo" },
    { id: "trending", label: "Trending Now", color: "rose" },
    { id: "best", label: "Best Rated", color: "amber" },
    { id: "vegetarian", label: "Vegetarian", color: "emerald" },
    { id: "vegan", label: "Vegan", color: "green" },
  ];

  return (
    <div
      className="flex flex-wrap gap-3 mb-6 animate-fade-in-up"
      style={{ animationDelay: "0.1s" }}
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setActiveFilter(filter.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeFilter === filter.id
              ? `bg-${filter.color}-600 text-white shadow-md`
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FilterSection;
