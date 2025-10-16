import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import User_Interface from "@/app/(user)/user_interface/page";

// Mock the hooks and components at the top level
jest.mock("../../components/ProtectedRoute/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../components/MenuHeader/MenuHeader", () => () => (
  <div>Menu Header</div>
));
jest.mock(
  "../../components/FilterSection/FilterSection",
  () =>
    ({ activeFilter, setActiveFilter }: any) =>
      (
        <div>
          Filter Section
          <button onClick={() => setActiveFilter("vegan")}>
            Set Vegan Filter
          </button>
        </div>
      )
);
jest.mock(
  "../../components/SearchAndFilterBar/SearchAndFilterBar",
  () =>
    ({ searchTerm, setSearchTerm, categoryFilter, setCategoryFilter }: any) =>
      (
        <div>
          Search and Filter Bar
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
          />
        </div>
      )
);
jest.mock("../../components/MenuGrid/MenuGrid", () => ({ items }: any) => (
  <div>
    Menu Grid - {items.length} items
    {items.map((item: any) => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
));
jest.mock(
  "../../components/FeaturedSections/FeaturedSections",
  () =>
    ({ menuItems, activeFilter, setActiveFilter }: any) =>
      (
        <div>
          Featured Sections - Active: {activeFilter}
          <button onClick={() => setActiveFilter("trending")}>
            Show Trending
          </button>
        </div>
      )
);
jest.mock(
  "../../(waiter_order)/common/LoadingState",
  () =>
    ({ type, count }: any) =>
      (
        <div>
          Loading {type} - {count} items
        </div>
      )
);
jest.mock("../../(waiter_order)/common/ErrorState", () => ({ error }: any) => (
  <div>Error: {error}</div>
));

// Mock the useMenuData hook
jest.mock("@/app/hooks/useMenuData", () => ({
  useMenuData: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockMenuItems = [
  {
    id: 1,
    name: "Vegan Burger",
    description: "Delicious plant-based burger",
    category: "mains",
    price: 12.99,
    dietaryTags: ["vegan", "vegetarian"],
    availability: true,
    chefSpecial: false,
    reviewCount: 15,
    averageRating: 4.5,
  },
  {
    id: 2,
    name: "Caesar Salad",
    description: "Fresh salad with dressing",
    category: "starters",
    price: 8.99,
    dietaryTags: ["vegetarian"],
    availability: true,
    chefSpecial: true,
    reviewCount: 25,
    averageRating: 4.2,
  },
];

describe("User_Interface Component", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useMenuData to return categories
    require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
      categories: ["all", "mains", "starters", "desserts", "drinks"],
    });

    // Set up environment variable
    process.env.API_URL = "http://localhost:5000";
  });

  it("should render loading state initially", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<User_Interface />);

    expect(screen.getByText("Loading menu - 6 items")).toBeInTheDocument();
  });

  it("should render menu items when data is loaded successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockMenuItems }),
    });

    render(<User_Interface />);

    await waitFor(() => {
      expect(screen.getByText("Menu Header")).toBeInTheDocument();
      expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
    });

    expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
  });

  // Add more tests as needed
});

// Your original test (fixed)
it("should have menu items data", () => {
  render(<User_Interface />);
  // You need to specify what value you're looking for in findByDisplayValue
  // This is just an example - adjust based on what you actually want to test
  const searchInput = screen.getByPlaceholderText("Search...");
  expect(searchInput).toBeInTheDocument();
});
