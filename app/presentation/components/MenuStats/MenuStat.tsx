import React from "react";
import { ChefHat, Tag, Star, Filter } from "lucide-react";
import { MenuStats } from "@/app/hooks/useMenuData";

interface MenuStatsProps {
  stats: MenuStats;
}

const MenuStat: React.FC<MenuStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl">
            <ChefHat className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.available}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <Tag className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Chef Specials</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.chefSpecials}
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl">
            <Star className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.categories}
            </p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <Filter className="text-orange-600" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuStat;
