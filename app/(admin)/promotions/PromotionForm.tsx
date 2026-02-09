"use client";

import { useState, useEffect } from "react";
import axios, { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { promotionApi } from "../../services/promotionApi";

interface PromotionFormProps {
  promotion?: {
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
  };
  onSuccess: () => void;
  onCancel: () => void;
}

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

export default function PromotionForm({
  promotion,
  onSuccess,
  onCancel,
}: PromotionFormProps) {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const axiosOptions: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    } as Record<string, string>,
    withCredentials: true,
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
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

  const validateForm = () => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumOrderAmount: formData.minimumOrderAmount
          ? parseFloat(formData.minimumOrderAmount)
          : undefined,
        maxUsagePerCustomer: formData.maxUsagePerCustomer
          ? parseInt(formData.maxUsagePerCustomer)
          : undefined,
      };

      if (promotion?._id) {
        // Update existing promotion
        await promotionApi.update(promotion._id, payload);
      } else {
        // Create new promotion
        await promotionApi.create(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save promotion");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
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

        {/* Discount Type */}
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

        {/* Discount Value */}
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

        {/* Applies To */}
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

        {/* Start Date */}
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

        {/* End Date */}
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

        {/* Minimum Order Amount */}
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

        {/* Max Usage Per Customer */}
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

      {/* Description */}
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

      {/* Is Active */}
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

      {/* Actions */}
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
