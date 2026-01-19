import SearchAndFilterBar from "../SearchAndFilterBar/SearchAndFilterBar";
import MenuTopItemsChartBW from "../MenuStats/MenuTopItemsChartBW";

interface MenuStickyHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string[];
  setCategoryFilter: (categories: string[]) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (filter: string) => void;
  chefSpecialFilter: string;
  setChefSpecialFilter: (filter: string) => void;
  categories: string[];
  orders: any[];
}

const MenuStickyHeader = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,  
  availabilityFilter,
  setAvailabilityFilter,
  chefSpecialFilter,
  setChefSpecialFilter,
  categories,
  orders,
}: MenuStickyHeaderProps) => {
  return (
    <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            availabilityFilter={availabilityFilter}
            setAvailabilityFilter={setAvailabilityFilter}
            chefSpecialFilter={chefSpecialFilter}
            setChefSpecialFilter={setChefSpecialFilter}
            categories={categories}
          />
        </div>

        <div>
          <MenuTopItemsChartBW orders={orders} />
        </div>
      </div>
    </div>
  );
};

export default MenuStickyHeader;
