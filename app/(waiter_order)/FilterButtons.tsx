import React from "react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the FilterButtons component.
 */
interface FilterButtonsProps {
  /** Currently active filter key (e.g., "all", "confirmed", etc.) */
  filter: string;
  /** Callback invoked when a filter button is clicked */
  setFilter: (filter: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Predefined filter configurations.
 * Each entry defines a filter key, a human‑readable label,
 * and a color theme used for styling the active button.
 *
 * @remarks
 * The color names correspond to Tailwind CSS color utilities.
 * Note: Dynamic class names like `bg-${color}-600` are used;
 * ensure these colors are included in Tailwind's safelist or used statically.
 */
const FILTER_OPTIONS = [
  { key: "all", label: "All Orders", color: "indigo" },
  { key: "confirmed", label: "Confirmed", color: "blue" },
  { key: "preparing", label: "Preparing", color: "orange" },
  { key: "ready", label: "Ready to Serve", color: "green" },
] as const;

// ============================================================================
// Component
// ============================================================================

/**
 * FilterButtons Component
 *
 * Renders a set of filter buttons for order statuses.
 * Highlights the currently active filter and updates the parent state
 * when a button is clicked.
 *
 * @component
 * @example
 * ```tsx
 * const [filter, setFilter] = useState("all");
 * <FilterButtons filter={filter} setFilter={setFilter} />
 * ```
 *
 * @param {FilterButtonsProps} props - Component props
 * @returns {JSX.Element} Rendered filter buttons
 */
const FilterButtons: React.FC<FilterButtonsProps> = ({ filter, setFilter }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {FILTER_OPTIONS.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium
            transition-colors duration-200
            ${
              filter === key
                ? `bg-${color}-600 text-white` // Active: colored background
                : "bg-gray-200 text-gray-700 hover:bg-gray-300" // Inactive: neutral
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;
