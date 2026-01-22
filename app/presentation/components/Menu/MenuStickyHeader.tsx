import SearchAndFilterBar from "../SearchAndFilterBar/SearchAndFilterBar";

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
    <div className="sticky top-17 z-30 flex gap-4 items-center mx-auto justify-center">
      <div className="lg:col-span-2 w-full">
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
    </div>
    //     <div className="z-20 bg-white/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-gray-200">
    // </div>
  );
};

export default MenuStickyHeader;
