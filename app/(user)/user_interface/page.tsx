"use client";

// ============================================================================
// External Imports
// ============================================================================
import { useState, useMemo } from "react";

// ============================================================================
// Internal Imports
// ============================================================================
import { ProtectedRoute } from "../../presentation/components/ProtectedRoute/ProtectedRoute";
import { useMenuData } from "@/app/hooks/useMenuData";
import { useOrders } from "@/app/hooks/useOrders";
import { useAuth } from "@/app/contexts/AuthContext";
import MenuHeader from "../../presentation/components/MenuHeader/MenuHeader";
import FeaturedSections from "../../presentation/components/FeaturedSections/FeaturedSections";
import FilterSection from "../../presentation/components/FilterSection/FilterSection";
import MenuGrid from "../../presentation/components/MenuGrid/MenuGrid";
import MenuStickyHeader from "../../presentation/components/Menu/MenuStickyHeader";
import MenuTopItemsChartBW from "../../presentation/components/MenuStats/MenuTopItemsChartBW";

// ============================================================================
// Main Component: Menu
// ============================================================================

/**
 * Menu Page Component
 *
 * Displays the restaurant's menu with filtering, search, and categorization.
 * Features:
 * - Protected route – requires authentication
 * - Real‑time menu data from useMenuData hook
 * - Order statistics from useOrders hook (for potential analytics)
 * - Dietary quick filters (vegan, vegetarian, trending, best)
 * - Advanced filters: category, availability, chef special
 * - Search by name/description
 * - Fully responsive design
 *
 * @component
 * @returns {JSX.Element} The rendered menu page
 */
const Menu = () => {
  // --------------------------------------------------------------------------
  // State Declarations
  // --------------------------------------------------------------------------

  /** Quick dietary filter (all, vegan, vegetarian, trending, best) */
  const [activeFilter, setActiveFilter] = useState("all");

  /** Text search term for filtering menu items by name or description */
  const [searchTerm, setSearchTerm] = useState("");

  /** Selected category filters; ["all"] indicates no category restriction */
  const [categoryFilter, setCategoryFilter] = useState<string[]>(["all"]);

  /** Availability filter: "all", "available", "unavailable" */
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  /** Chef special filter: "all", "special", "regular" */
  const [chefSpecialFilter, setChefSpecialFilter] = useState("all");

  // --------------------------------------------------------------------------
  // Custom Hooks
  // --------------------------------------------------------------------------

  /**
   * Fetch menu items, categories, and related metadata.
   * Provides loading, error, and a helper function getCategoryForFilter.
   */
  const { menuItems, categories, loading, error, getCategoryForFilter } =
    useMenuData();

  /** Retrieve authentication token for useOrders hook */
  const { token } = useAuth();

  /**
   * Fetch all orders (used for statistics and trending calculations).
   * Note: The "all" parameter fetches orders of all statuses.
   */
  const { orders } = useOrders(token, "all");

  // --------------------------------------------------------------------------
  // Derived State (Memoized)
  // --------------------------------------------------------------------------

  /**
   * Filtered menu items based on all active filters.
   * - First applies dietary quick filters (activeFilter)
   * - Then applies search, category, availability, and chef special filters
   *
   * @constant filteredItems
   */
  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];

    // ========================================================================
    // Step 1: Apply dietary quick filters (overrides category/others)
    // ========================================================================
    if (activeFilter === "vegan") {
      filtered = filtered.filter((item) => item.dietaryTags?.includes("vegan"));
    } else if (activeFilter === "vegetarian") {
      filtered = filtered.filter(
        (item) =>
          item.dietaryTags?.includes("vegetarian") ||
          item.dietaryTags?.includes("vegan"),
      );
    } else if (activeFilter === "trending") {
      // Top 6 items with more than 10 reviews, sorted by review count
      filtered = filtered
        .filter((item) => item.reviewCount > 10)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 6);
    } else if (activeFilter === "best") {
      // Top 6 items with rating ≥4, sorted by rating
      filtered = filtered
        .filter((item) => item.averageRating >= 4)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 6);
    }

    // ========================================================================
    // Step 2: Apply search and advanced filters
    // ========================================================================
    return filtered.filter((item) => {
      // ----- Search filter -----
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      // ----- Category filter -----
      const matchesCategory =
        categoryFilter.length === 0 ||
        categoryFilter.includes("all") ||
        categoryFilter.includes(getCategoryForFilter(item.category));

      // ----- Availability filter -----
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.availability) ||
        (availabilityFilter === "unavailable" && !item.availability);

      // ----- Chef special filter -----
      const matchesChefSpecial =
        chefSpecialFilter === "all" ||
        (chefSpecialFilter === "special" && item.chefSpecial) ||
        (chefSpecialFilter === "regular" && !item.chefSpecial);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesChefSpecial
      );
    });
  }, [
    menuItems,
    activeFilter,
    searchTerm,
    categoryFilter,
    availabilityFilter,
    chefSpecialFilter,
    getCategoryForFilter,
  ]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <ProtectedRoute>
      <div className="container mx-auto mt-18 px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <MenuHeader />

        {/* 
          ============================================================
          Top Items Chart (currently commented out)
          ============================================================
          <div>
            <MenuTopItemsChartBW orders={orders} />
          </div>
        */}

        {/* Sticky Header with Advanced Filters */}
        <MenuStickyHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
          chefSpecialFilter={chefSpecialFilter}
          setChefSpecialFilter={setChefSpecialFilter}
          categories={categories}
          orders={orders}
        />

        {/* Featured Sections (Carousel / Dietary Highlights) */}
        <FeaturedSections
          menuItems={menuItems}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {/* Quick Dietary Filter Buttons */}
        <div className="my-6">
          <FilterSection
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>

        {/* Menu Items Grid with Integrated Empty State and Clear Filters */}
        <div className="mt-6">
          <MenuGrid
            items={filteredItems}
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            availabilityFilter={availabilityFilter}
            chefSpecialFilter={chefSpecialFilter}
            activeFilter={activeFilter}
            onClearFilters={() => {
              setSearchTerm("");
              setCategoryFilter(["all"]);
              setAvailabilityFilter("all");
              setChefSpecialFilter("all");
              setActiveFilter("all");
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
