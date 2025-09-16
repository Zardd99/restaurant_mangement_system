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
  imageUrl?: string;
  rating: number;
  category: {
    _id: string;
    name: string;
    description?: string;
  };
  dietaryTags?: string[];
  availability: boolean;
  chefSpecial?: boolean;
}

const SpecialMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useSearch();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch chef special menu items from API
  useEffect(() => {
    const fetchChefSpecials = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Special dishes with chefSpecial filter
        let url = `${API_URL}/api/menu?chefSpecial=true`;
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch menu items: ${response.status}`);
        }

        const data = await response.json();

        const items = data.data || data;

        if (Array.isArray(items)) {
          setMenuItems(items);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        console.error("Error fetching chef specials:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load special menu"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChefSpecials();
  }, [API_URL, searchQuery]);

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
          {(rating || 0).toFixed(2)}
        </span>
      </div>
    );
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Chefs Specials
          </h2>
          <p className="text-gray-600">
            Discover our chefs carefully curated selections
          </p>
        </div>
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
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Chefs Specials
          </h2>
          <p className="text-gray-600">
            Discover our chefs carefully curated selections
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
    );
  }

  // Main UI with special menu items
  return (
    <ProtectedRoute>
      <div className="container mx-auto mt-18 px-4 py-8 max-w-7xl">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Chefs Specials
            </h2>
            <p className="text-gray-600">
              Discover our chefs carefully curated selections
            </p>
          </div>
          <Link href="/user_interface" className="">
            <div className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 rounded-full text-xs font-semibold shadow-md z-[999999]">
              Go See Our Menus
            </div>
          </Link>
        </div>

        {menuItems.length === 0 ? (
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
              No Specials Available
            </h3>
            <p className="text-gray-600 text-center">
              Check back later for our chefs special creations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                {/* special badge */}
                {item.chefSpecial && (
                  <div className="fixed top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md z-[999999]">
                    Chefs Special
                  </div>
                )}

                <div className="relative h-56 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
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
                    {renderStars(item.rating)}
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
                        Add to Cart
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

export default SpecialMenu;
