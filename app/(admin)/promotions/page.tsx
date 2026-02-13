"use client";

/**
 * =============================================================================
 * PROMOTIONS MANAGEMENT PAGE
 * =============================================================================
 * Administrative page for creating, viewing, editing, and deleting promotions.
 * Access restricted to users with 'admin' role.
 *
 * @module PromotionsPage
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import { Plus, Edit, Trash2, Calendar, Zap } from "lucide-react";
import PromotionForm from "../promotions/PromotionForm";
import { promotionApi } from "../../services/promotionApi";

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Represents a single promotion entity as returned by the API.
 */
interface Promotion {
  _id: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: "all" | "category" | "menuItem";
  targetIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: { _id: string; name: string };
  minimumOrderAmount?: number;
  maxUsagePerCustomer?: number;
  usageCount?: number;
}

// -----------------------------------------------------------------------------
// COMPONENT: PromotionsPage
// -----------------------------------------------------------------------------
export default function PromotionsPage() {
  // ===========================================================================
  // AUTHENTICATION & STATE
  // ===========================================================================
  const { user, isLoading: authLoading } = useAuth();

  /** List of all promotions fetched from the backend. */
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  /** Loading state for the initial data fetch. */
  const [loading, setLoading] = useState(true);

  /** Holds any error message encountered during API calls. */
  const [error, setError] = useState<string | null>(null);

  /** Controls visibility of the "Create New Promotion" form. */
  const [showForm, setShowForm] = useState(false);

  /** The promotion currently being edited (null if creating new). */
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );

  // ===========================================================================
  // HELPER FUNCTIONS (Pure / Computed)
  // ===========================================================================

  /**
   * Determines whether a promotion is currently active.
   * A promotion is active if its `isActive` flag is true and the current date
   * falls within its start and end date range.
   *
   * @param promotion - The promotion to evaluate.
   * @returns True if the promotion is active, otherwise false.
   */
  const isPromotionActive = (promotion: Promotion): boolean => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return promotion.isActive && now >= start && now <= end;
  };

  /**
   * Formats the discount value into a human‑readable string.
   *
   * @param promotion - The promotion containing discount data.
   * @returns e.g. "25% OFF" or "$5.00 OFF".
   */
  const getDiscountDisplay = (promotion: Promotion): string => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}% OFF`;
    }
    return `$${promotion.discountValue.toFixed(2)} OFF`;
  };

  // ===========================================================================
  // DATA FETCHING (API)
  // ===========================================================================

  /**
   * Retrieves all promotions from the API and updates the state.
   * Resets error and loading states appropriately.
   */
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionApi.getAll();
      setPromotions(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch promotions");
      console.error("Fetch promotions error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Deletes a promotion after user confirmation.
   * If successful, removes the promotion from the local state.
   *
   * @param promotionId - ID of the promotion to delete.
   */
  const handleDeletePromotion = async (promotionId: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      await promotionApi.delete(promotionId);
      setPromotions((prev) => prev.filter((p) => p._id !== promotionId));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete promotion");
      console.error("Delete promotion error:", err);
    }
  };

  /**
   * Callback invoked after a promotion is successfully created or updated.
   * Refreshes the promotion list and closes the form.
   */
  const handleFormSuccess = () => {
    fetchPromotions();
    setShowForm(false);
    setEditingPromotion(null);
  };

  // ===========================================================================
  // SIDE EFFECTS
  // ===========================================================================

  /**
   * Authorization check: if the user is logged in but not an admin,
   * set an error and stop loading.
   */
  useEffect(() => {
    if (user && user.role !== "admin") {
      setError("You do not have permission to manage promotions.");
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch promotions only when the authenticated user is an admin.
   */
  useEffect(() => {
    if (user?.role === "admin") {
      fetchPromotions();
    }
  }, [user]);

  // ===========================================================================
  // CONDITIONAL RENDERING (Guard Clauses)
  // ===========================================================================

  // Authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white mt-16">
        <div className="text-gray-800">Loading...</div>
      </div>
    );
  }

  // Access denied – user is not an admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white mt-16">
        <div className="text-gray-800 text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>Only administrators can manage promotions.</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================
  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8 mt-16">
      <div className="max-w-6xl mx-auto">
        {/* ------------------------------------------------------------------ */}
        {/* Header – Title, New Promotion Button, Error Display                */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Promotions Management</h1>
            {!showForm && !editingPromotion && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Promotion
              </button>
            )}
          </div>
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Promotion Form (Create / Edit)                                     */}
        {/* ------------------------------------------------------------------ */}
        {(showForm || editingPromotion) && (
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
            </h2>
            <PromotionForm
              promotion={editingPromotion || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingPromotion(null);
              }}
            />
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Promotions List – Loading, Empty, or Grid View                     */}
        {/* ------------------------------------------------------------------ */}
        {loading ? (
          // Loading state
          <div className="text-center py-12">
            <p className="text-gray-600">Loading promotions...</p>
          </div>
        ) : promotions.length === 0 ? (
          // Empty state – no promotions exist
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No Promotions Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first promotion to offer discounts to customers.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Promotion
            </button>
          </div>
        ) : (
          // Promotion grid – display all active/inactive promotions
          <div className="grid gap-4">
            {promotions.map((promotion) => {
              const isActive = isPromotionActive(promotion);
              return (
                <div
                  key={promotion._id}
                  className={`bg-white rounded-lg p-6 border-l-4 shadow-md ${
                    isActive ? "border-red-600" : "border-gray-300"
                  }`}
                >
                  {/* Header with name, status, and discount badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {promotion.name}
                        </h3>
                        {isActive ? (
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-300 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{promotion.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {getDiscountDisplay(promotion)}
                      </div>
                    </div>
                  </div>

                  {/* Key details – applicability, date range, minimum order */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-gray-300">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Applies To</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {promotion.appliesTo === "all"
                          ? "All Items"
                          : promotion.appliesTo === "category"
                            ? "Specific Categories"
                            : "Specific Items"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Date Range
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(promotion.startDate)} to{" "}
                        {formatDate(promotion.endDate)}
                      </p>
                    </div>
                    {promotion.minimumOrderAmount && (
                      <div>
                        <p className="text-gray-600 text-sm mb-1">
                          Minimum Order
                        </p>
                        <p className="font-semibold text-gray-900">
                          ${promotion.minimumOrderAmount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Usage statistics (if available) */}
                  {promotion.usageCount !== undefined && (
                    <div className="mb-4 text-sm text-gray-600">
                      Used {promotion.usageCount} times
                      {promotion.maxUsagePerCustomer &&
                        ` (Max ${promotion.maxUsagePerCustomer} per customer)`}
                    </div>
                  )}

                  {/* Action buttons – Edit and Delete */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingPromotion(promotion)}
                      className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePromotion(promotion._id)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
