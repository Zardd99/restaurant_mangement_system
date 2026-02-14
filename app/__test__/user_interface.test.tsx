process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
jest.mock("../contexts/AuthContext");
jest.mock("../hooks/useMenuData");
jest.mock("../hooks/useOrders");

// Now import the hooks (they will be mocked)
import { useAuth } from "../contexts/AuthContext";
import { useMenuData } from "../hooks/useMenuData";
import { useOrders } from "../hooks/useOrders";

import Menu from "../(user)/user_interface/page";

// ----------------------------------------------------------------------
// Mock all child components with simple implementations for testing
// ----------------------------------------------------------------------

jest.mock("../presentation/components/ProtectedRoute/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("../presentation/components/MenuHeader/MenuHeader", () => () => (
  <div data-testid="menu-header">Menu Header</div>
));

jest.mock(
  "../presentation/components/FeaturedSections/FeaturedSections",
  () => ({
    __esModule: true,
    default: ({ menuItems, activeFilter, setActiveFilter }: any) => (
      <div data-testid="featured-sections">
        <span>Featured Sections - Active: {activeFilter}</span>
        <button onClick={() => setActiveFilter("trending")}>
          Show Trending
        </button>
      </div>
    ),
  }),
);

jest.mock("../presentation/components/FilterSection/FilterSection", () => ({
  __esModule: true,
  default: ({ activeFilter, setActiveFilter }: any) => (
    <div data-testid="filter-section">
      <span>Filter Section</span>
      <button onClick={() => setActiveFilter("vegan")}>Set Vegan Filter</button>
      <button onClick={() => setActiveFilter("vegetarian")}>
        Set Vegetarian Filter
      </button>
      <button onClick={() => setActiveFilter("trending")}>
        Set Trending Filter
      </button>
      <button onClick={() => setActiveFilter("best")}>Set Best Filter</button>
    </div>
  ),
}));

jest.mock("../presentation/components/MenuGrid/MenuGrid", () => ({
  __esModule: true,
  default: ({
    items,
    onClearFilters,
  }: {
    items: any[];
    onClearFilters: () => void;
  }) => (
    <div data-testid="menu-grid">
      <div>Menu Grid - {items.length} items</div>
      {items.map((item) => (
        <div key={item._id} data-testid="menu-item">
          {item.name}
        </div>
      ))}
      <button onClick={onClearFilters} data-testid="clear-filters">
        Clear Filters
      </button>
    </div>
  ),
}));

jest.mock("../presentation/components/Menu/MenuStickyHeader", () => ({
  __esModule: true,
  default: ({
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    availabilityFilter,
    setAvailabilityFilter,
    chefSpecialFilter,
    setChefSpecialFilter,
    categories,
  }: any) => (
    <div data-testid="sticky-header">
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
        data-testid="search-input"
      />
      <select
        value={categoryFilter[0] || "all"}
        onChange={(e) => setCategoryFilter([e.target.value])}
        data-testid="category-select"
      >
        <option value="all">All Categories</option>
        {categories.map((cat: string) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <select
        value={availabilityFilter}
        onChange={(e) => setAvailabilityFilter(e.target.value)}
        data-testid="availability-select"
      >
        <option value="all">All</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
      <select
        value={chefSpecialFilter}
        onChange={(e) => setChefSpecialFilter(e.target.value)}
        data-testid="chef-special-select"
      >
        <option value="all">All</option>
        <option value="special">Chef Special</option>
        <option value="regular">Regular</option>
      </select>
    </div>
  ),
}));

jest.mock("../presentation/components/MenuStats/MenuTopItemsChartBW", () => ({
  __esModule: true,
  default: () => <div data-testid="top-items-chart" />,
}));

// ----------------------------------------------------------------------
// Test data
// ----------------------------------------------------------------------
const mockMenuItems = [
  {
    _id: "1",
    name: "Vegan Burger",
    description: "Delicious plant-based burger",
    category: "mains",
    price: 12.99,
    dietaryTags: ["vegan", "vegetarian"],
    availability: true,
    chefSpecial: false,
    reviewCount: 15,
    averageRating: 4.5,
    image: "",
    preparationTime: 15,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "2",
    name: "Caesar Salad",
    description: "Fresh salad with dressing",
    category: "starters",
    price: 8.99,
    dietaryTags: ["vegetarian"],
    availability: true,
    chefSpecial: true,
    reviewCount: 25,
    averageRating: 4.2,
    image: "",
    preparationTime: 10,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "3",
    name: "Steak",
    description: "Grilled to perfection",
    category: "mains",
    price: 24.99,
    dietaryTags: [],
    availability: false,
    chefSpecial: false,
    reviewCount: 5,
    averageRating: 4.8,
    image: "",
    preparationTime: 20,
    createdAt: "",
    updatedAt: "",
  },
];

const mockCategories = ["mains", "starters", "desserts"];
const mockOrders: any[] = [];

// ----------------------------------------------------------------------
// Test suite
// ----------------------------------------------------------------------
describe("Menu Page (User Interface)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({
      token: "mock-token",
      logout: jest.fn(),
    });

    // Mock useOrders
    (useOrders as jest.Mock).mockReturnValue({
      orders: mockOrders,
      loading: false,
      error: null,
    });

    // Default mock for useMenuData (will be overridden per test)
    (useMenuData as jest.Mock).mockReturnValue({
      menuItems: [],
      categories: [],
      loading: false,
      error: null,
      getCategoryForFilter: (cat: any) =>
        typeof cat === "string" ? cat : cat?.name || "",
    });
  });

  // --------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------
  it("shows empty grid when loading and no items", () => {
    (useMenuData as jest.Mock).mockReturnValue({
      menuItems: [],
      categories: [],
      loading: true,
      error: null,
      getCategoryForFilter: () => "",
    });

    render(<Menu />);

    expect(screen.getByTestId("menu-header")).toBeInTheDocument();
    expect(screen.getByText("Menu Grid - 0 items")).toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // Error state
  // --------------------------------------------------------------------
  it("renders without crashing when there is an error (error not displayed)", () => {
    (useMenuData as jest.Mock).mockReturnValue({
      menuItems: [],
      categories: [],
      loading: false,
      error: "Failed to load",
      getCategoryForFilter: () => "",
    });

    render(<Menu />);

    expect(screen.getByTestId("menu-header")).toBeInTheDocument();
    expect(screen.getByTestId("filter-section")).toBeInTheDocument();
    // No error message shown
    expect(screen.queryByText(/Failed to load/i)).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // Successful render with items
  // --------------------------------------------------------------------
  it("renders menu items when data is loaded", async () => {
    (useMenuData as jest.Mock).mockReturnValue({
      menuItems: mockMenuItems,
      categories: mockCategories,
      loading: false,
      error: null,
      getCategoryForFilter: (cat: any) =>
        typeof cat === "string" ? cat : cat?.name || "",
    });

    render(<Menu />);

    await waitFor(() => {
      expect(screen.getByText("Menu Grid - 3 items")).toBeInTheDocument();
    });

    expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("Steak")).toBeInTheDocument();
    expect(screen.getByTestId("menu-header")).toBeInTheDocument();
    expect(screen.getByTestId("filter-section")).toBeInTheDocument();
    expect(screen.getByTestId("sticky-header")).toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // Filter interactions
  // --------------------------------------------------------------------
  describe("filtering", () => {
    beforeEach(() => {
      (useMenuData as jest.Mock).mockReturnValue({
        menuItems: mockMenuItems,
        categories: mockCategories,
        loading: false,
        error: null,
        getCategoryForFilter: (cat: any) =>
          typeof cat === "string" ? cat : cat?.name || "",
      });
    });

    it("filters by vegan quick filter", () => {
      render(<Menu />);

      fireEvent.click(screen.getByText("Set Vegan Filter"));

      expect(screen.getByText("Menu Grid - 1 items")).toBeInTheDocument();
      expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
      expect(screen.queryByText("Caesar Salad")).not.toBeInTheDocument();
      expect(screen.queryByText("Steak")).not.toBeInTheDocument();
    });

    it("filters by vegetarian quick filter", () => {
      render(<Menu />);
      fireEvent.click(screen.getByText("Set Vegetarian Filter"));

      expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
      expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
      expect(screen.queryByText("Steak")).not.toBeInTheDocument();
    });

    it("filters by trending quick filter (top 6 by reviewCount >10)", () => {
      render(<Menu />);
      fireEvent.click(screen.getByText("Set Trending Filter"));

      expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
      expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
      expect(screen.queryByText("Steak")).not.toBeInTheDocument();
    });

    it("filters by best quick filter (averageRating >=4)", () => {
      render(<Menu />);
      fireEvent.click(screen.getByText("Set Best Filter"));

      expect(screen.getByText("Menu Grid - 3 items")).toBeInTheDocument();
    });

    it("filters by search term", async () => {
      render(<Menu />);

      const searchInput = screen.getByTestId("search-input");
      await userEvent.type(searchInput, "salad");

      expect(screen.getByText("Menu Grid - 1 items")).toBeInTheDocument();
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
      expect(screen.queryByText("Vegan Burger")).not.toBeInTheDocument();
    });

    it("filters by category", async () => {
      render(<Menu />);

      const categorySelect = screen.getByTestId("category-select");
      await userEvent.selectOptions(categorySelect, "mains");

      expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
      expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
      expect(screen.getByText("Steak")).toBeInTheDocument();
      expect(screen.queryByText("Caesar Salad")).not.toBeInTheDocument();
    });

    it("filters by availability", async () => {
      render(<Menu />);

      const availabilitySelect = screen.getByTestId("availability-select");
      await userEvent.selectOptions(availabilitySelect, "available");

      expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
      expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
      expect(screen.queryByText("Steak")).not.toBeInTheDocument();
    });

    it("filters by chef special", async () => {
      render(<Menu />);

      const specialSelect = screen.getByTestId("chef-special-select");
      await userEvent.selectOptions(specialSelect, "special");

      expect(screen.getByText("Menu Grid - 1 items")).toBeInTheDocument();
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
      expect(screen.queryByText("Vegan Burger")).not.toBeInTheDocument();
    });

    it("clears all filters when clear button is clicked", async () => {
      render(<Menu />);

      // Apply some filters
      fireEvent.click(screen.getByText("Set Vegan Filter"));
      await userEvent.type(screen.getByTestId("search-input"), "burger");
      expect(screen.getByText("Menu Grid - 1 items")).toBeInTheDocument(); // Vegan Burger only

      // Click clear filters
      fireEvent.click(screen.getByTestId("clear-filters"));

      // All items should be back
      expect(screen.getByText("Menu Grid - 3 items")).toBeInTheDocument();

      // Search input should be cleared
      expect(screen.getByTestId("search-input")).toHaveValue("");
      // Category should be reset to "all"
      expect(screen.getByTestId("category-select")).toHaveValue("all");
      // Availability should be reset to "all"
      expect(screen.getByTestId("availability-select")).toHaveValue("all");
      // Chef special should be reset to "all"
      expect(screen.getByTestId("chef-special-select")).toHaveValue("all");
    });
  });

  // --------------------------------------------------------------------
  // Featured Sections interaction (trending button)
  // --------------------------------------------------------------------
  it("changes active filter when Show Trending button in FeaturedSections is clicked", () => {
    (useMenuData as jest.Mock).mockReturnValue({
      menuItems: mockMenuItems,
      categories: mockCategories,
      loading: false,
      error: null,
      getCategoryForFilter: (cat: any) =>
        typeof cat === "string" ? cat : cat?.name || "",
    });

    render(<Menu />);

    // Click Show Trending inside FeaturedSections
    fireEvent.click(screen.getByText("Show Trending"));

    // The activeFilter should become "trending", which filters by reviewCount >10
    expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
  });
});
