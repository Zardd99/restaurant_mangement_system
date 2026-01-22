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
  const [showFilters, setShowFilters] = useState(false);

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
      return "All";
    }
    if (categoryFilter.length === 1) {
      const cat = categoryFilter[0];
      return cat.charAt(0).toUpperCase() + cat.slice(1).substring(0, 8);
    }
    return `${categoryFilter.length}`;
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

  const activeFilterCount = [
    !categoryFilter.includes("all") && categoryFilter.length > 0,
    availabilityFilter !== "all",
    chefSpecialFilter !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg p-2 border border-gray-200 mb-2 shadow-sm">
      {/* Compact single row layout */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Search menu..."
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-all duration-200 bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Toggle Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative p-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          title="Toggle filters"
        >
          <Filter size={14} className="text-gray-400" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Category Filter - Compact */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-gray-300 bg-gray-50 transition-colors duration-150"
            title="Category filter"
          >
            <span className="font-medium text-gray-700">
              {getCategoryDisplayText()}
            </span>
            {isCategoryOpen ? (
              <ChevronUp className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            )}
          </button>

          {/* Compact Dropdown Menu */}
          {isCategoryOpen && (
            <div className="absolute right-0 z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                  Categories
                </div>
                <label className="flex items-center py-1 px-2 hover:bg-gray-50 rounded transition-colors duration-150 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      categoryFilter.includes("all") ||
                      categoryFilter.length === 0
                    }
                    onChange={(e) =>
                      handleCategoryChange("all", e.target.checked)
                    }
                    className="h-3.5 w-3.5 text-gray-900 rounded border-gray-300 focus:ring-1 focus:ring-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">
                    All Categories
                  </span>
                </label>
                <div className="h-px bg-gray-100 my-1"></div>
                <div className="max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center py-1 px-2 hover:bg-gray-50 rounded transition-colors duration-150 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={categoryFilter.includes(category)}
                        onChange={(e) =>
                          handleCategoryChange(category, e.target.checked)
                        }
                        className="h-3.5 w-3.5 text-gray-900 rounded border-gray-300 focus:ring-1 focus:ring-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 truncate">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear Button - Only show when filters are active */}
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="p-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            title="Clear all filters"
          >
            <X size={12} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Expanded Filters Section - Only shows when toggled */}
      {showFilters && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {/* Availability Filter */}
            <div className="relative">
              <select
                className="pl-7 pr-5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <option value="all">Status: All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <Filter
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={12}
              />
            </div>

            {/* Chef Special Filter */}
            <div className="relative">
              <select
                className="pl-7 pr-5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50"
                value={chefSpecialFilter}
                onChange={(e) => setChefSpecialFilter(e.target.value)}
              >
                <option value="all">Type: All</option>
                <option value="special">Chef Specials</option>
                <option value="regular">Regular Items</option>
              </select>
              <Filter
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={12}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilterBar;
