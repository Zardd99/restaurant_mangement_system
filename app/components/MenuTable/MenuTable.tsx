import React from "react";
import Image from "next/image";
import { Eye, Edit3, Trash2, Clock, Star, ChefHat } from "lucide-react";
import { MenuItem } from "../../hooks/useMenuData";

interface MenuTableProps {
  items: MenuItem[];
  getCategoryName: (category: string | { _id: string; name: string }) => string;
  onView: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string) => void;
  formatPrice: (price: number) => string;
}

const MenuTable: React.FC<MenuTableProps> = ({
  items,
  getCategoryName,
  onView,
  onEdit,
  onDelete,
  onToggleAvailability,
  formatPrice,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <ChefHat className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No menu items found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Item
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dietary Tags
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Prep Time
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Special
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr
                key={item._id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ChefHat className="text-gray-400" size={20} />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {formatPrice(item.price)}
                </td>

                <td className="px-4 py-4 text-sm text-gray-900">
                  {getCategoryName(item.category)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.dietaryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.preparationTime} min
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleAvailability(item._id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        item.availability ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          item.availability ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`ml-2 text-xs font-medium ${
                        item.availability ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {item.availability ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  {item.chefSpecial && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(item)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="View item"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Edit item"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuTable;
