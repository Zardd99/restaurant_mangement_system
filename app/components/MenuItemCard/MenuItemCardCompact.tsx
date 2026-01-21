import Image from "next/image";
import { MenuItem } from "@/app/hooks/useMenuData";
import StarRating from "../StarRating/StarRating";

interface MenuItemCardCompactProps {
  item: MenuItem;
  animationDelay?: number;
  variant?: "user" | "waiter";
  onAddToCart?: (item: MenuItem) => void;
}

const MenuItemCardCompact: React.FC<MenuItemCardCompactProps> = ({
  item,
  animationDelay = 0,
  variant = "user",
  onAddToCart,
}) => {
  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-black transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Image */}
      <div className="relative h-48 w-full bg-gray-50 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300"></div>
        )}

        {/* Price Tag */}
        <div className="absolute top-3 right-3 bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100">
          <span className="font-bold text-gray-900">
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-3 left-3">
          <div
            className={`w-3 h-3 rounded-full ${item.availability ? "bg-black" : "bg-gray-300"} ring-2 ring-white shadow-sm`}
          />
        </div>

        {item.chefSpecial && (
          <div className="absolute bottom-3 left-3 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
            Chef's Pick
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 line-clamp-1 mb-2 group-hover:text-gray-700 transition-colors">
          {item.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <StarRating rating={item.averageRating} />
          <span className="text-sm font-medium text-gray-900">
            {item.averageRating.toFixed(1)}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed min-h-[2.5rem]">
          {item.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {item.dietaryTags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg"
              >
                {tag}
              </span>
            ))}
          </div>

          {variant === "waiter" && onAddToCart && item.availability && (
            <button
              onClick={() => onAddToCart(item)}
              className="text-xs bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCardCompact;
