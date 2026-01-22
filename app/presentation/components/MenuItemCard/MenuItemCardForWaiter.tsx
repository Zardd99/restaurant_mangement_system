import { MenuItem } from "@/app/hooks/useMenuData";
import MenuItemCard from "./MenuItemCard";
import { Plus } from "lucide-react";

interface MenuItemCardForWaiterProps {
  item: MenuItem;
  animationDelay?: number;
  onAddToCart: (item: MenuItem) => void;
}

const MenuItemCardForWaiter: React.FC<MenuItemCardForWaiterProps> = ({
  item,
  animationDelay = 0,
  onAddToCart,
}) => {
  return (
    <div className="relative group">
      <MenuItemCard
        item={item}
        animationDelay={animationDelay}
        variant="waiter"
        onAddToCart={item.availability ? onAddToCart : undefined}
      />

      {!item.availability && (
        <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center z-10 border border-gray-200">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⏸️</span>
            </div>
            <p className="font-bold text-gray-900 text-sm mb-1">
              Temporarily Unavailable
            </p>
          </div>
        </div>
      )}

      {/* Quick Add Button (floating on hover) */}
      {item.availability && (
        <button
          onClick={() => onAddToCart(item)}
          className="absolute bottom-4 right-4 bg-gray-900 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MenuItemCardForWaiter;
