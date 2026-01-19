import Image from "next/image";
import { MenuItem } from "@/app/hooks/useMenuData";
import StarRating from "../StarRating/StarRating";

interface MenuItemCardProps {
  item: MenuItem;
  addToOrder: (item: MenuItem) => void;
  animationDelay?: number;
}

const MenuItemCard = ({
  item,
  addToOrder,
  animationDelay = 0,
}: MenuItemCardProps) => {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {item.chefSpecial && (
        <div className="absolute top-4 right-4 bg-black text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg z-10 transform group-hover:scale-110 transition-transform duration-300">
          ✨ Chefs Special
        </div>
      )}

      <div className="relative h-56 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-2">🍽️</span>
            <span>No image available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
            {item.name}
          </h3>
          <p className="text-xl font-bold text-green-600 transform group-hover:scale-110 transition-transform duration-300">
            ${item.price.toFixed(2)}
          </p>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
          {item.description}
        </p>

        <div className="flex justify-between items-center mb-5">
          <StarRating rating={item.averageRating} />
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="flex flex-col gap-4 space-x-1">
              {item.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full transform group-hover:scale-105 transition-transform duration-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => addToOrder(item)}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            item.availability
              ? "bg-black text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!item.availability}
        >
          {item.availability ? (
            <div className="flex items-center justify-center">
              <span className="mr-2">🛒</span>
              Add to Cart
            </div>
          ) : (
            "Out of Stock"
          )}
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
