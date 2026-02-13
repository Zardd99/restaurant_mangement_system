"use client";

// ============================================================================
// Third-Party Libraries
// ============================================================================
import { useState } from "react";

// ============================================================================
// Application Services
// ============================================================================
import { promotionApi } from "../../services/promotionApi";

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Promotion data structure as stored in the backend.
 * Used to pre-fill the form when editing an existing promotion.
 */
export interface Promotion {
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
  minimumOrderAmount?: number;
  maxUsagePerCustomer?: number;
}

/**
 * Props for the PromotionForm component.
 */
interface PromotionFormProps {
  /** Existing promotion data (if editing) – undefined indicates create mode. */
  promotion?: Promotion;
  /** Callback invoked after successful creation or update. */
  onSuccess: () => void;
  /** Callback invoked when user cancels the form. */
  onCancel: () => void;
}

/**
 * Form state structure.
 * All numeric fields are stored as strings to allow flexible input handling.
 * Dates are stored in YYYY-MM-DD format.
 */
interface FormData {
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  appliesTo: "all" | "category" | "menuItem";
  targetIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  minimumOrderAmount: string;
  maxUsagePerCustomer: string;
}

// ============================================================================
// PromotionForm Component
// ============================================================================

/**
 * PromotionForm – Renders a form for creating or editing a promotion.
 *
 * @component
 * @param {PromotionFormProps} props - Component props.
 * @returns {JSX.Element} The rendered form.
 */
export default function PromotionForm({
  promotion,
  onSuccess,
  onCancel,
}: PromotionFormProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  /**
   * Form fields state, initialised from the provided promotion (if any).
   * Dates are stored as the date part (YYYY-MM-DD) by splitting the ISO string.
   */
  const [formData, setFormData] = useState<FormData>({
    name: promotion?.name || "",
    description: promotion?.description || "",
    discountType: promotion?.discountType || "percentage",
    discountValue: promotion?.discountValue.toString() || "",
    appliesTo: promotion?.appliesTo || "all",
    targetIds: promotion?.targetIds || [],
    startDate: promotion?.startDate.split("T")[0] || "",
    endDate: promotion?.endDate.split("T")[0] || "",
    isActive: promotion?.isActive !== false,
    minimumOrderAmount: promotion?.minimumOrderAmount?.toString() || "",
    maxUsagePerCustomer: promotion?.maxUsagePerCustomer?.toString() || "",
  });

  /** API request in progress flag. */
  const [loading, setLoading] = useState<boolean>(false);

  /** Local error message to display to the user. */
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  /**
   * Generic input change handler for all form fields.
   * Handles text inputs, textarea, select, and checkboxes.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e
   */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  /**
   * Validates form data before submission.
   * - Required fields must be filled.
   * - Percentage discount must be between 0 and 100.
   * - Discount value must be positive.
   * - End date must be after start date.
   *
   * @returns {boolean} True if the form passes all validation rules.
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Promotion name is required");
      return false;
    }
    if (!formData.discountValue) {
      setError("Discount value is required");
      return false;
    }
    const discountNum = parseFloat(formData.discountValue);
    if (
      formData.discountType === "percentage" &&
      (discountNum < 0 || discountNum > 100)
    ) {
      setError("Percentage discount must be between 0 and 100");
      return false;
    }
    if (discountNum <= 0) {
      setError("Discount value must be greater than 0");
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      setError("Start and end dates are required");
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("End date must be after start date");
      return false;
    }
    return true;
  };

  // --------------------------------------------------------------------------
  // Form Submission
  // --------------------------------------------------------------------------

  /**
   * Handles form submission.
   * - Prevents default form behaviour.
   * - Clears previous errors.
   * - Validates the form.
   * - Converts string numeric fields to numbers.
   * - Calls the appropriate API method (create or update).
   * - Invokes onSuccess callback upon success.
   * - Catches and displays API errors.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Convert string values to appropriate types for the API.
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumOrderAmount: formData.minimumOrderAmount
          ? parseFloat(formData.minimumOrderAmount)
          : undefined,
        maxUsagePerCustomer: formData.maxUsagePerCustomer
          ? parseInt(formData.maxUsagePerCustomer, 10)
          : undefined,
      };

      if (promotion?._id) {
        // Edit mode: update existing promotion.
        await promotionApi.update(promotion._id, payload);
      } else {
        // Create mode: create new promotion.
        await promotionApi.create(payload);
      }

      onSuccess();
    } catch (err: any) {
      // Display error returned by the API or a generic message.
      setError(err.response?.data?.error || "Failed to save promotion");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Two‑column layout for most fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---------- Promotion Name ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Promotion Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Summer Sale, Birthday Discount"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* ---------- Discount Type ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Discount Type *
          </label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleInputChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </div>

        {/* ---------- Discount Value ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Discount Value * (
            {formData.discountType === "percentage" ? "%" : "$"})
          </label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleInputChange}
            placeholder="0"
            step={formData.discountType === "percentage" ? "0.1" : "0.01"}
            min="0"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* ---------- Applies To ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">Applies To *</label>
          <select
            name="appliesTo"
            value={formData.appliesTo}
            onChange={handleInputChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          >
            <option value="all">All Items</option>
            <option value="category">Specific Categories</option>
            <option value="menuItem">Specific Items</option>
          </select>
        </div>

        {/* ---------- Start Date ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">Start Date *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* ---------- End Date ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">End Date *</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* ---------- Minimum Order Amount (Optional) ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Minimum Order Amount (Optional)
          </label>
          <input
            type="number"
            name="minimumOrderAmount"
            value={formData.minimumOrderAmount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* ---------- Max Usage Per Customer (Optional) ---------- */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Usage Per Customer (Optional)
          </label>
          <input
            type="number"
            name="maxUsagePerCustomer"
            value={formData.maxUsagePerCustomer}
            onChange={handleInputChange}
            placeholder="Unlimited"
            step="1"
            min="1"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* ---------- Description (Optional) ---------- */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description (Optional)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Add details about this promotion..."
          rows={4}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
        />
      </div>

      {/* ---------- Active Status ---------- */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleInputChange}
          className="w-4 h-4 accent-red-600"
        />
        <label className="text-sm font-medium">Active</label>
      </div>

      {/* ---------- Form Actions ---------- */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : promotion
              ? "Update Promotion"
              : "Create Promotion"}
        </button>
      </div>
    </form>
  );
}
