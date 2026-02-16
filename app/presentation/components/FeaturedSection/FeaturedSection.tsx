import { MenuItem } from "@/app/hooks/useMenuData";
import MenuItemCard from "../MenuItemCard/MenuItemCard";

export interface FeaturedSectionProps {
  title: string;
  items: MenuItem[];
  filter: string;
  setActiveFilter: (filter: string) => void;
  animationDelay?: number;
}

/**
 * FeaturedSection – Renders a titled grid of menu items with a "View All" button.
 *
 */
const FeaturedSection = ({
  title,
  items,
  filter,
  setActiveFilter,
  animationDelay = 0,
}: FeaturedSectionProps) => {
  // Early return: if there are no items to display, render nothing.
  // This avoids rendering an empty section and improves performance by skipping unnecessary DOM nodes.
  if (items.length === 0) return null;

  return (
    // The section uses a fade-in-up animation with a configurable delay.
    // The animation class (animate-fade-in-up) is assumed to be defined in global CSS or Tailwind.
    <section
      className="mb-12 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Header row: title on the left, "View All" button on the right */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {/* "View All" button: clicking sets the active filter to this section's filter value.
            This pattern allows the parent component to control the active filter state and
            potentially navigate to a filtered list view. */}
        <button
          onClick={() => setActiveFilter(filter)}
          className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors duration-200 group"
        >
          <span>View All</span>
          {/* Animated arrow to indicate interactivity; group-hover triggers the translation.
              This enhances UX by providing a subtle visual cue. */}
          <span className="transform group-hover:translate-x-1 transition-transform duration-200">
            →
          </span>
        </button>
      </div>

      {/* Responsive grid: 1 column on mobile, 2 columns on medium and large screens.
          The grid automatically handles wrapping and spacing. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {items.map((item, index) => (
          // MenuItemCard is rendered for each item.
          // The key uses item._id if available, falling back to index.
          // Note: Using index as a key can cause issues if the list order changes or items are added/removed,
          // but here it's a fallback in case _id is missing. In a production environment,
          // ensure every item has a unique _id to avoid rendering bugs.
          <MenuItemCard
            key={item._id || index}
            item={item}
            // Staggered animation delay: each card fades in slightly after the previous one.
            // This creates a smooth sequential appearance. The delay is multiplied by 0.1s,
            // so first card gets 0s, second 0.1s, third 0.2s, etc.
            animationDelay={index * 0.1}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
