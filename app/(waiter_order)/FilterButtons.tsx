import React from "react";

interface FilterButtonsProps {
  filter: string;
  setFilter: (filter: string) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ filter, setFilter }) => {
  const filters = [
    { key: "all", label: "All Orders", color: "indigo" },
    { key: "confirmed", label: "Confirmed", color: "blue" },
    { key: "preparing", label: "Preparing", color: "orange" },
    { key: "ready", label: "Ready to Serve", color: "green" },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {filters.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === key
              ? `bg-${color}-600 text-white`
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;
