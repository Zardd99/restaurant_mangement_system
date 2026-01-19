import { MenuItem } from "@/app/hooks/useMenuData";
import MenuItemCard from "../MenuItemCard/MenuItemCard";

export interface FeaturedSectionProps {
  title: string;
  items: MenuItem[];
  filter: string;
  setActiveFilter: (filter: string) => void;
  animationDelay?: number;
}

const FeaturedSection = ({
  title,
  items,
  filter,
  setActiveFilter,
  animationDelay = 0,
}: FeaturedSectionProps) => {
  if (items.length === 0) return null;

  return (
    <section
      className="mb-12 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <button
          onClick={() => setActiveFilter(filter)}
          className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors duration-200 group"
        >
          <span>View All</span>
          <span className="transform group-hover:translate-x-1 transition-transform duration-200">
            →
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {items.map((item, index) => (
          <MenuItemCard
            key={item._id || index}
            item={item}
            animationDelay={index * 0.1}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
