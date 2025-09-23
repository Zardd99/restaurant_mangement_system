import FeaturedSection from "../FeaturedSection/FeaturedSection";
import { MenuItem } from "@/app/hooks/useMenuData";

interface FeaturedSectionsProps {
  menuItems: MenuItem[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const FeaturedSections = ({
  menuItems,
  activeFilter,
  setActiveFilter,
}: FeaturedSectionsProps) => {
  const trendingItems = menuItems
    .filter((item) => item.reviewCount > 10)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  const bestRatedItems = menuItems
    .filter((item) => item.averageRating >= 4)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 4);

  return (
    <>
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
