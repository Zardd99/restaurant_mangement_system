"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute/ProtectedRoute";
import { useMenuData } from "@/app/hooks/useMenuData";
import { MenuItem } from "@/app/hooks/useMenuData";
import MenuHeader from "../../components/MenuHeader/MenuHeader";
import FilterSection from "../../components/FilterSection/FilterSection";
import SearchAndFilterBar from "../../components/SearchAndFilterBar/SearchAndFilterBar";
import MenuGrid from "../../components/MenuGrid/MenuGrid";
import FeaturedSections from "../../components/FeaturedSections/FeaturedSections";
import LoadingState from "../../(waiter_order)/common/LoadingState";
import ErrorState from "../../(waiter_order)/common/ErrorState";

const Menu = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [chefSpecialFilter, setChefSpecialFilter] = useState("all");

  // Use the hook instead of fetching separately
  const { menuItems, categories, loading, error } = useMenuData();

  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];

    // Apply dietary filters
    if (activeFilter === "vegan") {
      filtered = filtered.filter((item) => item.dietaryTags?.includes("vegan"));
    } else if (activeFilter === "vegetarian") {
      filtered = filtered.filter(
        (item) =>
          item.dietaryTags?.includes("vegetarian") ||
          item.dietaryTags?.includes("vegan")
      );
    } else if (activeFilter === "trending") {
      filtered = filtered
        .filter((item) => item.reviewCount > 10)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 6);
    } else if (activeFilter === "best") {
      filtered = filtered
        .filter((item) => item.averageRating >= 4)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 6);
    }

    // Apply search and other filters
    return filtered.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.availability) ||
        (availabilityFilter === "unavailable" && !item.availability);

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
  ]);

  const addToCart = (item: MenuItem) => {
    console.log("Added to cart:", item);
  };

  if (loading) return <LoadingState type="menu" count={6} />;
  if (error) return <ErrorState error={error} />;

  return (
    <ProtectedRoute>
      <div className="container mx-auto mt-18 px-4 py-8 max-w-7xl">
        <MenuHeader />

        <FeaturedSections
          menuItems={menuItems}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <FilterSection
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <SearchAndFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
          chefSpecialFilter={chefSpecialFilter}
          setChefSpecialFilter={setChefSpecialFilter}
          categories={categories}
        />

        <MenuGrid
          items={filteredItems}
          addToCart={addToCart}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          availabilityFilter={availabilityFilter}
          chefSpecialFilter={chefSpecialFilter}
          activeFilter={activeFilter}
          onClearFilters={() => {
            setSearchTerm("");
            setCategoryFilter("all");
            setAvailabilityFilter("all");
            setChefSpecialFilter("all");
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
