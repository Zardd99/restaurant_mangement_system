"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "../../presentation/components/ProtectedRoute/ProtectedRoute";
import MenuItemCard from "../../presentation/components/MenuItemCard/MenuItemCard";
import Link from "next/link";
import { useSearch } from "../../contexts/SearchContext";
import { useAuth } from "../../contexts/AuthContext";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string | { _id: string; name: string };
  image: string;
  dietaryTags: string[];
  availability: boolean;
  preparationTime: number;
  chefSpecial: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  effectivePrice?: number;
  originalPrice?: number;
  appliedPromotion?: {
    id: string;
    name: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  } | null;
}

interface Promotion {
  _id: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  applicableMenuItems: string[];
  isActive: boolean;
}

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const { searchQuery } = useSearch();
  const { token } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Helper function to enrich menu items with promotion data
  const enrichMenuItemsWithPromotions = (
    items: MenuItem[],
    promos: Promotion[],
  ): MenuItem[] => {
    return items.map((item) => {
      const appliedPromo = promos.find(
        (promo) =>
          promo.isActive && promo.applicableMenuItems.includes(item._id),
      );

      if (!appliedPromo) {
        return {
          ...item,
          effectivePrice: item.price,
          appliedPromotion: null,
        };
      }

      let effectivePrice = item.price;
      let discountAmount = 0;

      if (appliedPromo.discountType === "percentage") {
        discountAmount = item.price * (appliedPromo.discountValue / 100);
        effectivePrice = item.price - discountAmount;
      } else if (appliedPromo.discountType === "fixed") {
        discountAmount = appliedPromo.discountValue;
        effectivePrice = Math.max(0, item.price - discountAmount);
      }

      return {
        ...item,
        effectivePrice,
        appliedPromotion: {
          id: appliedPromo._id,
          name: appliedPromo.name,
          discountType: appliedPromo.discountType,
          discountValue: appliedPromo.discountValue,
          discountAmount: discountAmount,
        },
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch menu items
        let url = `${API_URL}/api/menu?chefSpecial=true`;
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const menuResponse = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!menuResponse.ok) {
          throw new Error(`Failed to fetch menu items: ${menuResponse.status}`);
        }

        const menuData = await menuResponse.json();
        const items = menuData.data || menuData;

        if (!Array.isArray(items)) {
          throw new Error("Invalid response format from API");
        }

        // Fetch active promotions
        const promotionResponse = await fetch(
          `${API_URL}/api/promotions/active`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        let promos: Promotion[] = [];
        if (promotionResponse.ok) {
          const promotionData = await promotionResponse.json();
          promos = promotionData.data || promotionData;
        }

        setPromotions(promos);

        // Enrich items with promotion data
        const enrichedItems = enrichMenuItemsWithPromotions(items, promos);
        setMenuItems(enrichedItems);
        setFilteredItems(enrichedItems);
      } catch (err) {
        console.error("Error fetching:", err);
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL, searchQuery, token]);

  // Filter items based on active filter
  useEffect(() => {
    let filtered = [...menuItems];

    if (activeFilter === "vegan") {
      filtered = menuItems.filter((item) =>
        item.dietaryTags?.includes("vegan"),
      );
    } else if (activeFilter === "vegetarian") {
      filtered = menuItems.filter(
        (item) =>
          item.dietaryTags?.includes("vegetarian") ||
          item.dietaryTags?.includes("vegan"),
      );
    } else if (activeFilter === "trending") {
      filtered = menuItems
        .filter((item) => item.reviewCount > 10)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 6);
    } else if (activeFilter === "best") {
      filtered = menuItems
        .filter((item) => item.averageRating >= 4)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 6);
    } else if (activeFilter === "discounted") {
      filtered = menuItems.filter((item) => item.appliedPromotion);
    }

    setFilteredItems(filtered);
  }, [activeFilter, menuItems]);

  // Filter buttons component
  const FilterButtons = () => (
    <div className="flex flex-wrap gap-3 mb-10">
      <button
        onClick={() => setActiveFilter("all")}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          activeFilter === "all"
            ? "bg-indigo-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          All Items
        </div>
      </button>
      <button
        onClick={() => setActiveFilter("trending")}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          activeFilter === "trending"
            ? "bg-rose-500 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-rose-300 hover:bg-rose-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Trending Now
        </div>
      </button>
      <button
        onClick={() => setActiveFilter("best")}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          activeFilter === "best"
            ? "bg-amber-500 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-amber-300 hover:bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          Best Rated
        </div>
      </button>
      <button
        onClick={() => setActiveFilter("vegetarian")}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          activeFilter === "vegetarian"
            ? "bg-emerald-500 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Vegetarian
        </div>
      </button>
      <button
        onClick={() => setActiveFilter("vegan")}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          activeFilter === "vegan"
            ? "bg-green-500 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Vegan
        </div>
      </button>
      <button
        onClick={() => setActiveFilter("discounted")}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          activeFilter === "discounted"
            ? "bg-purple-500 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          On Sale
        </div>
      </button>
    </div>
  );

  // Loading state UI
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-10">
              <div className="h-8 bg-gray-200 rounded-xl w-64 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-xl w-96 animate-pulse"></div>
            </div>
            <FilterButtons />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse"
                >
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="flex justify-between mb-4">
                      <div className="h-6 bg-gray-200 rounded-full w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded-full w-2/3 mb-6"></div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state UI
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate discount stats
  const discountedItems = menuItems.filter((item) => item.appliedPromotion);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                  Chef's Special
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Discover exquisite culinary creations crafted by our master
                  chefs. Each dish tells a story of passion, tradition, and
                  innovation.
                </p>
              </div>
              <Link href="/user_interface">
                <button className="group bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                  <span>View All Menus</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {menuItems.length}
                </div>
                <div className="text-sm text-gray-500">Total Dishes</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {menuItems.filter((item) => item.chefSpecial).length}
                </div>
                <div className="text-sm text-gray-500">Chef's Specials</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {menuItems.filter((item) => item.averageRating >= 4).length}
                </div>
                <div className="text-sm text-gray-500">Top Rated</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {menuItems.filter((item) => item.availability).length}
                </div>
                <div className="text-sm text-gray-500">Available Now</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-purple-600">
                  {discountedItems.length}
                </div>
                <div className="text-sm text-gray-500">On Sale</div>
              </div>
            </div>

            <FilterButtons />
          </div>

          {/* Special Offers Section */}
          {discountedItems.length > 0 &&
            (activeFilter === "all" || activeFilter === "discounted") && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      🎯 Special Offers
                    </h2>
                    <p className="text-gray-600">
                      Limited time discounts on selected items
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveFilter("discounted")}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2"
                  >
                    View all
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {discountedItems.slice(0, 4).map((item, index) => (
                    <MenuItemCard
                      key={item._id}
                      item={item}
                      animationDelay={index * 0.1}
                    />
                  ))}
                </div>
              </section>
            )}

          {/* Featured Sections */}
          {(activeFilter === "all" || activeFilter === "trending") &&
            menuItems.filter((item) => item.reviewCount > 10).length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      🔥 Trending Now
                    </h2>
                    <p className="text-gray-600">
                      Most popular dishes this week
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveFilter("trending")}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-2"
                  >
                    View all
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {menuItems
                    .filter((item) => item.reviewCount > 10)
                    .sort((a, b) => b.reviewCount - a.reviewCount)
                    .slice(0, 4)
                    .map((item, index) => (
                      <MenuItemCard
                        key={item._id}
                        item={item}
                        animationDelay={index * 0.1}
                      />
                    ))}
                </div>
              </section>
            )}

          {/* Main Menu Grid */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Our Special Menu
              </h2>
              <div className="text-sm text-gray-500">
                Showing {filteredItems.length} of {menuItems.length} items
                {activeFilter === "discounted" &&
                  ` (${discountedItems.length} on sale)`}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No items found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {activeFilter !== "all"
                    ? `No ${activeFilter} items available at the moment. Try another filter or check back later.`
                    : "Our chef is preparing new specials. Please check back soon!"}
                </p>
                {activeFilter !== "all" && (
                  <button
                    onClick={() => setActiveFilter("all")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Show All Items
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredItems.map((item, index) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    animationDelay={index * 0.03}
                  />
                ))}
              </div>
            )}
          </section>

          {/* CTA Section */}
          <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  Hungry for more?
                </h3>
                <p className="text-indigo-100 max-w-lg">
                  Explore our full menu with over 100+ delicious dishes crafted
                  by our expert chefs.{" "}
                  {discountedItems.length > 0 &&
                    `Don't miss our ${discountedItems.length} special offers!`}
                </p>
              </div>
              <Link href="/user_interface">
                <button className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap">
                  Browse Full Menu
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
