import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

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

export interface MenuStats {
  total: number;
  available: number;
  chefSpecials: number;
  categories: number;
}

export const useMenuData = () => {
  const { token, logout } = useAuth();
  const API_URL = process.env.API_URL || "http://localhost:5000";

  // state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const getCategoryName = useCallback(
    (category: string | { _id: string; name: string }): string => {
      if (typeof category === "string") return category;
      return category?.name || "unknown Category";
    },
    []
  );

  const getCategoryForFilter = useCallback(
    (category: string | { _id: string; name: string }): string => {
      if (typeof category === "string") return category;
      return category?.name || "";
    },
    []
  );

  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(false);
      setError(null);

      if (!token) return;

      const response = await fetch(`${API_URL}/api/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again");
        }
        throw new Error(`failed to fetch menu: ${response.status}`);
      }

      const menuData = await response.json();

      if (Array.isArray(menuData)) {
        setMenuItems(menuData);
        const uniqueCategories = Array.from(
          new Set(
            menuData.map((item: MenuItem) => getCategoryName(item.category))
          )
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

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      setProcessing(true);

      const response = await fetch(`${API_URL}/api/menu/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error(`Session expired. Please login again`);
        }
        throw new Error(`Failed to update item: ${response.status}`);
      }

      const updatedItem = await response.json();
      setMenuItems(
        menuItems.map((item) => (item._id === itemId ? updatedItem : item))
      );

      return updatedItem;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update menu item"
      );
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      setProcessing(true);

      const response = await fetch(`${API_URL}/api/menu/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to delete item: ${response.status}`);
      }

      setMenuItems(menuItems.filter((item) => item._id !== itemId));
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete menu item"
      );
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const createMenuItem = async (newItem: Partial<MenuItem>) => {
    try {
      setProcessing(true);

      const response = await fetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to create item: ${response.status}`);
      }

      const createdItem = await response.json();
      setMenuItems([...menuItems, createdItem]);
      return createdItem;
    } catch (err) {
      console.error("Error creating menu item:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create menu item"
      );
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [token, fetchMenuData]);

  const stats: MenuStats = {
    total: menuItems.length,
    available: menuItems.filter((item) => item.availability).length,
    chefSpecials: menuItems.filter((item) => item.chefSpecial).length,
    categories: categories.length,
  };

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
    setError,
  };
};
