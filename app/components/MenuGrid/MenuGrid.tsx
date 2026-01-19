import { MenuItem } from "@/app/hooks/useMenuData";
import MenuItemCard from "../MenuItemCard/MenuItemCard";

interface MenuGridProps {
  items: MenuItem[];
  addToCart: (item: MenuItem) => void;
  searchTerm: string;
  categoryFilter: string[];
  availabilityFilter: string;
  chefSpecialFilter: string;
  activeFilter: string;
  onClearFilters: () => void;
}

const MenuGrid = ({
  items,
  addToCart,
  searchTerm,
  categoryFilter,
  availabilityFilter,
  chefSpecialFilter,
  activeFilter,
  onClearFilters,
}: MenuGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">
          No items found
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {searchTerm ||
          !categoryFilter.includes("all") ||
          availabilityFilter !== "all" ||
          chefSpecialFilter !== "all"
            ? "Try adjusting your search or filters to find what you're looking for."
            : "No menu items available at the moment. Please check back later."}
        </p>

        {(searchTerm ||
          !categoryFilter.includes("all") ||
          availabilityFilter !== "all" ||
          chefSpecialFilter !== "all") && (
          <button
            onClick={onClearFilters}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {activeFilter === "all"
            ? "All Menu Items"
            : activeFilter === "trending"
              ? "Trending Now"
              : activeFilter === "best"
                ? "Best Rated"
                : activeFilter === "vegetarian"
                  ? "Vegetarian Options"
                  : activeFilter === "vegan"
                    ? "Vegan Options"
                    : "Menu Items"}
          <span className="text-gray-500 text-lg font-normal ml-2">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </h3>

        {(searchTerm ||
          !categoryFilter.includes("all") ||
          availabilityFilter !== "all" ||
          chefSpecialFilter !== "all") && (
          <button
            onClick={onClearFilters}
            className="text-gray-600 hover:text-indigo-600 text-sm font-medium flex items-center gap-2 transition-colors duration-200"
          >
            <span>Clear filters</span>
            <span className="text-lg">×</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <MenuItemCard
            key={item._id || index}
            item={item}
            addToOrder={addToCart}
            animationDelay={index * 0.1}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
