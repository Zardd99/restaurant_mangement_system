import Image from "next/image";
import { MenuItem } from "@/app/hooks/useMenuData";
import StarRating from "../StarRating/StarRating";
import { Tag, Clock, ChefHat, Zap } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem & {
    effectivePrice?: number;
    originalPrice?: number;
    appliedPromotion?: {
      id: string;
      name: string;
      discountType: string;
      discountValue: number;
      discountAmount: number;
    } | null;
  };
  animationDelay?: number;
  variant?: "user" | "waiter";
  onAddToCart?: (item: MenuItem) => void;
}

const MenuItemCard = ({
  item,
  animationDelay = 0,
  variant = "user",
  onAddToCart,
}: MenuItemCardProps) => {
  const categoryName =
    typeof item.category === "string"
      ? item.category
      : item.category?.name || "";

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="relative w-full md:w-32 h-40 md:h-auto bg-gray-100 flex-shrink-0">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 128px"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <ChefHat className="w-10 h-10" />
            </div>
          )}

          {item.chefSpecial && (
            <div className="absolute top-2 left-2 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">
              Chef's Pick
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 md:p-4 min-w-0">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-gray-900 break-words hyphens-auto"
                title={item.name}
              >
                {item.name}
              </h3>
              {categoryName && (
                <p
                  className="text-xs text-gray-500 mt-0.5 break-words"
                  title={categoryName}
                >
                  {categoryName}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-gray-900 flex items-center justify-end gap-2 mb-1">
                {item.appliedPromotion &&
                item.effectivePrice !== undefined &&
                item.effectivePrice < item.price ? (
                  <>
                    <span className="text-sm line-through text-gray-500">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-lg text-red-600">
                      ${item.effectivePrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span>${item.price.toFixed(2)}</span>
                )}
              </div>

              {item.appliedPromotion &&
                item.effectivePrice !== undefined &&
                item.effectivePrice < item.price && (
                  <div className="flex items-center justify-end gap-1 mb-1">
                    <Zap className="w-3 h-3 text-red-600" />
                    <span className="text-xs font-semibold text-red-600">
                      {item.appliedPromotion.discountType === "percentage"
                        ? `${item.appliedPromotion.discountValue}% OFF`
                        : `Save $${item.appliedPromotion.discountAmount.toFixed(2)}`}
                    </span>
                  </div>
                )}

              <div className="flex items-center gap-1 mt-1 justify-end">
                <StarRating rating={item.averageRating} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="h-12 overflow-y-auto mb-3 scrollbar-thin">
            <p className="text-sm text-gray-600 break-words leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Tags and Availability */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {item.dietaryTags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded break-words max-w-[100px]"
                title={tag}
              >
                {tag}
              </span>
            ))}
            <span
              className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${item.availability ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {item.availability ? "In Stock" : "Out"}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>15-20 min</span>
            </div>

            {variant === "waiter" && onAddToCart && item.availability && (
              <button
                onClick={() => onAddToCart(item)}
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
              >
                Add to Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
