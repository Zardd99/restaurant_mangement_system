"use client";

import { Search } from "lucide-react";
import { MenuItem } from "@/app/hooks/useMenuData";
import MenuCard from "./MenuCard";

interface MenuGridProps {
  items: MenuItem[];
  cartQuantities: Record<string, number>;
  onAdd: (item: MenuItem) => void;
  onRemoveOne?: (item: MenuItem) => void;
  emptyHint?: string;
}

const MenuGrid = ({
  items,
  cartQuantities,
  onAdd,
  onRemoveOne,
  emptyHint = "Change your filters",
}: MenuGridProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Search className="mb-3 h-8 w-8" />
        <p className="text-sm font-medium">No items found</p>
        <p className="mt-1 text-xs">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 xl:grid-cols-4">
      {items.map((item) => (
        <MenuCard
          key={item._id}
          item={item}
          quantityInCart={cartQuantities[item._id] ?? 0}
          onAdd={onAdd}
          onRemoveOne={onRemoveOne}
        />
      ))}
    </div>
  );
};

export default MenuGrid;
