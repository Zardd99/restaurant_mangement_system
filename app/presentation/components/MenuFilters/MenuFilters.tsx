import React, { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface MenuFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string[];
  setCategoryFilter: (category: string[]) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (availability: string) => void;
  chefSpecialFilter: string;
  setChefSpecialFilter: (special: string) => void;
  categories: string[];
}

const MenuFilters: React.FC<MenuFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  availabilityFilter,
  setAvailabilityFilter,
  chefSpecialFilter,
  setChefSpecialFilter,
  categories,
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (category === "all") {
      setCategoryFilter(checked ? ["all"] : []);
    } else {
      if (checked) {
        // Remove "all" if it exists and add the specific category
        const newFilter = categoryFilter.filter((c) => c !== "all");
        setCategoryFilter([...newFilter, category]);
      } else {
        setCategoryFilter(categoryFilter.filter((c) => c !== category));
      }
    }
  };

  const getCategoryDisplayText = () => {
    if (categoryFilter.includes("all") || categoryFilter.length === 0) {
      return "All Categories";
    }
    if (categoryFilter.length === 1) {
      const cat = categoryFilter[0];
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
    return `${categoryFilter.length} categories`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search menu items by name or description..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center justify-between w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-white min-w-[180px]"
            >
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <span className="text-sm font-medium text-gray-700">
                {getCategoryDisplayText()}
              </span>
              {isCategoryOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isCategoryOpen && (
              <div className="absolute z-50 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Select Categories
                  </div>

                  {/* All Categories Option */}
                  <label className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors duration-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        categoryFilter.includes("all") ||
                        categoryFilter.length === 0
                      }
                      onChange={(e) =>
                        handleCategoryChange("all", e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 font-medium">
                      All Categories
                    </span>
                  </label>

                  <div className="h-px bg-gray-100 my-2"></div>

                  {/* Individual Categories */}
                  <div className="max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors duration-150 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={categoryFilter.includes(category)}
                          onChange={(e) =>
                            handleCategoryChange(category, e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Clear/Select All Buttons */}
                  <div className="flex gap-2 pt-3 mt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter(["all"]);
                        setIsCategoryOpen(false);
                      }}
                      className="flex-1 text-sm text-gray-600 hover:text-gray-800 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter(categories);
                        setIsCategoryOpen(false);
                      }}
                      className="flex-1 text-sm text-blue-600 hover:text-blue-800 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                    >
                      Select All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Availability Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* Chef Special Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300"
              value={chefSpecialFilter}
              onChange={(e) => setChefSpecialFilter(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="special">Chef Specials</option>
              <option value="regular">Regular Items</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuFilters;
