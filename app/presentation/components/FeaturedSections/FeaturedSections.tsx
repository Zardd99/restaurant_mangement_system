// Import the FeaturedSection component which renders a horizontal scrollable list of menu items.
// MenuItem type defines the structure of a menu item object (imported from a custom hook).
import FeaturedSection from "../FeaturedSection/FeaturedSection";
import { MenuItem } from "@/app/hooks/useMenuData";

/**
 * Props for the FeaturedSections component.
 *
 * @param menuItems - Array of all menu items (unfiltered) from which to derive featured sections.
 * @param activeFilter - Current active filter string (e.g., "all", "trending", "best"). Controls which sections are displayed.
 * @param setActiveFilter - Callback to update the active filter when a section header is clicked.
 */
interface FeaturedSectionsProps {
  menuItems: MenuItem[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

/**
 * FeaturedSections Component
 *
 * This component dynamically generates two featured sections: "Trending Now" and "Best Rated".
 * It filters and sorts the provided menuItems to derive up to 4 items for each section.
 * The sections are conditionally rendered based on the activeFilter:
 * - If activeFilter is "all", both sections are shown.
 * - If activeFilter matches a specific section ("trending" or "best"), only that section is shown.
 *
 * The component is designed to be used on a homepage or menu landing page to highlight popular items.
 */
const FeaturedSections = ({
  menuItems,
  activeFilter,
  setActiveFilter,
}: FeaturedSectionsProps) => {
  // Derive trending items: items with more than 10 reviews, sorted by review count (highest first), limited to 4.
  // This logic assumes that a high review count indicates current popularity/trending status.
  const trendingItems = menuItems
    .filter((item) => item.reviewCount > 10)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  // Derive best rated items: items with average rating >= 4, sorted by rating (highest first), limited to 4.
  // The threshold of 4 ensures only high-quality items are featured.
  const bestRatedItems = menuItems
    .filter((item) => item.averageRating >= 4)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 4);

  return (
    <>
      {/* Trending Now section: rendered if activeFilter is "all" or "trending", and there are items to show.
          The animationDelay prop staggers the entrance animation for a smoother UI experience. */}
      {(activeFilter === "all" || activeFilter === "trending") &&
        trendingItems.length > 0 && (
          <FeaturedSection
            title="Trending Now"
            items={trendingItems}
            filter="trending"
            setActiveFilter={setActiveFilter}
            animationDelay={0.1}
          />
        )}

      {/* Best Rated section: rendered under same conditions as above, but with its own filter and delay. */}
      {(activeFilter === "all" || activeFilter === "best") &&
        bestRatedItems.length > 0 && (
          <FeaturedSection
            title="Best Rated"
            items={bestRatedItems}
            filter="best"
            setActiveFilter={setActiveFilter}
            animationDelay={0.2}
          />
        )}
    </>
  );
};

export default FeaturedSections;
