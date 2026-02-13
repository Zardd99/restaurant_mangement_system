"use client";

// ============================================================================
// Third-Party Libraries
// ============================================================================
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, AlertCircle, ChefHat } from "lucide-react";

// ============================================================================
// Application Contexts, Hooks, and Components
// ============================================================================
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useMenuData, MenuItem } from "../../hooks/useMenuData";
import MenuStats from "../../presentation/components/MenuStats/MenuStat";
import MenuFilters from "../../presentation/components/MenuFilters/MenuFilters";
import MenuTable from "../../presentation/components/MenuTable/MenuTable";
import Pagination from "../../presentation/components/Pagination/Pagination";
import ModalManager from "../../presentation/components/ModalManager/ModalManager";

// ============================================================================
// Admin Menu Dashboard Component
// ============================================================================
/**
 * AdminMenuDashboard – Provides full CRUD management for menu items.
 * - Restricted to users with role "admin" or "manager".
 * - Displays statistics, filtering, pagination, and modal-driven item operations.
 * - All data operations are delegated to the `useMenuData` custom hook.
 *
 * @component
 * @returns {JSX.Element} The rendered admin dashboard.
 */
const AdminMenuDashboard = () => {
  // --------------------------------------------------------------------------
  // Authentication & Routing
  // --------------------------------------------------------------------------
  const { isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();

  // --------------------------------------------------------------------------
  // Menu Data Hook (Custom)
  // --------------------------------------------------------------------------
  const {
    menuItems,
    categories,
    loading,
    error,
    processing,
    stats,
    getCategoryName,
    updateMenuItem,
    deleteMenuItem,
    createMenuItem,
    setError,
  } = useMenuData();

  // --------------------------------------------------------------------------
  // Local State
  // --------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>(["all"]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [chefSpecialFilter, setChefSpecialFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalType, setModalType] = useState<
    "view" | "edit" | "delete" | "create" | null
  >(null);

  const itemsPerPage: number = 10;

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  /**
   * Redirect unauthenticated users or users without admin/manager role to login.
   * Runs when authentication loading finishes or the current user changes.
   */
  useEffect(() => {
    if (
      !authLoading &&
      !["admin", "manager"].includes(currentUser?.role || "")
    ) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  // --------------------------------------------------------------------------
  // Memoized Computations
  // --------------------------------------------------------------------------
  /**
   * Filters menu items based on search term, category, availability,
   * and chef special status. Uses `useMemo` to avoid recalculation
   * on every render when dependencies haven't changed.
   */
  const filteredMenuItems = useMemo(() => {
    // Helper to extract category name regardless of its stored format.
    const getCategoryForFilter = (
      category: string | { _id: string; name: string },
    ): string => {
      if (typeof category === "string") return category;
      return category?.name || "";
    };

    return menuItems.filter((item) => {
      // --- Search filter ---
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      // --- Category filter ---
      const itemCategoryName = getCategoryForFilter(item.category);
      const matchesCategory =
        categoryFilter.length === 0 ||
        categoryFilter.includes("all") ||
        categoryFilter.includes(itemCategoryName);

      // --- Availability filter ---
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.availability) ||
        (availabilityFilter === "unavailable" && !item.availability);

      // --- Chef special filter ---
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
    searchTerm,
    categoryFilter,
    availabilityFilter,
    chefSpecialFilter,
  ]);

  /**
   * Total number of pages based on filtered results and items per page.
   */
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);

  /**
   * Start and end indexes for slicing the current page's items.
   */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  /**
   * Menu items displayed on the current page.
   */
  const currentItems = filteredMenuItems.slice(startIndex, endIndex);

  // --------------------------------------------------------------------------
  // Callbacks (Memoized)
  // --------------------------------------------------------------------------
  /**
   * Formats an ISO date string into a human-readable format (e.g., "Jan 1, 2025").
   */
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  /**
   * Formats a numeric price into USD currency string.
   */
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }, []);

  /**
   * Toggles the availability of a menu item.
   * @param {string} itemId - ID of the item to toggle.
   */
  const handleToggleAvailability = async (itemId: string): Promise<void> => {
    try {
      const item = menuItems.find((i) => i._id === itemId);
      if (!item) return;

      await updateMenuItem(itemId, {
        ...item,
        availability: !item.availability,
      });
    } catch (err) {
      console.error("Error updating menu item:", err);
    }
  };

  // --------------------------------------------------------------------------
  // Modal Handlers
  // --------------------------------------------------------------------------
  /**
   * Opens a modal for viewing, editing, deleting, or creating an item.
   * @param {MenuItem | null} item - The item to operate on (null for create).
   * @param {"view" | "edit" | "delete" | "create"} type - Modal type.
   */
  const openModal = (
    item: MenuItem | null,
    type: "view" | "edit" | "delete" | "create",
  ): void => {
    setSelectedItem(item);
    setModalType(type);
  };

  /**
   * Closes any open modal and clears the selected item.
   */
  const closeModal = (): void => {
    setModalType(null);
    setSelectedItem(null);
  };

  /**
   * Creates a new menu item and closes the modal on success.
   * @param {Partial<MenuItem>} newItem - Item data from the create form.
   */
  const handleCreate = async (newItem: Partial<MenuItem>): Promise<void> => {
    try {
      await createMenuItem(newItem);
      closeModal();
    } catch (err) {
      console.error("Error creating menu item:", err);
    }
  };

  /**
   * Updates an existing menu item and closes the modal on success.
   * @param {string} itemId - ID of the item to update.
   * @param {Partial<MenuItem>} updates - Updated fields.
   */
  const handleUpdate = async (
    itemId: string,
    updates: Partial<MenuItem>,
  ): Promise<void> => {
    try {
      await updateMenuItem(itemId, updates);
      closeModal();
    } catch (err) {
      console.error("Error updating menu item:", err);
    }
  };

  /**
   * Deletes a menu item and closes the modal on success.
   * @param {string} itemId - ID of the item to delete.
   */
  const handleDelete = async (itemId: string): Promise<void> => {
    try {
      await deleteMenuItem(itemId);
      closeModal();
    } catch (err) {
      console.error("Error deleting menu item:", err);
    }
  };

  // --------------------------------------------------------------------------
  // Conditional Rendering (Loading / Access Denied)
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authLoading && !["admin", "manager"].includes(currentUser?.role || "")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 mx-auto text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You must be an administrator or manager to access this page.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white p-4 md:p-6 mt-18">
      <div className="max-w-7xl mx-auto">
        {/* ----------------------------- */}
        {/* Header & Add Item Button      */}
        {/* ----------------------------- */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Menu Management
              </h1>
              <p className="text-gray-600">
                Manage all menu items in your system
              </p>
            </div>
            <button
              onClick={() => openModal(null, "create")}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Plus className="mr-2" size={20} />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* ----------------------------- */}
        {/* Error Notification            */}
        {/* ----------------------------- */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-800 hover:text-red-900"
            >
              &times;
            </button>
          </div>
        )}

        {/* ----------------------------- */}
        {/* Statistics Cards              */}
        {/* ----------------------------- */}
        <MenuStats stats={stats} />

        {/* ----------------------------- */}
        {/* Filters and Search            */}
        {/* ----------------------------- */}
        <MenuFilters
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

        {/* ----------------------------- */}
        {/* Menu Items Table              */}
        {/* ----------------------------- */}
        <MenuTable
          items={currentItems}
          getCategoryName={getCategoryName}
          onView={(item) => openModal(item, "view")}
          onEdit={(item) => openModal(item, "edit")}
          onDelete={(item) => openModal(item, "delete")}
          onToggleAvailability={handleToggleAvailability}
          formatPrice={formatPrice}
        />

        {/* ----------------------------- */}
        {/* Pagination Controls           */}
        {/* ----------------------------- */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMenuItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        {/* ----------------------------- */}
        {/* Modal Manager                 */}
        {/* ----------------------------- */}
        <ModalManager
          modalType={modalType}
          selectedItem={selectedItem}
          processing={processing}
          onClose={closeModal}
          onUpdate={handleUpdate}
          onCreate={handleCreate}
          onDelete={handleDelete}
          getCategoryName={getCategoryName}
          formatPrice={formatPrice}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default AdminMenuDashboard;
