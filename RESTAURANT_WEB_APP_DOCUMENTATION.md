# Restaurant Web Application - Technical Documentation

**Version:** 0.1.0  
**Technology:** Next.js 16 with React 19 & TypeScript  
**Last Updated:** February 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture & Design](#architecture--design)
3. [Module Breakdown](#module-breakdown)
4. [State Management](#state-management)
5. [Component Architecture](#component-architecture)
6. [Implementation Logic](#implementation-logic)
7. [API Integration](#api-integration)
8. [Setup & Deployment](#setup--deployment)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)

---

## Executive Summary

### Project Overview

**Restaurant Web Application** is a comprehensive multi-role web interface built with Next.js for restaurant management. It provides distinct user experiences for admin, manager, chef, waiter, and cashier roles, enabling real-time order management, inventory tracking, analytics dashboards, and customer interactions.

### Primary Value Proposition

- **Multi-Role Dashboard System**: Tailored interfaces for different restaurant staff based on role
- **Real-Time Order Management**: Live updates using WebSocket (Socket.io) integration
- **Kitchen Display System (KDS)**: Large-screen interface for kitchen staff to manage orders
- **Inventory Management**: Staff can deduct ingredients and track low-stock alerts
- **Admin Analytics**: Comprehensive dashboards with sales metrics and trend analysis
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern Stack**: Built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS

### Technology Stack

| Technology             | Purpose                 | Version |
| ---------------------- | ----------------------- | ------- |
| **Next.js**            | Framework & SSR         | ^16.1.3 |
| **React**              | UI Library              | ^19.2.3 |
| **TypeScript**         | Type Safety             | Latest  |
| **Tailwind CSS**       | Styling                 | ^4      |
| **Socket.io-client**   | Real-time communication | ^4.8.1  |
| **Axios**              | HTTP client             | ^1.12.1 |
| **React Hook Form**    | Form management         | ^7.62.0 |
| **Chart.js**           | Data visualization      | ^4.5.1  |
| **JWT (jsonwebtoken)** | Authentication tokens   | ^9.0.2  |
| **MongoDB/Mongoose**   | Backend database        | Latest  |

---

## Architecture & Design

### System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                 Restaurant Web Application (Next.js)             │
│                         Port: 3000                               │
└───────┬────────────────────────────────────────────────────────┬─┘
        │                                                         │
   ┌────────────────────────────┬───────────────────────────┐    │
   │    HTTP REST API           │   WebSocket (Socket.io)   │    │
   └────────┬───────────────────┴───────────────┬───────────┘    │
            │                                   │                │
   ┌────────────────────────────────────────────────────────┐    │
   │         Backend API Server (Express)                   │    │
   │                 Port: 5000                             │    │
   └────────┬──────────────────────────────┬────────────────┘    │
            │                              │                     │
     ┌──────────────────┐         ┌────────────────┐             │
     │   MongoDB        │         │ Email Service  │             │
     │   (Database)     │         │  (Nodemailer)  │             │
     └──────────────────┘         └────────────────┘             │
```

### Application Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Client Application Layer                       │
│                  (Next.js App Router)                       │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                         │
│  ├─ Pages (Admin, Waiter, Chef, User routes)             │
│  ├─ Components (Reusable UI components)                   │
│  └─ Layouts (Navigation, sidebar, main content)           │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer                                     │
│  ├─ Context API (Auth, Socket, Search, WebSocket)        │
│  ├─ React Hooks (useState, useEffect, useCallback)        │
│  └─ Local Storage (Order persistence)                     │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Business Logic)                         │
│  ├─ Hooks (useOrderManager, useMenuData, useStats)       │
│  ├─ Use Cases (OrderUseCases, OrderManager)              │
│  ├─ ViewModels (Data formatting)                          │
│  └─ Managers (Inventory, Stats)                           │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer                                               │
│  ├─ Models (Order, MenuItem, User, etc.)                  │
│  ├─ Repositories (LocalStorage, HTTP-based)              │
│  └─ Business Rules (Validation, Constraints)             │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ├─ API Client (Axios with Auth interceptors)            │
│  ├─ WebSocket Client (Socket.io)                         │
│  └─ Local Storage (IndexedDB, SessionStorage)            │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### 1. **Container/Presentational Component Pattern**

**Smart Components (Containers):**

- Handle business logic and API calls
- Manage state
- Connect to contexts and hooks
- Example: `WaiterOrderInterface.tsx`

```typescript
// Smart Component
const WaiterOrderInterface = () => {
  const { token, user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { currentOrder } = useOrderManager();

  useEffect(() => {
    // Business logic
    loadOrders();
  }, [token]);

  return <OrderDisplay items={currentOrder} />;
};
```

**Dumb Components (Presentational):**

- Receive props only
- Render UI based on props
- No business logic
- Example: `OrderCard.tsx`

```typescript
// Dumb Component
const OrderCard = ({ order, onStatusChange }) => {
  return (
    <div>
      <h3>{order.items.length} items</h3>
      <button onClick={() => onStatusChange("ready")}>Ready</button>
    </div>
  );
};
```

#### 2. **Context API for State Management**

Global state is managed through React Context:

```
AuthContext
├─ user: User | null
├─ token: string | null
├─ login(): Promise<void>
├─ logout(): void
└─ updateUser(): void

SocketContext
├─ socket: Socket | null
├─ isConnected: boolean
└─ Events: order_created, order_updated, low_stock_alert

SearchContext
├─ query: string
├─ results: MenuItem[]
└─ search(query: string): void

WebSocketContext
├─ lastMessage: any
├─ sendMessage(message: any): void
└─ subscribe(event: string, handler: Function): void
```

#### 3. **Custom Hooks for Reusable Logic**

Hooks encapsulate business logic and state management:

```typescript
// Hook for order management
const useOrderManager = () => {
  const [currentOrder, setCurrentOrder] = useLocalStorage("waiter_current_order", []);

  const addToOrder = useCallback(async (item: MenuItem) => {
    const res = await ucAddToOrder(repo, item);
    if (res.ok) setCurrentOrder(res.value);
  }, []);

  return { currentOrder, addToOrder, ... };
};

// Hook for form handling
const useRegisterForm = () => {
  const form = useForm<RegisterFormData>({ ... });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const response = await register(data);
    // ...
  };

  return { form, onSubmit, isLoading };
};
```

#### 4. **Repository Pattern for Data Access**

```typescript
// Abstract interface
interface OrderRepository {
  getOrders(): Promise<Result<Order[]>>;
  createOrder(order: Order): Promise<Result<Order>>;
  updateOrder(id: string, data: Partial<Order>): Promise<Result<Order>>;
}

// HTTP-based implementation
class HttpOrderRepository implements OrderRepository {
  constructor(private apiClient: AxiosInstance) {}

  async getOrders() {
    try {
      const response = await this.apiClient.get("/orders");
      return Ok(response.data);
    } catch (error) {
      return Err(error.message);
    }
  }
}

// Local storage implementation (for fallback)
class LocalStorageOrderRepository implements OrderRepository {
  async getOrders() {
    const data = localStorage.getItem("orders");
    return Ok(data ? JSON.parse(data) : []);
  }
}
```

#### 5. **Controller Pattern**

Controllers coordinate components and business logic:

```typescript
// Order Controller
class OrderController {
  constructor(
    private orderRepo: OrderRepository,
    private inventoryService: InventoryService,
  ) {}

  async createOrder(orderData: CreateOrderDTO) {
    // Validate data
    // Check inventory
    // Create order
    // Broadcast to other users via WebSocket
    // Return result
  }
}
```

---

## Module Breakdown

### 1. **Pages** (`/app/(auth), /app/(admin), /app/(user), /app/(waiter_order)`)

Organized using Next.js 16 App Router with route groups for layout isolation:

#### Authentication Routes (`/(auth)`)

- **`/login`** - User login page
- **`/register`** - User registration page

#### Admin Routes (`/(admin)`)

- **`/dashboard`** - Main admin dashboard with KPIs
- **`/users`** - User management (CRUD)
- **`/users/[id]`** - User detail and edit page
- **`/inventory`** - Inventory management and low-stock alerts

#### User Routes (`/(user)`)

- **`/chef_special`** - Special menu items viewing
- **`/profile`** - User profile management
- **`/user_interface`** - Customer order interface

#### Waiter/Order Routes (`/(waiter_order)`)

- **`/waiter_order`** - Main waiter order creation interface
- **`/KitchenDisplaySystem.tsx`** - Kitchen Display System (KDS)
- **`/WaiterOrderInterface.tsx`** - Waiter order management
- **`/FilterButtons.tsx`** - Order filtering controls

### 2. **Contexts** (`/app/contexts`)

Global state management using React Context API:

#### AuthContext.tsx

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "chef" | "waiter" | "cashier";
  phone?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login(email: string, password: string): Promise<void>;
  register(userData: RegisterData): Promise<void>;
  logout(): void;
  isLoading: boolean;
  updateUser(userData: Partial<User>): void;
}
```

**Key Features:**

- Auto-restore session on app load
- Token persistence in httpOnly cookies
- Axios interceptor for auth headers
- Error handling and logging

#### SocketContext.tsx

Manages real-time WebSocket connection using Socket.io:

```typescript
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}
```

**Connection Flow:**

1. User logs in, token is obtained
2. SocketProvider establishes connection with token
3. Server authenticates and sets user role
4. Client joins role-based rooms
5. Events are emitted/received based on role

#### SearchContext.tsx

Handles global search functionality:

```typescript
interface SearchContextType {
  query: string;
  results: MenuItem[];
  setQuery(query: string): void;
}
```

#### WebSocketContext.tsx

Separate WebSocket context (additional real-time features):

```typescript
interface WebSocketContextType {
  lastMessage: any;
  sendMessage(event: string, data: any): void;
  subscribe(event: string, handler: Function): void;
}
```

### 3. **Hooks** (`/app/hooks`)

Custom React hooks for business logic:

#### useOrderManager.ts

Manages order creation and modification:

```typescript
export const useOrderManager = () => {
  const [currentOrder, setCurrentOrder] = useLocalStorage<OrderItem[]>("waiter_current_order", []);

  return {
    currentOrder: OrderItem[],
    addToOrder(item: MenuItem): Promise<void>,
    updateQuantity(itemId: string, newQuantity: number): Promise<void>,
    updateInstructions(itemId: string, instructions: string): Promise<void>,
    removeFromOrder(itemId: string): Promise<void>,
    calculateTotal(): number,
    clearOrder(): Promise<void>
  };
};
```

**Implementation Details:**

- Uses local storage for order persistence
- Uses Result type for error handling
- Supports special instructions per item
- Calculates cart total in real-time

#### useMenuData.ts

Fetches and caches menu items:

```typescript
export const useMenuData = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch from API on mount
    const loadMenu = async () => {
      const response = await apiClient.get("/api/menu");
      setMenuItems(response.data);
    };
  }, []);

  return {
    menuItems: MenuItem[],
    categories: Category[],
    isLoading: boolean,
    getItemsByCategory(categoryId: string): MenuItem[],
    searchItems(query: string): MenuItem[]
  };
};
```

#### useOrders.ts

Manages order list and filtering:

```typescript
export const useOrders = () => {
  return {
    orders: Order[],
    isLoading: boolean,
    filter: {
      status?: string;
      customerName?: string;
      dateRange?: [Date, Date];
    },
    setFilter(filter: FilterOptions): void,
    refreshOrders(): Promise<void>,
    updateOrderStatus(orderId: string, newStatus: string): Promise<void>
  };
};
```

#### useOrderWebSocket.ts

Handles real-time order updates:

```typescript
export const useOrderWebSocket = () => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("order_created", (order) => {
      updateLocalOrders(order);
      notifyUser("New order placed");
    });

    socket.on("order_updated", (order) => {
      updateLocalOrders(order);
    });

    socket.on("low_stock_alert", (alert) => {
      notifyUser(`Low stock: ${alert.itemName}`);
    });

    return () => {
      socket.off("order_created");
      socket.off("order_updated");
    };
  }, [socket]);
};
```

#### useStats.ts

Retrieves analytics and metrics:

```typescript
export const useStats = () => {
  return {
    totalOrders: number,
    totalRevenue: number,
    averageOrderValue: number,
    topItems: MenuItem[],
    orderTrend: TrendData[],
    isLoading: boolean,
    refreshStats(): Promise<void>
  };
};
```

#### useLocalStorage.ts

Generic hook for persisting state:

```typescript
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
};
```

### 4. **Components** (`/app/presentation/components`)

Reusable UI components organized by feature:

#### Layout Components

- **`layout/Sidebar.tsx`** - Navigation sidebar with role-based menu
- **`layout/Navbar.tsx`** - Top navigation bar
- **`Navbar/Navbar.tsx`** - Alternate navigation component

#### Order Components

- **`OrderForm.tsx`** - Form for creating/editing orders
- **`OrderCard.tsx`** - Card displaying order summary
- **`OrderItem.tsx`** - Individual order item component
- **`OrderSummary.tsx`** - Order total and details view

#### Menu Components

- **`Menu/Menu.tsx`** - Main menu display
- **`MenuGrid.tsx`** - Grid view of menu items
- **`MenuTable.tsx`** - Table view of menu items
- **`MenuItemCard.tsx`** - Individual menu item card
- **`MenuHeader.tsx`** - Menu section header
- **`MenuFilters.tsx`** - Filter options component
- **`MenuStats.tsx`** - Menu performance statistics

#### Admin Components

- **`KitchenStatsPanel.tsx`** - Real-time kitchen metrics
- **`UserList.tsx`** - User management table
- **`Pagination.tsx`** - Table pagination
- **`ModalManager.tsx`** - Modal dialog controller

#### Feature Components

- **`SearchAndFilterBar.tsx`** - Search and filter UI
- **`FilterButtons.tsx`** - Quick filter buttons
- **`IngredientImpactPreview.tsx`** - Ingredient deduction preview
- **`IngredientStockDashboard.tsx`** - Stock level display
- **`StarRating.tsx`** - Rating component
- **`FeaturedSection.tsx`** - Featured items display

#### Authentication Components

- **`RegisterForm.tsx`** - Registration form with validation
- **`ProtectedRoute.tsx`** - Route wrapper for authorization

### 5. **Application Layer** (`/app/application`)

Business logic and use cases:

#### Use Cases (`/usecases/OrderUseCases.ts`)

```typescript
// Order creation with inventory check
export async function createOrder(
  repo: OrderRepository,
  orderData: CreateOrderDTO,
): Promise<Result<Order>> {
  // Validate items exist
  // Check inventory
  // Calculate total
  // Create order in backend
  // Return result
}

// Load order from storage
export async function loadOrder(
  repo: OrderRepository,
): Promise<Result<OrderItem[]>> {
  // Load persisted order
  // Validate items
  // Return order items
}

// Add item to cart
export async function addToOrder(
  repo: OrderRepository,
  item: MenuItem,
): Promise<Result<OrderItem[]>> {
  // Add to cart
  // Persist to storage
  // Return updated order
}
```

#### Managers (`/managers`)

Orchestrate complex operations:

```typescript
class OrderManager {
  async submitOrder(orderId: string, paymentInfo: PaymentInfo) {
    // Validate order state
    // Process payment
    // Create kitchen order
    // Send to kitchen via WebSocket
    // Update customer
    // Return confirmation
  }
}

class InventoryManager {
  async deductIngredients(orderItems: OrderItem[]) {
    // Get ingredients for each menu item
    // Calculate total deduction
    // Send to backend
    // Track for audit trail
    // Monitor low stock
  }
}

class StatsManager {
  async getOrderMetrics(dateRange: DateRange) {
    // Fetch orders in range
    // Aggregate metrics
    // Calculate trends
    // Format for display
  }
}
```

#### Coordinators (`/coordinators`)

Coordinate between multiple managers:

```typescript
class OrderCoordinator {
  constructor(
    private orderManager: OrderManager,
    private inventoryManager: InventoryManager,
    private paymentProcessor: PaymentProcessor,
  ) {}

  async processCompleteOrder(orderData: OrderData) {
    // 1. Create order
    // 2. Deduct inventory
    // 3. Process payment
    // 4. Send to kitchen
    // 5. Update customer
    // Handle errors at each step
  }
}
```

### 6. **Domain Layer** (`/app/domain`)

Core business logic and models:

#### Models

- **User** - User profile and authentication
- **Order** - Order details and items
- **MenuItem** - Menu item information
- **Ingredient** - Ingredient details and stock

#### Repositories

```typescript
interface OrderRepository {
  getAll(filters?: OrderFilter): Promise<Result<Order[]>>;
  getById(id: string): Promise<Result<Order>>;
  create(order: Order): Promise<Result<Order>>;
  update(id: string, data: Partial<Order>): Promise<Result<Order>>;
  delete(id: string): Promise<Result<void>>;
  getStats(range?: DateRange): Promise<Result<OrderStats>>;
}

// HTTP implementation
class HttpOrderRepository implements OrderRepository {
  constructor(private apiClient: AxiosInstance) {}
  // Implements all methods using HTTP calls
}

// Local storage implementation (fallback)
class LocalStorageOrderRepository implements OrderRepository {
  // Implements using localStorage
}
```

### 7. **Infrastructure Layer** (`/app/infrastructure`)

External service integrations:

#### Repository Implementations

```typescript
class HttpOrderRepository {
  async getOrders(filters?: OrderFilter) {
    const response = await this.apiClient.get("/api/orders", {
      params: filters,
    });
    return response.data;
  }

  async createOrder(order: Order) {
    const response = await this.apiClient.post("/api/orders", order);
    return response.data;
  }
}
```

#### Services (`/services`)

**IngredientDeductionService.ts**

```typescript
class IngredientDeductionService {
  async deductForOrder(orderId: string, items: OrderItem[]) {
    const ingredientMap = await this.mapItemsToIngredients(items);
    const deduction = await this.apiClient.post(
      `/api/orders/${orderId}/inventory`,
      ingredientMap,
    );
    return deduction.data;
  }
}
```

**low-stock-notifier.ts**

```typescript
class LowStockNotifier {
  handleAlert(alert: LowStockAlert) {
    // Show toast notification
    // Log to analytics
    // Send to backend for audit
    // Update inventory dashboard
  }
}
```

---

## State Management

### Context API Structure

#### AuthContext Flow

```
User Login
    ↓
POST /api/auth/login
    ↓
Token received & stored
    ↓
setupAxiosInterceptors()
    ├─ Add Authorization header to all requests
    └─ Auto-refresh token if expired
    ↓
setUser(userData)
    ↓
Contexts updated globally
    ↓
All components re-render with new auth state
```

#### SocketContext Flow

```
App Mount
    ↓
AuthProvider loads
    ↓
Token available
    ↓
SocketProvider connects
    ├─ io(API_URL, { auth: { token } })
    └─ Query: token, role, userId
    ↓
Server authenticates
    ↓
Client joins role-based rooms
    ├─ room: "role-chef"
    ├─ room: "role-waiter"
    └─ room: "role-admin"
    ↓
Listen for events
    ├─ order_created
    ├─ order_updated
    └─ low_stock_alert
    ↓
Components subscribe to socket events
    ↓
Real-time updates propagate to UI
```

### Local State Management

#### Component State

```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [filters, setFilters] = useState<OrderFilter>({});
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Local Storage

```typescript
// Persistent across browser sessions
const [currentOrder, setCurrentOrder] = useLocalStorage(
  "waiter_current_order",
  [],
);
```

#### Server State (Queries)

```typescript
// Fetch from API and cache
const { data: orders, isLoading } = useQuery(
  "orders",
  () => apiClient.get("/api/orders"),
  { staleTime: 5 * 60 * 1000 }, // 5 minute cache
);
```

---

## Component Architecture

### Component Hierarchy Example

```
RootLayout
├─ AuthProvider
│  ├─ SocketProvider
│  │  ├─ WebSocketProvider
│  │  │  ├─ SearchProvider
│  │  │  │  ├─ Layout (Static)
│  │  │  │  │  ├─ Sidebar
│  │  │  │  │  └─ Navbar
│  │  │  │  └─ main (Dynamic)
│  │  │  │     ├─ (admin)
│  │  │  │     │  ├─ /dashboard (AdminDashboard)
│  │  │  │     │  ├─ /users (UserManagement)
│  │  │  │     │  └─ /inventory (InventoryDashboard)
│  │  │  │     ├─ (auth)
│  │  │  │     │  ├─ /login (LoginPage)
│  │  │  │     │  └─ /register (RegisterPage)
│  │  │  │     ├─ (user)
│  │  │  │     │  ├─ /profile (UserProfile)
│  │  │  │     │  └─ /user_interface (CustomerInterface)
│  │  │  │     └─ (waiter_order)
│  │  │  │        ├─ /waiter_order (WaiterOrderInterface)
│  │  │  │        └─ KitchenDisplaySystem
│  │  │  │
```

### Smart Component Example

```typescript
// WaiterOrderInterface.tsx (Container/Smart Component)
"use client";

export const WaiterOrderInterface = () => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();
  const { currentOrder, addToOrder, removeFromOrder } = useOrderManager();
  const { menuItems, isLoading } = useMenuData();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Load active orders on mount
  useEffect(() => {
    loadActiveOrders();
  }, [token]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on("order_created", (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
    });

    socket.on("order_updated", (updatedOrder) => {
      setOrders(prev =>
        prev.map(o => o._id === updatedOrder._id ? updatedOrder : o)
      );
    });

    return () => {
      socket.off("order_created");
      socket.off("order_updated");
    };
  }, [socket]);

  const handleSubmitOrder = async () => {
    const response = await apiClient.post("/api/orders", {
      items: currentOrder,
      tableNumber: selectedTable,
      orderType: "dine-in"
    });

    if (response.status === 201) {
      // WebSocket will handle the update
      clearOrder();
    }
  };

  return (
    <div className="waiter-interface">
      <MenuList items={menuItems} onSelectItem={addToOrder} />
      <OrderCart
        items={currentOrder}
        onRemoveItem={removeFromOrder}
        onSubmit={handleSubmitOrder}
      />
      <OrdersList orders={orders} selected={selectedOrderId} />
    </div>
  );
};
```

### Dumb Component Example

```typescript
// MenuItemCard.tsx (Presentational/Dumb Component)
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart
}) => {
  return (
    <div className="menu-item-card">
      <img src={item.imageUrl} alt={item.name} />
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <span className="price">${item.price}</span>
      <button onClick={() => onAddToCart(item)}>Add to Cart</button>
    </div>
  );
};
```

---

## Implementation Logic

### Order Creation Flow

```
Waiter View (WaiterOrderInterface)
    ↓
Choose menu items from MenuGrid
    ↓
Click "Add to Cart" for each item
    ├─ useOrderManager.addToOrder()
    │  ├─ Calls OrderUseCases.addToOrder()
    │  ├─ Persists to localStorage
    │  └─ Updates local state
    └─ UI shows updated cart
    ↓
Set table number and special instructions
    ↓
Review OrderSummary
    ├─ Shows items, quantities, total
    └─ Shows estimated preparation time
    ↓
Click "Submit Order"
    ↓
POST /api/orders
├─ Backend validates items exist
├─ Backend deducts inventory
├─ Backend creates Order document
└─ Backend returns 201 Created with order ID
    ↓
WebSocket broadcasts "order_created"
├─ Kitchen receives update (KDS)
├─ Order appears in queue
└─ Waiter sees order in "Active Orders"
    ↓
Clear cart and reset form
```

### Real-Time Order Updates Flow

```
Backend Order Status Change
    ↓
Chef updates status via API/UI
    ↓
Backend broadcasts via Socket.io
├─ Event: "order_updated"
├─ Room: Role-based (chef, waiter, admin)
└─ Data: Updated order object
    ↓
All connected clients receive event
    ↓
Component handlers (useOrderWebSocket)
├─ Update local order state
├─ Trigger UI re-render
└─ Show toast notification
    ↓
Different views update accordingly:
├─ Waiter: Shows order status changed to "ready"
├─ Chef: Sees order removed from queue if served
└─ Admin: Sees analytics updated in dashboard
```

### Menu Item Filtering

```
User enters search query
    ↓
SearchContext.setQuery(query)
    ↓
useMenuData component receives update
    ↓
searchItems(query) is called
├─ Filter by name
├─ Filter by description
└─ Filter by ingredients
    ↓
Filtered results passed to MenuGrid
    ↓
MenuGrid re-renders with filtered items
```

### Inventory Deduction on Order

```
Order created in backend
    ↓
Backend ConsumeIngredientsUseCase.execute()
├─ Get menu items in order
├─ Get ingredients for each item
├─ Calculate total requirements
├─ Deduct from MongoDB inventory
└─ Create low stock notifications if needed
    ↓
Backend broadcasts low_stock_alert (if applicable)
    ↓
Frontend receives alert via Socket.io
├─ Update InventoryDashboard (admin)
└─ Show toast notification
```

### Authentication & Session Management

```
User navigates to /login
    ↓
LoginPage rendered
    ↓
User enters credentials
    ↓
Click "Login"
    ↓
POST /api/auth/login
├─ Backend validates credentials
├─ Backend creates JWT token
└─ Backend returns token & user data
    ↓
AuthContext.login() stores:
├─ Token in httpOnly cookie
├─ User in state
└─ Sets axios default Authorization header
    ↓
Token refresh interceptor setup
└─ Auto-refresh before expiration
    ↓
SocketProvider connects with token
    ↓
Redirect to dashboard
```

---

## API Integration

### Axios Configuration

```typescript
// Created in AuthContext
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Request interceptor adds auth token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh or logout
      logout();
    }
    return Promise.reject(error);
  },
);
```

### API Endpoints Used

| Method | Endpoint                         | Purpose             | Roles               |
| ------ | -------------------------------- | ------------------- | ------------------- |
| POST   | `/api/auth/login`                | User authentication | All                 |
| POST   | `/api/auth/register`             | User registration   | All                 |
| GET    | `/api/orders`                    | Fetch all orders    | admin, chef, waiter |
| POST   | `/api/orders`                    | Create new order    | waiter, admin       |
| PATCH  | `/api/orders/:id/status`         | Update order status | chef, waiter        |
| GET    | `/api/orders/stats`              | Get order analytics | admin               |
| GET    | `/api/menu`                      | Get all menu items  | All                 |
| GET    | `/api/inventory`                 | Get current stock   | admin               |
| POST   | `/api/inventory/check-low-stock` | Trigger stock check | admin               |
| GET    | `/api/users`                     | Get all users       | admin               |
| PUT    | `/api/users/:id`                 | Update user profile | admin, self         |

### Error Handling

```typescript
const handleApiError = (error: AxiosError) => {
  switch (error.response?.status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "You are not authenticated. Please login.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "Resource not found.";
    case 429:
      return "Too many requests. Please wait a moment.";
    case 500:
      return "Server error. Please try again later.";
    default:
      return "An unexpected error occurred.";
  }
};
```

### Loading & Error States

```typescript
// All async operations follow this pattern
const [state, setState] = useState({
  data: null,
  isLoading: false,
  error: null,
});

const fetchData = async () => {
  setState((prev) => ({ ...prev, isLoading: true, error: null }));
  try {
    const response = await apiClient.get("/api/endpoint");
    setState({ data: response.data, isLoading: false, error: null });
  } catch (error) {
    setState((prev) => ({
      ...prev,
      error: error.message,
      isLoading: false,
    }));
  }
};
```

---

## Setup & Deployment

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- **Backend API** running on port 5000
- **Environment variables** configured

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/Zardd99/restaurant_mangement_system.git
cd restaurant_web_app
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Configuration

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Environment
NODE_ENV=development

# Authentication
NEXTAUTH_SECRET=your_secret_key_here_change_in_production
NEXTAUTH_URL=http://localhost:3000

#3rd Party Services
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id (optional)
```

#### 4. Start Development Server

```bash
npm run dev
# Application runs on http://localhost:3000
```

#### 5. Build for Production

```bash
npm run build
npm start
```

### Deployment to Vercel

#### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

#### 2. Connect to Vercel

- Visit https://vercel.com/new
- Import your GitHub repository
- Configure environment variables from `.env.local`
- Click Deploy

#### 3. Set Production Environment Variables

In Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://api.restaurant.com
NEXT_PUBLIC_SOCKET_URL=https://api.restaurant.com
NEXTAUTH_SECRET=production_secret_key_randomly_generated
NEXTAUTH_URL=https://your-app.vercel.app
```

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5000
      NEXT_PUBLIC_SOCKET_URL: http://backend:5000
      NODE_ENV: production
    depends_on:
      - backend

  backend:
    image: backend-restaurant:latest
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/restaurant_db
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

### Build & Deployment Checklist

- [ ] All environment variables configured
- [ ] API backend is running and accessible
- [ ] WebSocket connection tested
- [ ] Database seeded with test data
- [ ] Authentication flow tested
- [ ] Role-based redirects working
- [ ] Real-time updates functional
- [ ] Responsive design verified across devices
- [ ] Performance optimized (images, bundle size)
- [ ] Security headers configured

---

## Performance Optimization

### Code Splitting

Next.js automatically code-splits by page. For large components, use dynamic imports:

```typescript
import dynamic from 'next/dynamic';

const KitchenDisplaySystem = dynamic(
  () => import('./KitchenDisplaySystem'),
  { loading: () => <LoadingSpinner /> }
);
```

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src={menuItem.imageUrl}
  alt={menuItem.name}
  width={300}
  height={300}
  priority // For above-fold images
/>
```

### Data Fetching Optimization

```typescript
// Cache frequently accessed data
const getMenuItems = useCallback(async () => {
  const cached = sessionStorage.getItem("menu_items");
  if (cached) return JSON.parse(cached);

  const response = await apiClient.get("/api/menu");
  sessionStorage.setItem("menu_items", JSON.stringify(response.data));
  return response.data;
}, []);
```

### WebSocket Optimization

```typescript
// Debounce order updates
const handleOrderUpdate = useCallback(
  debounce((order) => {
    setOrders((prev) => updateOrderInList(prev, order));
  }, 500),
  [],
);

socket.on("order_updated", handleOrderUpdate);
```

### Bundle Analysis

```bash
npm run build
npm install -g webpack-bundle-analyzer
npx analyze
```

---

## Security Considerations

### Authentication

- Token stored in httpOnly, secure cookies
- CSRF protection via SameSite cookie setting
- Token refresh before expiration
- Logout clears all auth state

### Authorization

```typescript
// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) return <Redirect to="/login" />;
  if (!requiredRole.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return children;
};

// Usage
<ProtectedRoute requiredRole={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

### Data Validation

All user inputs are validated:

```typescript
const createOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItem: z.string().min(24).max(24),
      quantity: z.number().min(1).max(100),
    }),
  ),
  tableNumber: z.number().min(1),
  orderType: z.enum(["dine-in", "takeaway", "delivery"]),
});
```

### Sensitive Data Handling

- API keys not exposed in frontend code
- Sensitive operations delegated to backend
- User passwords never logged
- Error messages don't expose system details

### HTTPS Enforcement

```typescript
// Vercel automatically provides HTTPS
// For self-hosted, configure SSL certificate
// Force redirect in next.config.ts
```

---

## Testing

### Unit Tests

```bash
npm test
```

### Component Tests with React Testing Library

```typescript
import { render, screen } from '@testing-library/react';

test('MenuItemCard renders item details', () => {
  const item = { name: 'Salmon', price: 24.99 };
  render(<MenuItemCard item={item} onAddToCart={jest.fn()} />);

  expect(screen.getByText('Salmon')).toBeInTheDocument();
  expect(screen.getByText('$24.99')).toBeInTheDocument();
});
```

### Integration Tests

```bash
npx playwright test
```

---

## Troubleshooting

### API Connection Issues

```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check CORS configuration
# Verify NEXT_PUBLIC_API_URL in .env.local
```

### WebSocket Connection Issues

```
Check network tab in dev tools
Verify token is being sent
Check backend socket configuration
Ensure Socket.io client version matches server
```

### Authentication Issues

```
Clear cookies: Application > Storage > Cookies
Remove token from localStorage if used
Check NEXTAUTH_SECRET is set
Verify JWT expiration
```

---

## Performance Metrics

### Target Metrics

- **FCP (First Contentful Paint)**: < 1.5s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTL (Time to Interactive)**: < 3.5s

### Monitoring

Use Vercel Analytics or Google Analytics to monitor:

- Page load times
- User interactions
- Error rates
- Real-time active users

---

## Appendix: Common Commands

### Development

```bash
npm run dev                # Start dev server
npm run build             # Build for production
npm start                 # Start production server
npm test                  # Run tests
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
```

### Docker

```bash
docker build -t restaurant-web:1.0 .
docker run -p 3000:3000 restaurant-web:1.0
docker-compose up
```

---

**End of Restaurant Web Application Documentation**
