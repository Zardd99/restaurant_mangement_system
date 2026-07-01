"use client";

import { ChefHat, Leaf, Minus } from "lucide-react";
import { MenuItem } from "@/app/hooks/useMenuData";
import { getCategorySwatch } from "./categoryColor";

interface MenuCardProps {
  item: MenuItem;
  quantityInCart: number;
  onAdd: (item: MenuItem) => void;
  onRemoveOne?: (item: MenuItem) => void;
}

const MenuCard = ({ item, quantityInCart, onAdd, onRemoveOne }: MenuCardProps) => {
  const swatch = getCategorySwatch(item.category);
  const isVeg =
    item.dietaryTags?.includes("vegetarian") || item.dietaryTags?.includes("vegan");
  const inCart = quantityInCart > 0;
  const disabled = !item.availability;

  return (
    <button
      type="button"
      onClick={() => !disabled && onAdd(item)}
      disabled={disabled}
      aria-label={`Add ${item.name} to order${inCart ? `, ${quantityInCart} in cart` : ""}`}
      style={{ borderColor: inCart ? swatch.accent : undefined }}
      className={`group relative flex h-full min-h-24 flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1
        ${
          disabled
            ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
            : `bg-white hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] active:shadow-sm ${
                inCart ? "shadow-sm" : "border-gray-200"
              }`
        }`}
    >
      {/* Active cart indicator */}
      {inCart && (
        <span
          style={{ backgroundColor: swatch.accent }}
          className="absolute -right-2 -top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none text-white shadow-md tabular-nums"
        >
          {quantityInCart}
        </span>
      )}

      {/* Category tag + diet/chef markers */}
      <div className="flex items-center justify-between gap-1.5">
        <span
          style={{ color: swatch.accent, backgroundColor: swatch.tint }}
          className="max-w-[70%] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        >
          {swatch.name || "Other"}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {item.chefSpecial && <ChefHat className="h-3.5 w-3.5 text-amber-500" />}
          {isVeg && <Leaf className="h-3.5 w-3.5 text-green-600" />}
        </span>
      </div>

      {/* Name */}
      <span className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900">
        {item.name}
      </span>

      {/* Price + decrement */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tabular-nums text-gray-900">
          ${item.price.toFixed(2)}
        </span>
        {inCart && onRemoveOne && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Remove one ${item.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveOne(item);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onRemoveOne(item);
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Minus className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {disabled && (
        <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gray-200/80 py-0.5 text-center text-[10px] font-semibold text-gray-500">
          Unavailable
        </span>
      )}
    </button>
  );
};

export default MenuCard;
