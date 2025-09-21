"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ProtectedRoute } from "../../components/ProtectedRoute/ProtectedRoute";
import Link from "next/link";
import { useSearch } from "../../contexts/SearchContext";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  averageRating: number;
  reviewCount: number;
  category: {
    _id: string;
    name: string;
    description?: string;
  };
  dietaryTags?: string[];
  availability: boolean;
  chefSpecial?: boolean;
}

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const { searchQuery } = useSearch();

  const API_URL = process.env.API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `${API_URL}/api/menu?chefSpecial=true`;
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch menu items: ${response.status}`);
        }

        const data = await response.json();
        const items = data.data || data;

        if (Array.isArray(items)) {
          setMenuItems(items);
          setFilteredItems(items);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        console.error("Error fetching:", err);
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [API_URL, searchQuery]);

  // Filter items based on dietary preferences
  useEffect(() => {
    let filtered = [...menuItems];

    if (activeFilter === "vegan") {
      filtered = menuItems.filter((item) =>
        item.dietaryTags?.includes("vegan")
      );
    } else if (activeFilter === "vegetarian") {
      filtered = menuItems.filter(
        (item) =>
          item.dietaryTags?.includes("vegetarian") ||
          item.dietaryTags?.includes("vegan")
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
    }

    setFilteredItems(filtered);
  }, [activeFilter, menuItems]);

  // Handler for adding items to cart
  const addToCart = (item: MenuItem) => {
    console.log("Added to cart:", item);
  };

  // Render star rating component
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <svg
                key={i}
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <svg
                key={i}
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <defs>
                  <linearGradient id="half-star">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#half-star)"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            );
          } else {
            return (
              <svg
                key={i}
                className="w-4 h-4 text-gray-300 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            );
          }
        })}
        <span className="ml-1 text-sm font-medium text-gray-600">
          {(rating || 0).toFixed(1)}
        </span>
      </div>
    );
  };

  // Filter buttons component
  const FilterButtons = () => (
    <div className="flex flex-wrap gap-3 mb-8">
      <button
        onClick={() => setActiveFilter("all")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeFilter === "all"
            ? "bg-indigo-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        All Items
      </button>
      <button
        onClick={() => setActiveFilter("trending")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeFilter === "trending"
            ? "bg-rose-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        Trending Now
      </button>
      <button
        onClick={() => setActiveFilter("best")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeFilter === "best"
            ? "bg-amber-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        Best Rated
      </button>
      <button
        onClick={() => setActiveFilter("vegetarian")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeFilter === "vegetarian"
            ? "bg-emerald-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        Vegetarian
      </button>
      <button
        onClick={() => setActiveFilter("vegan")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeFilter === "vegan"
            ? "bg-green-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        Vegan
      </button>
    </div>
  );

  // Loading state UI
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Menu</h2>
            <p className="text-gray-600">
              Discover our carefully curated selections
            </p>
          </div>
          <FilterButtons />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
              >
                <div className="h-56 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded-full w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-full mb-6"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state UI
  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Menu</h2>
            <p className="text-gray-600">
              Discover our carefully curated selections
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Get trending and best dishes for featured sections
  const trendingItems = menuItems
    .filter((item) => item.reviewCount > 10)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  const bestRatedItems = menuItems
    .filter((item) => item.averageRating >= 4)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 4);

  // Main UI with menu items
  return (
    <ProtectedRoute>
      <div className="container mx-auto mt-18 px-4 py-8 max-w-7xl">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Chef Special Menu
            </h2>
            <p className="text-gray-600 text-lg">
              Discover our chef carefully curated selections
            </p>
          </div>
          <Link href="/user_interface">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
              Menus
            </div>
          </Link>
        </div>

        {/* Featured Sections */}
        {(activeFilter === "all" || activeFilter === "trending") &&
          trendingItems.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Trending Now
                </h3>
                <button
                  onClick={() => setActiveFilter("trending")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative h-40 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg
                            className="w-8 h-8 mb-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-lg font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="mb-3">
                        {renderStars(item.averageRating)}
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {(activeFilter === "all" || activeFilter === "best") &&
          bestRatedItems.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Best Rated</h3>
                <button
                  onClick={() => setActiveFilter("best")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestRatedItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative h-40 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg
                            className="w-8 h-8 mb-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-lg font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="mb-3">
                        {renderStars(item.averageRating)}
                        <span className="text-xs text-gray-500 ml-2">
                          ({item.reviewCount} reviews)
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Filter buttons */}
        <FilterButtons />

        {/* Main menu grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Menu Items Found
            </h3>
            <p className="text-gray-600 text-center">
              {activeFilter !== "all"
                ? `No ${activeFilter} items available. Try another filter.`
                : "Check back later for our menu creations"}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm"
              >
                Show All Items
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                {/* special badge */}
                {item.chefSpecial && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md z-10">
                    Chefs Special
                  </div>
                )}

                <div className="relative h-56 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span>No image available</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-xl font-bold text-green-600">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex justify-between items-center mb-5">
                    {renderStars(item.averageRating)}
                    {item.dietaryTags && item.dietaryTags.length > 0 && (
                      <div className="flex space-x-1">
                        {item.dietaryTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(item)}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                      item.availability
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!item.availability}
                  >
                    {item.availability ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          ></path>
                        </svg>
                        Order Now
                      </div>
                    ) : (
                      "Out of Stock"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
