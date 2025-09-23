import { Search, Filter } from "lucide-react";

interface SearchAndFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
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
        {[
          {
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: ["all", ...categories],
            label: "Categories",
          },
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
