"use client";

import { ChefHat, Plus } from "lucide-react";
import { MenuItem } from "@/app/hooks/useMenuData";

interface MenuItemRowWaiterProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

const MenuItemRowWaiter = ({ item, onAddToCart }: MenuItemRowWaiterProps) => {
  const categoryName =
    typeof item.category === "string" ? item.category : item.category?.name || "";

  const isVeg =
    item.dietaryTags?.includes("vegetarian") || item.dietaryTags?.includes("vegan");

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 transition-colors ${
        item.availability ? "hover:bg-blue-50/50 bg-white" : "bg-gray-50 opacity-60"
      }`}
    >
      {/* Availability indicator */}
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          item.availability ? "bg-green-400" : "bg-gray-300"
        }`}
      />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {item.name}
          </span>
          {item.chefSpecial && (
            <ChefHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          {isVeg && (
            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1 rounded shrink-0">
              V
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 truncate block">{categoryName}</span>
      </div>

      {/* Price */}
      <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0 min-w-[4.5rem] text-right">
        ${item.price.toFixed(2)}
      </span>

      {/* Add button */}
      <button
        onClick={() => item.availability && onAddToCart(item)}
        disabled={!item.availability}
        aria-label={`Add ${item.name} to order`}
        className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-colors disabled:cursor-not-allowed
          bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white disabled:text-gray-400"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default MenuItemRowWaiter;
