import React from "react";
import Image from "next/image";
import { ChefHat } from "lucide-react";
import { MenuItem } from "../../../hooks/useMenuData";

interface ViewItemModalProps {
  item: MenuItem;
  getCategoryName: (category: string | { _id: string; name: string }) => string;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
  onClose: () => void;
}

const ViewItemModal: React.FC<ViewItemModalProps> = ({
  item,
  getCategoryName,
  formatPrice,
  formatDate,
  onClose,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Menu Item Details
      </h3>
      <div className="space-y-3">
        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <ChefHat className="text-gray-400" size={40} />
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Name</label>
          <p className="text-gray-900">{item.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Description
          </label>
          <p className="text-gray-900">{item.description}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Price</label>
          <p className="text-gray-900">{formatPrice(item.price)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Category</label>
          <p className="text-gray-900">{getCategoryName(item.category)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Dietary Tags
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Preparation Time
          </label>
          <p className="text-gray-900">{item.preparationTime} minutes</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <p
            className={`font-medium ${
              item.availability ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.availability ? "Available" : "Unavailable"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Chef Special
          </label>
          <p className="text-gray-900">{item.chefSpecial ? "Yes" : "No"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Created At
          </label>
          <p className="text-gray-900">{formatDate(item.createdAt)}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewItemModal;
