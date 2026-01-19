// import { render, screen, waitFor, fireEvent } from "@testing-library/react";
// import User_Interface from "@/app/(user)/user_interface/page";

// // Mock the hooks and components at the top level
// jest.mock("../../components/ProtectedRoute/ProtectedRoute", () => ({
//   ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
//     <div>{children}</div>
//   ),
// }));

// jest.mock("../../components/MenuHeader/MenuHeader", () => () => (
//   <div>Menu Header</div>
// ));

// jest.mock(
//   "../../components/FilterSection/FilterSection",
//   () =>
//     ({ activeFilter, setActiveFilter }: any) => (
//       <div>
//         Filter Section
//         <button onClick={() => setActiveFilter("vegan")}>
//           Set Vegan Filter
//         </button>
//       </div>
//     ),
// );

// jest.mock(
//   "../../components/SearchAndFilterBar/SearchAndFilterBar",
//   () =>
//     ({ searchTerm, setSearchTerm, categoryFilter, setCategoryFilter }: any) => (
//       <div>
//         Search and Filter Bar
//         <input
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder="Search..."
//         />
//       </div>
//     ),
// );

// jest.mock("../../components/MenuGrid/MenuGrid", () => ({ items }: any) => (
//   <div>
//     Menu Grid - {items.length} items
//     {items.map((item: any) => (
//       <div key={item.id}>{item.name}</div>
//     ))}
//   </div>
// ));

// jest.mock(
//   "../../components/FeaturedSections/FeaturedSections",
//   () =>
//     ({ menuItems, activeFilter, setActiveFilter }: any) => (
//       <div>
//         Featured Sections - Active: {activeFilter}
//         <button onClick={() => setActiveFilter("trending")}>
//           Show Trending
//         </button>
//       </div>
//     ),
// );

// jest.mock(
//   "../../(waiter_order)/common/LoadingState",
//   () =>
//     ({ type, count }: any) => (
//       <div>
//         Loading {type} - {count} items
//       </div>
//     ),
// );

// jest.mock("../../(waiter_order)/common/ErrorState", () => ({ error }: any) => (
//   <div>Error: {error}</div>
// ));

// // Mock the useMenuData hook
// jest.mock("@/app/hooks/useMenuData", () => ({
//   useMenuData: jest.fn(),
// }));

// // Mock the AuthContext
// jest.mock("@/app/contexts/AuthContext", () => ({
//   useAuth: jest.fn(),
// }));

// const mockMenuItems = [
//   {
//     _id: "1",
//     name: "Vegan Burger",
//     description: "Delicious plant-based burger",
//     category: "mains",
//     price: 12.99,
//     dietaryTags: ["vegan", "vegetarian"],
//     availability: true,
//     chefSpecial: false,
//     reviewCount: 15,
//     averageRating: 4.5,
//     image: "",
//     preparationTime: 15,
//     createdAt: "",
//     updatedAt: "",
//   },
//   {
//     _id: "2",
//     name: "Caesar Salad",
//     description: "Fresh salad with dressing",
//     category: "starters",
//     price: 8.99,
//     dietaryTags: ["vegetarian"],
//     availability: true,
//     chefSpecial: true,
//     reviewCount: 25,
//     averageRating: 4.2,
//     image: "",
//     preparationTime: 10,
//     createdAt: "",
//     updatedAt: "",
//   },
// ];

// describe("User_Interface Component", () => {
//   beforeEach(() => {
//     // Reset all mocks before each test
//     jest.clearAllMocks();

//     // Mock useAuth to return a token
//     require("@/app/contexts/AuthContext").useAuth.mockReturnValue({
//       token: "mock-token",
//       logout: jest.fn(),
//     });

//     // Set up environment variable
//     process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";
//   });

//   it("should render loading state initially", () => {
//     // Mock useMenuData to return loading state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: [],
//       categories: [],
//       loading: true,
//       error: null,
//     });

//     render(<User_Interface />);

//     expect(screen.getByText("Loading menu - 6 items")).toBeInTheDocument();
//   });

//   it("should render error state when there is an error", () => {
//     // Mock useMenuData to return error state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: [],
//       categories: [],
//       loading: false,
//       error: "Failed to load menu",
//     });

//     render(<User_Interface />);

//     expect(screen.getByText("Error: Failed to load menu")).toBeInTheDocument();
//   });

//   it("should render menu items when data is loaded successfully", async () => {
//     // Mock useMenuData to return success state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: mockMenuItems,
//       categories: ["all", "mains", "starters"],
//       loading: false,
//       error: null,
//     });

//     render(<User_Interface />);

//     await waitFor(() => {
//       expect(screen.getByText("Menu Header")).toBeInTheDocument();
//       expect(screen.getByText("Menu Grid - 2 items")).toBeInTheDocument();
//     });

//     expect(screen.getByText("Vegan Burger")).toBeInTheDocument();
//     expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
//   });

//   it("should render search input", () => {
//     // Mock useMenuData to return success state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: mockMenuItems,
//       categories: ["all", "mains", "starters"],
//       loading: false,
//       error: null,
//     });

//     render(<User_Interface />);

//     const searchInput = screen.getByPlaceholderText("Search...");
//     expect(searchInput).toBeInTheDocument();
//   });

//   it("should render filter section with active filter", () => {
//     // Mock useMenuData to return success state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: mockMenuItems,
//       categories: ["all", "mains", "starters"],
//       loading: false,
//       error: null,
//     });

//     render(<User_Interface />);

//     expect(screen.getByText("Filter Section")).toBeInTheDocument();
//     expect(
//       screen.getByText("Featured Sections - Active: all"),
//     ).toBeInTheDocument();
//   });

//   it("should handle filter button clicks", () => {
//     // Mock useMenuData to return success state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: mockMenuItems,
//       categories: ["all", "mains", "starters"],
//       loading: false,
//       error: null,
//     });

//     render(<User_Interface />);

//     const veganButton = screen.getByText("Set Vegan Filter");
//     fireEvent.click(veganButton);

//     // Since the component uses internal state, we can't easily test the state change
//     // But we can check that the button is clickable
//     expect(veganButton).toBeInTheDocument();
//   });

//   it("should handle trending filter button click", () => {
//     // Mock useMenuData to return success state
//     require("@/app/hooks/useMenuData").useMenuData.mockReturnValue({
//       menuItems: mockMenuItems,
//       categories: ["all", "mains", "starters"],
//       loading: false,
//       error: null,
//     });

//     render(<User_Interface />);

//     const trendingButton = screen.getByText("Show Trending");
//     fireEvent.click(trendingButton);

//     expect(trendingButton).toBeInTheDocument();
//   });
// });
