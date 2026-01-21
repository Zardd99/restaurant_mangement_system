"use client";

import React, { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp, X } from "lucide-react";

interface SearchAndFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string[];
  setCategoryFilter: (categories: string[]) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (filter: string) => void;
  chefSpecialFilter: string;
  setChefSpecialFilter: (filter: string) => void;
  categories: string[];
}

const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
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

  const clearAllFilters = () => {
    setCategoryFilter(["all"]);
    setAvailabilityFilter("all");
    setChefSpecialFilter("all");
    setSearchTerm("");
  };

  const hasActiveFilters = () => {
    return (
      !categoryFilter.includes("all") ||
      availabilityFilter !== "all" ||
      chefSpecialFilter !== "all" ||
      searchTerm !== ""
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
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
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center justify-between w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 min-w-[180px]"
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
              <div className="absolute z-50 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                <div className="p-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Select Categories
                  </div>

                  {/* All Categories Option */}
                  <label className="flex items-center py-2 px-2 hover:bg-gray-50 rounded transition-colors duration-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        categoryFilter.includes("all") ||
                        categoryFilter.length === 0
                      }
                      onChange={(e) =>
                        handleCategoryChange("all", e.target.checked)
                      }
                      className="h-4 w-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">
                      All Categories
                    </span>
                  </label>

                  <div className="h-px bg-gray-100 my-2"></div>

                  {/* Individual Categories */}
                  <div className="max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center py-2 px-2 hover:bg-gray-50 rounded transition-colors duration-150 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={categoryFilter.includes(category)}
                          onChange={(e) =>
                            handleCategoryChange(category, e.target.checked)
                          }
                          className="h-4 w-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                      </label>
                    ))}
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
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50"
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
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50"
              value={chefSpecialFilter}
              onChange={(e) => setChefSpecialFilter(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="special">Chef Specials</option>
              <option value="regular">Regular Items</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
