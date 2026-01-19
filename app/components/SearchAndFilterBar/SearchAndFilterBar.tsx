import { Search, Filter } from "lucide-react";

interface SearchAndFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string[];
  setCategoryFilter: (filter: string[]) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (filter: string) => void;
  chefSpecialFilter: string;
  setChefSpecialFilter: (filter: string) => void;
  categories: string[];
}

const SearchAndFilterBar = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  availabilityFilter,
  setAvailabilityFilter,
  chefSpecialFilter,
  setChefSpecialFilter,
  categories,
}: SearchAndFilterBarProps) => (
  <div
    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6 animate-fade-in-up"
    style={{ animationDelay: "0.2s" }}
  >
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex-1 relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search menu items by name or description..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category Filter with Checkboxes */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
          <div className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200 hover:border-gray-300 bg-white">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Categories
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={categoryFilter.includes("all")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCategoryFilter(["all"]);
                    } else {
                      setCategoryFilter([]);
                    }
                  }}
                  className="mr-2"
                />
                All
              </label>
              {categories.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryFilter.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (categoryFilter.includes("all")) {
                          setCategoryFilter([category]);
                        } else {
                          setCategoryFilter([...categoryFilter, category]);
                        }
                      } else {
                        setCategoryFilter(
                          categoryFilter.filter((c) => c !== category),
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Other Filters */}
        {[
          {
            value: availabilityFilter,
            onChange: setAvailabilityFilter,
            options: ["all", "available", "unavailable"],
            label: "Status",
          },
          {
            value: chefSpecialFilter,
            onChange: setChefSpecialFilter,
            options: ["all", "special", "regular"],
            label: "Type",
          },
        ].map((filter) => (
          <div key={filter.label} className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
            >
              <option value="all">All {filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SearchAndFilterBar;
