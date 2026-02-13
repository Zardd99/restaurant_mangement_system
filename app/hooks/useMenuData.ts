"use client";

// ============================================================================
// External Dependencies
// ============================================================================
import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Application Contexts
// ============================================================================
import { useAuth } from "../contexts/AuthContext";

// ============================================================================
// Type Definitions – Menu Item & Statistics
// ============================================================================

/**
 * Represents a menu item entity as returned by the backend API.
 */
export interface MenuItem {
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
}

/**
 * Summary statistics for the entire menu.
 */
export interface MenuStats {
  /** Total number of menu items. */
  total: number;
  /** Number of items currently available. */
  available: number;
  /** Number of items marked as chef's special. */
  chefSpecials: number;
  /** Total distinct categories used. */
  categories: number;
}

// ============================================================================
// Custom Hook – useMenuData
// ============================================================================

/**
 * useMenuData – Custom hook for managing menu items and their CRUD operations.
 *
 * - Fetches the full menu from the API on mount / token change.
 * - Provides state: menuItems, categories, loading, error, processing.
 * - Provides functions: updateMenuItem, deleteMenuItem, createMenuItem.
 * - Computes and returns real‑time statistics.
 *
 * @returns {Object} Menu data, stats, and CRUD handlers.
 */
export const useMenuData = () => {
  // --------------------------------------------------------------------------
  // Authentication & Environment
  // --------------------------------------------------------------------------
  const { token, logout } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL environment variable is not set");
    // Note: The hook will continue but requests will fail. Consider throwing
    // an error if the application cannot function without this variable.
  }

  // --------------------------------------------------------------------------
  // State Declarations
  // --------------------------------------------------------------------------
  /** All menu items fetched from the API. */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  /** List of unique category names derived from menu items. */
  const [categories, setCategories] = useState<string[]>([]);

  /** Indicates whether the initial fetch is in progress. */
  const [loading, setLoading] = useState<boolean>(true);

  /** Stores any error message encountered during API operations. */
  const [error, setError] = useState<string | null>(null);

  /** Indicates whether a create/update/delete operation is ongoing. */
  const [processing, setProcessing] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Helper Functions (Memoized)
  // --------------------------------------------------------------------------

  /**
   * Extracts the category name from a menu item's category field.
   * The field can be either a string (legacy) or an object with a name property.
   *
   * @param category - Raw category data from the menu item.
   * @returns The category name as a string, or "unknown Category" if not found.
   */
  const getCategoryName = useCallback(
    (category: string | { _id: string; name: string }): string => {
      if (typeof category === "string") return category;
      return category?.name || "unknown Category";
    },
    [],
  );

  /**
   * Similar to `getCategoryName` but returns an empty string when the category
   * is invalid. Used specifically for filtering logic.
   *
   * @param category - Raw category data from the menu item.
   * @returns The category name, or an empty string if not available.
   */
  const getCategoryForFilter = useCallback(
    (category: string | { _id: string; name: string }): string => {
      if (typeof category === "string") return category;
      return category?.name || "";
    },
    [],
  );

  // --------------------------------------------------------------------------
  // Data Fetching (Menu & Categories)
  // --------------------------------------------------------------------------

  /**
   * Fetches all menu items from the backend API.
   * - Updates `menuItems` and derives `categories`.
   * - Handles authentication errors (401) by triggering logout.
   * - Catches and stores any errors in `error` state.
   */
  const fetchMenuData = useCallback(async () => {
    if (!API_URL) {
      setError("API URL is not configured");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!token) return;

      const response = await fetch(`${API_URL}/api/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again");
        }
        throw new Error(`Failed to fetch menu: ${response.status}`);
      }

      const menuData = await response.json();

      if (Array.isArray(menuData)) {
        setMenuItems(menuData);
        // Extract unique category names
        const uniqueCategories = Array.from(
          new Set(
            menuData.map((item: MenuItem) => getCategoryName(item.category)),
          ),
        );
        setCategories(uniqueCategories as string[]);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [API_URL, getCategoryName, logout, token]);

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Updates an existing menu item.
   *
   * @param itemId - ID of the item to update.
   * @param updates - Partial MenuItem containing fields to update.
   * @returns The updated menu item from the API.
   * @throws Error if the request fails or session is invalid.
   */
  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      setProcessing(true);

      const response = await fetch(`${API_URL}/api/menu/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again");
        }
        throw new Error(`Failed to update item: ${response.status}`);
      }

      const updatedItem = await response.json();
      // Optimistically update local state
      setMenuItems(
        menuItems.map((item) => (item._id === itemId ? updatedItem : item)),
      );

      return updatedItem;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update menu item",
      );
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Deletes a menu item.
   *
   * @param itemId - ID of the item to delete.
   * @throws Error if the request fails or session is invalid.
   */
  const deleteMenuItem = async (itemId: string) => {
    try {
      setProcessing(true);

      const response = await fetch(`${API_URL}/api/menu/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again");
        }
        throw new Error(`Failed to delete item: ${response.status}`);
      }

      // Remove item from local state
      setMenuItems(menuItems.filter((item) => item._id !== itemId));
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete menu item",
      );
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Creates a new menu item.
   *
   * @param newItem - Partial MenuItem containing required fields for creation.
   * @returns The newly created menu item from the API.
   * @throws Error if the request fails or session is invalid.
   */
  const createMenuItem = async (newItem: Partial<MenuItem>) => {
    try {
      setProcessing(true);

      const response = await fetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again");
        }
        throw new Error(`Failed to create item: ${response.status}`);
      }

      const createdItem = await response.json();
      // Add new item to local state
      setMenuItems([...menuItems, createdItem]);

      return createdItem;
    } catch (err) {
      console.error("Error creating menu item:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create menu item",
      );
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * Triggers an initial fetch of menu data when the authentication token
   * becomes available or when the fetch function itself changes.
   */
  useEffect(() => {
    fetchMenuData();
  }, [token, fetchMenuData]);

  // --------------------------------------------------------------------------
  // Derived Data
  // --------------------------------------------------------------------------

  /**
   * Real-time statistics computed from the current menu items.
   */
  const stats: MenuStats = {
    total: menuItems.length,
    available: menuItems.filter((item) => item.availability).length,
    chefSpecials: menuItems.filter((item) => item.chefSpecial).length,
    categories: categories.length,
  };

  // --------------------------------------------------------------------------
  // Return Value
  // --------------------------------------------------------------------------
  return {
    menuItems,
    categories,
    loading,
    error,
    processing,
    stats,
    getCategoryName,
    getCategoryForFilter,
    updateMenuItem,
    deleteMenuItem,
    createMenuItem,
    setError, // Exposed to allow manual clearing of error state
  };
};
