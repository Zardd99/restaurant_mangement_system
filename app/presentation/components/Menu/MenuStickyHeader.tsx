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
    <div className="fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 items-center justify-center">
      <div className="w-full">
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
