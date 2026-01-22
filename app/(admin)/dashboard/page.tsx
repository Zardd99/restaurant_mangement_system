"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, AlertCircle, ChefHat } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useMenuData, MenuItem } from "../../hooks/useMenuData";
import MenuStats from "../../presentation/components/MenuStats/MenuStat";
import MenuFilters from "../../presentation/components/MenuFilters/MenuFilters";
import MenuTable from "../../presentation/components/MenuTable/MenuTable";
import Pagination from "../../presentation/components/Pagination/Pagination";
import ModalManager from "../../presentation/components/ModalManager/ModalManager";

const AdminMenuDashboard = () => {
  const { isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();

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

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>(["all"]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [chefSpecialFilter, setChefSpecialFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalType, setModalType] = useState<
    "view" | "edit" | "delete" | "create" | null
  >(null);

  const itemsPerPage = 10;

  useEffect(() => {
    if (
      !authLoading &&
      !["admin", "manager"].includes(currentUser?.role || "")
    ) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  const filteredMenuItems = useMemo(() => {
    const getCategoryForFilter = (
      category: string | { _id: string; name: string },
    ): string => {
      if (typeof category === "string") return category;
      return category?.name || "";
    };

    return menuItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const itemCategoryName = getCategoryForFilter(item.category);
      const matchesCategory =
        categoryFilter.length === 0 ||
        categoryFilter.includes("all") ||
        categoryFilter.includes(itemCategoryName);

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
    searchTerm,
    categoryFilter,
    availabilityFilter,
    chefSpecialFilter,
  ]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredMenuItems.slice(startIndex, endIndex);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }, []);

  const handleToggleAvailability = async (itemId: string) => {
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

  const openModal = (
    item: MenuItem | null,
    type: "view" | "edit" | "delete" | "create",
  ) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };

  const handleCreate = async (newItem: Partial<MenuItem>) => {
    try {
      await createMenuItem(newItem);
      closeModal();
    } catch (err) {
      console.error("Error creating menu item:", err);
    }
  };

  const handleUpdate = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      await updateMenuItem(itemId, updates);
      closeModal();
    } catch (err) {
      console.error("Error updating menu item:", err);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      closeModal();
    } catch (err) {
      console.error("Error deleting menu item:", err);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 mt-18">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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

        {/* Error Notification */}
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

        {/* Statistics Cards */}
        <MenuStats stats={stats} />

        {/* Filters and Search Section */}
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

        {/* Menu Items Table */}
        <MenuTable
          items={currentItems}
          getCategoryName={getCategoryName}
          onView={(item) => openModal(item, "view")}
          onEdit={(item) => openModal(item, "edit")}
          onDelete={(item) => openModal(item, "delete")}
          onToggleAvailability={handleToggleAvailability}
          formatPrice={formatPrice}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMenuItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        {/* Modal Manager */}
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
