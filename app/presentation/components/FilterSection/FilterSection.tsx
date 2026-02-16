interface FilterSectionProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

/**
 * FilterSection – Renders a set of filter buttons for menu items.
 *
 * This component provides a visual and interactive way to switch between
 * different item categories. The active filter is highlighted with a
 * color-coded background, and clicking a button updates the active filter
 * in the parent component.
 */
const FilterSection = ({
  activeFilter,
  setActiveFilter,
}: FilterSectionProps) => {
  // Define available filters: each has an id (used for matching and callback),
  // a user-facing label, and a Tailwind color name for dynamic styling.
  // Note: The `color` property is used to construct Tailwind class names dynamically,
  // which can be problematic if Tailwind's purge/content scanning doesn't detect these
  // strings. In a production setup, you might need to ensure these colors are safelisted
  // or use a different approach (e.g., mapping to static classes).
  const filters = [
    { id: "all", label: "All Items", color: "indigo" },
    { id: "trending", label: "Trending Now", color: "rose" },
    { id: "best", label: "Best Rated", color: "amber" },
    { id: "vegetarian", label: "Vegetarian", color: "emerald" },
    { id: "vegan", label: "Vegan", color: "green" },
  ];

  return (
    // Container with fade-in-up animation, delayed by 0.1s for a staggered effect.
    // Flexbox with wrapping ensures buttons stack on smaller screens.
    <div
      className="flex flex-wrap gap-3 mb-6 animate-fade-in-up"
      style={{ animationDelay: "0.1s" }}
    >
      {filters.map((filter) => (
        <button
          key={filter.id} // Stable key based on filter id (no index needed)
          onClick={() => setActiveFilter(filter.id)} // Notify parent of filter change
          // Dynamic classes: when active, apply background color (bg-{color}-600) and white text.
          // Inactive buttons have a neutral background with border and hover effect.
          // The transition ensures smooth color changes.
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
