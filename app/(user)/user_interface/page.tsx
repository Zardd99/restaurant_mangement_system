"use client";

import { useState, useMemo } from "react";
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

const Menu = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>(["all"]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [chefSpecialFilter, setChefSpecialFilter] = useState("all");

  const { menuItems, categories, loading, error, getCategoryForFilter } =
    useMenuData();
  const { token } = useAuth();
  const { orders } = useOrders(token, "all");

  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];

    // Apply dietary filters
    if (activeFilter === "vegan") {
      filtered = filtered.filter((item) => item.dietaryTags?.includes("vegan"));
    } else if (activeFilter === "vegetarian") {
      filtered = filtered.filter(
        (item) =>
          item.dietaryTags?.includes("vegetarian") ||
          item.dietaryTags?.includes("vegan"),
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
        categoryFilter.length === 0 ||
        categoryFilter.includes("all") ||
        categoryFilter.includes(getCategoryForFilter(item.category));

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
    getCategoryForFilter,
  ]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto mt-18 px-4 py-8 max-w-7xl">
        <MenuHeader />
        {/* 
        <div>
          <MenuTopItemsChartBW orders={orders} />
        </div> */}

        {/* Sticky Filter Header */}
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

        {/* Featured Sections */}
        <FeaturedSections
          menuItems={menuItems}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {/* Quick Filters */}
        <div className="my-6">
          <FilterSection
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>

        {/* Menu Grid */}
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
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
