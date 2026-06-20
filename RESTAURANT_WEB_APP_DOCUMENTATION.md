# Restaurant Management System — Frontend Documentation

**Version:** 0.2.0  
**Framework:** Next.js 16.1.6 · React 19.2.4 · TypeScript 6.0.3  
**Last Updated:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture](#4-architecture)
5. [Context Providers](#5-context-providers)
6. [Custom Hooks](#6-custom-hooks)
7. [Domain & Application Layers](#7-domain--application-layers)
8. [Infrastructure Layer](#8-infrastructure-layer)
9. [Pages & Routes](#9-pages--routes)
10. [Component Catalog](#10-component-catalog)
11. [View Models](#11-view-models)
12. [Sidebar & Navigation](#12-sidebar--navigation)
13. [Real-Time System](#13-real-time-system)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Settings & Theming](#15-settings--theming)
16. [Error Handling](#16-error-handling)
17. [Data Flow Diagrams](#17-data-flow-diagrams)
18. [Environment & Setup](#18-environment--setup)
19. [Testing](#19-testing)
20. [Adding New Features](#20-adding-new-features)

---

## 1. Project Overview

The **Restaurant Management System frontend** is a multi-role, real-time web application that serves as the operational interface for all restaurant staff. It is an employee-only system — there is no customer-facing order portal. Every page is protected by role-based access control.

### Role Capabilities

| Role | Primary Access |
|---|---|
| **Admin** | Full system: menu CRUD, analytics, user management, billing, settings |
| **Manager** | Operations, scheduling, billing, promotions, reporting |
| **Waiter** | Take orders, track kitchen status, billing payments |
| **Chef** | Chef's Special display, kitchen order queue |
| **Cashier** | Billing & payments |

### Core Feature Areas

- **Menu Management** — Create, edit, delete, and filter menu items with image upload
- **Order Taking** — Compact tablet-optimised waiter interface with real-time cart
- **Kitchen Display System (KDS)** — Live order queue for kitchen staff with status controls
- **Billing & Payments** — Payment tracking, cash change calculator, receipt printing
- **Inventory Dashboard** — Real-time stock levels and low-stock alerts
- **Analytics** — Revenue, order counts, and top-dish reports
- **Notifications** — In-app toast alerts for every order status transition
- **Settings** — Per-user theme, notification preferences, sound alerts
- **Help & Support** — FAQ, contact form, role tips

---

## 2. Technology Stack

| Package | Version | Role |
|---|---|---|
| `next` | 16.1.6 | Framework, App Router, SSR |
| `react` | 19.2.4 | UI library |
| `typescript` | 6.0.3 | Type safety |
| `tailwindcss` | 4 | Utility-first styling |
| `socket.io-client` | 4.8.3 | Real-time WebSocket client |
| `axios` | 1.13.5 | HTTP client with interceptors |
| `react-hook-form` | 7.71.1 | Form state & validation |
| `@mui/material` | 7.3.8 | Data grids and analytics charts |
| `chart.js` + `react-chartjs-2` | 4.5.1 | Revenue/order charts |
| `lucide-react` | 0.563.0 | Icon system |
| `js-cookie` | 3.x | JWT cookie management |
| `jest` + `@testing-library/react` | Latest | Unit & component tests |

---

## 3. Repository Structure

```
app/
├── (admin)/                        # Admin & manager routes (route group)
│   ├── analytics/page.tsx          # Revenue and kitchen analytics
│   ├── dashboard/page.tsx          # Menu management dashboard
│   ├── inventory/                  # Ingredient stock dashboard
│   ├── promotions/                 # Discount/promotion management
│   ├── schedule/                   # Staff shift scheduling
│   └── users/                      # User & staff management
│
├── (auth)/                         # Public auth routes
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (user)/                         # Shared staff routes
│   ├── chef_special/page.tsx       # Chef's featured items
│   └── profile/page.tsx            # User profile editor
│
├── (waiter_order)/                 # Waiter order interface
│   ├── waiter_order/page.tsx       # Page shell (tab host)
│   ├── WaiterOrderInterface.tsx    # Compact order-taking UI
│   ├── KitchenDisplaySystem.tsx    # KDS for kitchen staff
│   └── common/                     # LoadingState, ErrorState, EmptyState
│
├── billing/page.tsx                # Billing & payments
├── help/page.tsx                   # Help & support
├── notifications/page.tsx          # Notification centre
├── settings/page.tsx               # App settings
│
├── application/                    # Business logic layer
│   ├── coordinators/               # Multi-step workflow coordinators
│   ├── managers/                   # Feature orchestrators
│   └── usecases/                   # Single-responsibility use cases
│
├── contexts/                       # React Context providers
│   ├── AuthContext.tsx             # Session, token, axios instance
│   ├── NotificationContext.tsx     # Toast notification queue
│   ├── SearchContext.tsx           # Global search state
│   ├── SettingsContext.tsx         # Theme, toasts, kitchen prefs
│   ├── SocketContext.tsx           # Socket.IO client
│   └── WebSocketContext.tsx        # Order status WebSocket wrapper
│
├── core/
│   └── Result.ts                   # Functional error type (Ok / Err)
│
├── domain/                         # Domain entities & repository interfaces
│   ├── models/
│   └── repositories/
│
├── hooks/                          # Custom React hooks
│   ├── useInventoryAlerts.ts
│   ├── useInventoryDeduction.ts
│   ├── useLocalStorage.ts
│   ├── useMenuData.ts
│   ├── useOrderManager.ts
│   ├── useOrderWebSocket.ts
│   ├── useOrders.ts
│   ├── useRegisterForm.tsx
│   └── useStats.ts
│
├── infrastructure/
│   └── repositories/               # HTTP repository implementations
│
├── lib/
│   ├── mongodb.ts                  # MongoDB connection (server components)
│   └── sidebar/sidebarConfig.tsx   # Role-based navigation config
│
├── presentation/
│   ├── components/                 # All reusable UI components
│   └── viewModels/                 # Presentation-layer logic helpers
│
├── services/                       # Service layer adapters
├── types/                          # Global TypeScript interfaces
│
├── globals.css                     # Tailwind base + dark mode overrides
└── layout.tsx                      # Root layout with provider tree
```

---

## 4. Architecture

The frontend follows **Clean Architecture** with four layers. Dependencies flow strictly inward: presentation → application → domain. Infrastructure is a plug-in detail.

```
┌──────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                  │
│  Pages · Components · View Models · Hooks            │
│  Renders UI. Calls hooks. Never calls API directly.  │
├──────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                   │
│  Use Cases · Managers · Coordinators                 │
│  Orchestrates business operations. Returns Result.   │
├──────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                        │
│  Entities · Repository Interfaces                    │
│  Business rules. No framework imports allowed.       │
├──────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                │
│  APIIngredientRepository · IngredientDeductionService│
│  Implements domain interfaces. Talks to the network. │
└──────────────────────────────────────────────────────┘
```

### Root Layout Provider Tree

The provider nesting order matters — inner providers may consume outer ones:

```
<html suppressHydrationWarning>          ← prevents dark-mode flash
  <AuthProvider>                         ← token, user, axiosInstance
    <SocketProvider>                     ← Socket.IO connection
      <WebSocketProvider>                ← order status helper
        <NotificationProvider>           ← toast queue
          <SettingsProvider>             ← theme, prefs (reads localStorage)
            <SearchProvider>             ← global search query
              <Layout>                   ← Navbar + CollapsibleSidebar
              <NotificationToast />      ← portal-rendered toasts
              {children}
            </SearchProvider>
          </SettingsProvider>
        </NotificationProvider>
      </WebSocketProvider>
    </SocketProvider>
  </AuthProvider>
</html>
```

---

## 5. Context Providers

### AuthContext

**File:** `app/contexts/AuthContext.tsx`  
**Hook:** `useAuth()`

The most critical context. Manages the authenticated session and provides a pre-configured Axios instance used by every API call in the app.

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "chef" | "waiter" | "cashier";
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  axiosInstance: AxiosInstance;   // use this for ALL API calls
  login(email: string, password: string): Promise<void>;
  register(userData: RegisterData): Promise<void>;
  logout(): void;
  updateUser(userData: Partial<User>): void;
}
```

**Key behaviours:**

- On app start, reads the saved JWT from cookies and verifies it with `GET /api/auth/me`. If valid, restores the session silently.
- `axiosInstance` automatically injects `Authorization: Bearer <token>` on every request and adds `ngrok-skip-browser-warning` for development tunnels.
- The response interceptor logs out the user automatically on `401 Unauthorized`.
- Token is stored in a cookie with a 30-day expiry (not `httpOnly` — accessible to JS for the Axios interceptor).

**Usage:**
```typescript
const { user, axiosInstance, logout } = useAuth();

// Always use axiosInstance, never raw axios:
const response = await axiosInstance.get("/api/orders");
```

---

### SocketContext

**File:** `app/contexts/SocketContext.tsx`  
**Hook:** `useSocket()`

```typescript
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}
```

Establishes a Socket.IO connection as soon as `token` and `user.role` are available from `AuthContext`. The connection carries `{ token, role, userId }` in the auth handshake so the server can authenticate the socket without a separate login step.

**Reconnection:** Socket.IO's built-in exponential back-off handles disconnections automatically. `isConnected` reflects the live connection state and can be used to show "Real-time / Polling" UI indicators.

**Usage:**
```typescript
const { socket, isConnected } = useSocket();

useEffect(() => {
  if (!socket) return;
  socket.on("order:notification", handleNotification);
  return () => { socket.off("order:notification", handleNotification); };
}, [socket]);
```

---

### NotificationContext

**File:** `app/contexts/NotificationContext.tsx`  
**Hook:** `useNotifications()`

Receives `order:notification` socket events and places them in a capped queue (max 5 visible at once). Each toast auto-dismisses after 6 seconds.

```typescript
type NotificationType =
  | "order_created"
  | "order_preparing"
  | "order_ready"
  | "order_served";

interface OrderNotification {
  id: string;
  type: NotificationType;
  orderId: string;
  tableNumber?: number;
  customerName?: string;
  itemCount: number;
  actor: { id: string; name: string; role: string };
  timestamp: string;
}
```

**Filtering:** Before enqueuing, checks `settings.toastsEnabled` and `settings.toastTypes[notification.type]` from `SettingsContext`. A notification whose type is disabled in settings is silently dropped.

**Sound:** If `settings.soundEnabled`, generates a short two-tone chime via the Web Audio API (no external audio file required).

---

### SettingsContext

**File:** `app/contexts/SettingsContext.tsx`  
**Hook:** `useSettings()`  
**Storage key:** `rms_settings` (localStorage)

```typescript
type Theme = "light" | "dark" | "system";

interface AppSettings {
  theme: Theme;
  toastsEnabled: boolean;
  toastTypes: {
    order_created: boolean;
    order_preparing: boolean;
    order_ready: boolean;
    order_served: boolean;
  };
  soundEnabled: boolean;
  kitchenDefaultFilter: "all" | "pending" | "confirmed" | "preparing" | "ready";
  kitchenAutoRefreshSeconds: 0 | 30 | 60 | 120;
  compactCards: boolean;
}
```

**Theme application:** Toggles the `dark` class on `document.documentElement`. An inline `<script>` in `layout.tsx` reads the same localStorage key and applies the class before the first paint, preventing a flash of unstyled light content on dark-mode loads. The `<html>` element carries `suppressHydrationWarning` to silence the expected mismatch.

**Dark mode CSS:** `globals.css` contains a universal override block (`html.dark .bg-white { … }`) that darkens hard-coded Tailwind utility classes without requiring per-component `dark:` variants.

---

### SearchContext

**File:** `app/contexts/SearchContext.tsx`  
**Hook:** `useSearch()`

Holds a global search query string. Components that need to respond to search subscribe via `useSearch()`. Currently used in menu-related pages to filter items by name/description.

---

### WebSocketContext

**File:** `app/contexts/WebSocketContext.tsx`  
**Hook:** `useWebSocket()`

A thin wrapper specifically for order status updates. When a component calls `updateOrderStatus(orderId, newStatus)`, this context handles the `PATCH /api/orders/:id/status` request and then emits the result over the Socket.IO connection so all connected clients see the change immediately.

---

## 6. Custom Hooks

### `useOrderManager`

**File:** `app/hooks/useOrderManager.ts`

The core hook for the waiter order-taking flow. Persists the in-progress order to `localStorage` (`waiter_current_order`) so it survives page refreshes.

```typescript
interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

// Returns:
{
  currentOrder: OrderItem[];
  addToOrder(item: MenuItem): Promise<void>;
  updateQuantity(itemId: string, qty: number): Promise<void>;
  updateInstructions(itemId: string, text: string): Promise<void>;
  removeFromOrder(itemId: string): Promise<void>;
  calculateTotal(): number;
  clearOrder(): Promise<void>;
}
```

All mutation methods route through `OrderUseCases` in the application layer, which returns a `Result<OrderItem[]>` — the hook checks `result.ok` before updating state.

---

### `useMenuData`

**File:** `app/hooks/useMenuData.ts`

Fetches the complete menu from `GET /api/menu` and exposes CRUD operations used by the admin dashboard.

```typescript
interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string | { _id: string; name: string };
  image: string;
  dietaryTags: string[];
  availability: boolean;
  preparationTime: number;
  chefSpecial: boolean;
  averageRating: number;
  reviewCount: number;
}
```

---

### `useStats`

**File:** `app/hooks/useStats.ts`

Fetches aggregated kitchen stats (total revenue, order counts, top dishes) via `GET /api/orders/stats`. Exposes a manual `fetchStats()` trigger for pull-to-refresh. Routes through `StatsUseCase → StatsManager`.

---

### `useInventoryDeduction`

**File:** `app/hooks/useInventoryDeduction.ts`

Called after an order is submitted to `POST /api/orders/:id/inventory` with ingredient quantities. Returns `isDeducting` boolean so the submit button can show a spinner during processing.

---

### `useInventoryAlerts`

**File:** `app/hooks/useInventoryAlerts.ts`

Monitors ingredient stock levels and surfaces `lowStock` / `criticalStock` arrays. Drives the alert badges in the Inventory Dashboard.

---

### `useLocalStorage`

**File:** `app/hooks/useLocalStorage.ts`

Generic `[value, setValue]` hook backed by `localStorage`. Handles SSR safely (`typeof window === "undefined"` guard) and JSON serialisation automatically.

```typescript
const [tableNumber, setTableNumber] = useLocalStorage<number>("waiter_table_number", 1);
```

---

### `useOrders`

**File:** `app/hooks/useOrders.ts`

Fetches and paginates orders from `GET /api/orders`. Accepts filter parameters (status, date range, customer name) and exposes `refreshOrders()` and `updateOrderStatus()`.

---

### `useOrderWebSocket`

**File:** `app/hooks/useOrderWebSocket.ts`

Subscribes to `order_created` and `order_updated` socket events and keeps a local orders array in sync. Used by the Kitchen Display System to receive live order updates without polling.

---

### `useRegisterForm`

**File:** `app/hooks/useRegisterForm.tsx`

Wraps `react-hook-form` for the registration page. Handles field validation (required fields, email format, password strength) and calls `AuthContext.register()` on submit.

---

## 7. Domain & Application Layers

### Core Result Type

**File:** `app/core/Result.ts`

All use cases and repositories return `Result<T, E>` rather than throwing exceptions:

```typescript
type Result<T, E = string> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

const Ok  = <T>(value: T): Result<T>      => ({ ok: true,  value });
const Err = <T>(error: string): Result<T> => ({ ok: false, error });
```

**Usage pattern:**
```typescript
const result = await addToOrder(repo, item);
if (!result.ok) {
  console.error(result.error);
  return;
}
setCurrentOrder(result.value);
```

---

### Domain Models

| File | Entity | Purpose |
|---|---|---|
| `domain/models/menu-item.ts` | `MenuItem` | Core menu item entity |
| `domain/models/ingredient.ts` | `Ingredient` | Ingredient stock entity |
| `domain/models/ingredient-value-objects.ts` | `IngredientReference` | Links menu items to ingredients |

### Repository Interfaces

| Interface | File | Operations |
|---|---|---|
| `OrderRepository` | `domain/repositories/OrderRepository.ts` | `load()`, `save(items)` — localStorage-backed |
| `IngredientRepository` | `domain/repositories/IngredientRepository.ts` | `checkAvailability()`, `deductIngredients()` |

### Use Cases

| File | Functions |
|---|---|
| `application/usecases/OrderUseCases.ts` | `loadOrder`, `addToOrder`, `updateQuantity`, `updateInstructions`, `removeItem`, `clearOrder` |
| `application/usecases/StatsUseCase.ts` | `fetchKitchenStatsUseCase(token)` → `Result<StatsData>` |
| `application/usecases/consume-ingredients-use-case.ts` | Deducts ingredient quantities for a prepared order |

### Managers

| Class | File | Responsibility |
|---|---|---|
| `OrderManager` | `application/managers/OrderManager.ts` | Orchestrates order creation, update, and submission |
| `StatsManager` | `application/managers/StatsManager.ts` | Aggregates raw stats into display-ready metrics |
| `InventoryManager` | `application/managers/inventory-manager.ts` | Coordinates inventory read + deduction operations |

---

## 8. Infrastructure Layer

### `APIIngredientRepository`

**File:** `app/infrastructure/repositories/APIIngredientRepository.ts`

Implements `IngredientRepository` using Axios. All methods return `Result<T>`:

```typescript
class APIIngredientRepository implements IngredientRepository {
  constructor(private axiosInstance: AxiosInstance) {}

  async checkAvailability(items: OrderItem[]): Promise<Result<AvailabilityMap>>;
  async deductIngredients(orderId: string, items: OrderItem[]): Promise<Result<void>>;
  async getDashboardData(): Promise<Result<DashboardData>>;
}
```

### Services

| File | Purpose |
|---|---|
| `services/IngredientDeductionService.ts` | Maps order items to ingredient quantities and calls the deduction API |
| `services/low-stock-notifier.ts` | Generates low-stock alert payloads for the notification system |
| `services/promotionApi.ts` | CRUD operations for promotions/discounts (`/api/promotions`) |
| `services/emailjsNotificationService.ts` | EmailJS integration for client-side email notifications |

---

## 9. Pages & Routes

### Route Overview

| Path | Page | Roles |
|---|---|---|
| `/login` | Login | Guest |
| `/register` | Register | Guest |
| `/dashboard` | Menu Management | Admin, Manager |
| `/analytics` | Revenue & Kitchen Analytics | Admin, Manager |
| `/users` | User & Staff Management | Admin, Manager |
| `/users/[id]` | User Detail | Admin |
| `/inventory/IngredientStockDashboard` | Stock Dashboard | Admin, Manager |
| `/promotions` | Promotions | Admin |
| `/schedule` | Shift Scheduling | Admin, Manager |
| `/waiter_order` | Order Taking + KDS | Admin, Manager, Waiter, Chef |
| `/chef_special` | Chef's Special Display | Admin, Manager, Chef |
| `/billing` | Billing & Payments | Admin, Manager, Waiter, Cashier |
| `/profile` | User Profile | Admin, Manager, Waiter, Chef |
| `/notifications` | Notification Centre | Admin, Manager, Waiter, Chef |
| `/settings` | App Settings | Admin, Manager |
| `/help` | Help & Support | Admin, Manager, Waiter, Chef |

### Page Details

#### `/dashboard` — Menu Management
Admin CRUD interface for menu items. Uses `useMenuData` for data, `ModalManager` for create/edit/delete modals, `MenuFilters` for live search and filtering. The `MenuTable` component renders a sortable, paginated table of items; `MenuGrid` provides a card view.

#### `/analytics` — Analytics
Pulls aggregated stats from `GET /api/orders/stats` via `useStats`. Displays revenue charts (Chart.js line chart), order volume, and a top-dishes ranking. Auto-refreshes on a configurable interval from `SettingsContext.kitchenAutoRefreshSeconds`.

#### `/waiter_order` — Order Taking + Kitchen Display
A two-tab page (`Take Order` / `Kitchen`). The tab switcher is an inline segment control in the page header strip. The page is a full-viewport shell (`h-[calc(100vh-4rem)]`) that gives all remaining height to the child interface.

**WaiterOrderInterface** (`(waiter_order)/WaiterOrderInterface.tsx`):
- Default **list view** (`MenuItemRowWaiter`): 56 px compact rows showing name, category, dietary badge, price, and a one-tap `+` button. Shows 10–12 items at once on a tablet.
- Optional **card view** toggled by the List/Grid button.
- Scrollable **quick-filter pills** (All / Popular / Chef's Pick / Vegetarian / Fast Prep).
- Scrollable **category pills** derived dynamically from the fetched menu.
- Available items are sorted to the top; unavailable items are dimmed below.
- Order panel sidebar appears at `md:` (≥ 768 px / iPad portrait). Below that, a floating cart button opens a slide-in drawer.
- Order is persisted via `useLocalStorage` (`waiter_table_number`, `waiter_customer_name`, `waiter_current_order`).

**KitchenDisplaySystem** (`(waiter_order)/KitchenDisplaySystem.tsx`):
- Fetches active orders via `useOrders` and subscribes to `order_created` / `order_updated` socket events.
- Filter bar (pending / confirmed / preparing / ready) sourced from `SettingsContext.kitchenDefaultFilter`.
- Auto-refresh uses `SettingsContext.kitchenAutoRefreshSeconds` (0 = disabled).
- `compactCards` setting toggles between full and compact order cards.

#### `/billing` — Billing & Payments
Two-panel layout: left panel lists served orders (pending / paid tabs), right panel shows the selected order detail and payment form.

- Fetches `GET /api/billing/served` on mount.
- Payment methods: Cash, Credit Card, Debit Card, KHQR.
- Cash mode shows a "Customer Pays" input with instant change calculation and an "Insufficient funds" guard.
- `PATCH /api/billing/:id/pay` marks the order paid. The UI updates optimistically; a `billing:payment_updated` socket event syncs other open sessions.
- Print receipt: `window.print()` with a `@media print` CSS rule that makes a hidden `#receipt-print-area` div the only visible element.

#### `/settings` — App Settings
Sections: Appearance (theme picker, compact cards), Notifications (master toggle + per-type switches + sound), Kitchen Display (default filter, auto-refresh), Account (profile info, delete account).

Theme picker writes to `SettingsContext` which applies the `dark` class to `<html>` immediately. Notification toggles control which socket events produce visible toasts. Delete account requires password confirmation plus typing `DELETE MY ACCOUNT`.

#### `/help` — Help & Support
Three tabs: **FAQ** (12 accordion Q&A), **Contact Us** (form that `POST`s to `/api/support/contact` → Nodemailer email to the support address), **Role Tips** (contextual guidance per role, highlighting the current user's role).

#### `/notifications` — Notification Centre
Historical view of all `order:notification` events. Renders the `useNotifications()` queue and also fetches persisted notifications from the backend via `GET /api/notifications`.

#### `/profile` — User Profile
Displays user info, role badge, and online status dot. Status is derived from the socket presence system — the component sets itself online (`socket.emit("user_online")`) on mount and offline on unmount. The displayed status always reflects the live socket state, not the stale `user.isActive` DB value.

---

## 10. Component Catalog

### Layout

| Component | File | Description |
|---|---|---|
| `Layout` | `layout/index.tsx` | Root shell — renders Navbar and CollapsibleSidebar |
| `Navbar` | `layout/Navbar/index.tsx` | Fixed top bar (64 px). Shows user name, role badge, notifications bell, logout |
| `CollapsibleSidebar` | `layout/Sidebar/CollapsibleSidebar.tsx` | Fixed left sidebar, collapses to 64 px icons, expands to 256 px on hover |
| `LayoutCoordinator` | `layout/LayoutCoordinator.ts` | Shared mutable state class that coordinates sidebar and navbar without prop drilling |

**Content offset:** `<main>` in `layout.tsx` carries `ml-[83.40px] pt-16` so all page content clears the sidebar and navbar. Individual pages do not add their own top margin.

---

### Auth

| Component | File | Description |
|---|---|---|
| `ProtectedRoute` | `ProtectedRoute/ProtectedRoute.tsx` | Wraps any page. Redirects to `/login` if unauthenticated. Optional `requiredRoles` prop blocks unauthorised roles |

---

### Menu Item Cards

| Component | Description |
|---|---|
| `MenuItemCard` | Full card (image + description + tags + price + Add button). Two variants: `"user"` (customer-facing) and `"waiter"` |
| `MenuItemCardForWaiter` | Wraps `MenuItemCard` with a floating `+` button on hover and an unavailable overlay |
| `MenuItemCardCompact` | Smaller card without image, for dense lists |
| `MenuItemRowWaiter` | **Primary waiter UI.** 56 px compact row: availability dot · name + category · Veg/Chef badges · price · `+` button |

---

### Order Components

| Component | File | Description |
|---|---|---|
| `OrderForm` | `OrderForm/OrderForm.tsx` | Table number, customer name, special notes fields |
| `OrderSummary` | `OrderSummary/OrderSummary.tsx` | Lists cart items, quantity steppers, remove buttons, running total |
| `OrderCard` | `OrderCard/OrderCard.tsx` | KDS order card showing items, status, table, timer |
| `OrderItem` | `OrderItem/OrderItem.tsx` | Single line in an order card |

---

### Menu Management (Admin)

| Component | Description |
|---|---|
| `MenuTable` | Sortable, paginated table of all menu items |
| `MenuGrid` | Card grid of menu items |
| `MenuFilters` | Search input + category / availability / chef-special dropdowns |
| `MenuStats` | Summary cards: total items, available, chef specials, category count |
| `MenuHeader` | Section heading with count badge |
| `MenuTopItemsChart` | Bar chart of top-selling items (Chart.js) |
| `ModalManager` | Renders `CreateItemModal`, `EditItemModal`, `ViewItemModal`, `DeleteItemModal` based on `activeModal` state |

---

### Table Components

| Component | Description |
|---|---|
| `TableSelect` | Grid of table buttons (green = free, red = occupied, blue = selected). Subscribes to `order_created` / `order_updated` for real-time availability. Validates selection on each refresh — auto-clears if the table was taken |
| `TableOccupancyManager` | Admin floor-plan view. Shows live occupancy, selected table detail panel, and a release-table button |

---

### Notifications

| Component | Description |
|---|---|
| `NotificationToast` | Portal-rendered toast stack. Reads the `useNotifications()` queue and `useSettings()` filters. Auto-dismisses after 6 s |

---

### Kitchen

| Component | Description |
|---|---|
| `KitchenStatsPanel` | Real-time kitchen metrics strip: orders today, pending, in-progress, revenue |

---

### Admin / Staff

| Component | Description |
|---|---|
| `UserList` | Staff table with role badges, status indicators, edit/delete actions |
| `PromotionManagement` | Promotions CRUD (create discount rules by %, fixed amount, or BOGO) |

---

### Shared UI

| Component | Description |
|---|---|
| `StarRating` | Read-only 5-star display with fractional support |
| `Pagination` | Page number controls with configurable page size |
| `SearchAndFilterBar` | Combined search input + quick-filter pill row |
| `FilterButtons` | Standalone pill-style filter toggles |
| `IngredientImpactPreview` | Shows which ingredients will be consumed by a pending order |
| `LoadingState` | Skeleton card grid (configurable `count`) |
| `ErrorState` | Error message with retry button |
| `EmptyState` | Empty placeholder with icon and message |

---

## 11. View Models

View models are **static utility classes** that contain presentation logic, keeping components free of formatting code.

### `MenuItemViewModel`

**File:** `app/presentation/viewModels/MenuItemViewModel.ts`

```typescript
class MenuItemViewModel {
  static isAvailable(item: MenuItem): boolean;
  static getAvailabilityStatus(item: MenuItem): "available" | "out-of-stock";
  static formatPrice(price: number): string;             // "$12.50"
  static getChefSpecialBadge(item: MenuItem): string;
  static shouldShowSpecialBadge(item: MenuItem): boolean;
  static getDietaryTagsDisplay(item: MenuItem): string[];
  static getRatingDisplay(item: MenuItem): string;       // "★ 4.8"
  static getCardStateClasses(item: MenuItem): string;    // Tailwind classes
  static getTruncatedDescription(item: MenuItem, maxLength?: number): string;
}
```

### `KitchenStatsViewModel`

**File:** `app/presentation/viewModels/KitchenStatsViewModel.ts`

A hook-based view model (unlike the static `MenuItemViewModel`):

```typescript
const useKitchenStatsViewModel = () => {
  // Returns { stats: StatsData | null, loading: boolean, error: string | null, fetchStats() }
};
```

### `OrderViewModel`

**File:** `app/presentation/viewModels/OrderViewModel.ts`

Formatting helpers for order display: `formatStatus(status)`, `getStatusColor(status)`, `formatOrderDate(date)`.

---

## 12. Sidebar & Navigation

**File:** `app/lib/sidebar/sidebarConfig.tsx`

`SidebarConfig` is a static class. The sidebar component calls `SidebarConfig.getFilteredItems(userRole)` which applies both section-level and item-level role filtering.

### Navigation Structure

```
Dashboard
  ├─ Dashboard        /dashboard       admin, manager, waiter, chef
  ├─ User Interface   /user_interface  admin, manager
  └─ Analytics        /analytics       admin, manager

Restaurant Operations
  ├─ Waiter Order     /waiter_order    admin, manager, waiter        [Live]
  ├─ Chef Special     /chef_special    admin, manager, chef
  ├─ Inventory        /inventory/…     admin, manager
  ├─ Order Mgmt       /waiter_order    admin, manager
  └─ Billing          /billing         admin, manager, cashier, waiter

Management
  ├─ Users            /users           admin                         [Admin]
  ├─ Promotions       /promotions      admin
  ├─ Profile          /profile         admin, manager, waiter, chef
  ├─ Staff Mgmt       /users           admin, manager
  └─ Shift Schedule   /schedule        admin, manager

Authentication (guest only)
  ├─ Login            /login
  └─ Register         /register

System
  ├─ Settings         /settings        admin, manager
  ├─ Notifications    /notifications   admin, manager, waiter, chef  [3]
  └─ Help & Support   /help            admin, manager, waiter, chef
```

### Extending Navigation

1. Add a new `SidebarItem` object in the relevant section builder method.
2. Set the `roles` array to restrict visibility.
3. The `getFilteredItems` method will include it automatically — no other changes needed.

---

## 13. Real-Time System

### Socket Event Map

| Event (direction) | Emitter | Listeners | Payload |
|---|---|---|---|
| `order:notification` (server→client) | Backend on order status change | `NotificationContext` | `OrderNotificationPayload` |
| `order_created` (client→server) | `WaiterOrderInterface` after POST | KDS, `TableSelect`, `TableOccupancyManager` | Full order object |
| `order_updated` (server→client) | Backend on PATCH | `KitchenDisplaySystem`, `TableSelect`, `TableOccupancyManager` | Full order object |
| `billing:payment_updated` (server→client) | Backend on PATCH /billing/:id/pay | `BillingPage` | `{ orderId, paymentStatus, paymentMethod, tableNumber }` |
| `low_stock_alert` (server→client) | Backend inventory check | `InventoryDashboard` | Alert object |
| `user_online` / `user_offline` (client→server) | `ProfilePage` on mount/unmount | Profile's own socket listeners | `userId: string` |
| `user_status_updated` (server→client) | Backend on presence change | `ProfilePage` | `User` object |
| `set_role` (client→server) | `WaiterOrderInterface` on mount | Backend room assignment | role string |
| `join_user_room` (client→server) | `ProfilePage` | Backend | `userId: string` |

### Cleanup Pattern

Every component that registers socket listeners must clean them up:

```typescript
useEffect(() => {
  if (!socket) return;

  const handler = (data: OrderData) => { /* … */ };
  socket.on("order_updated", handler);

  return () => {
    socket.off("order_updated", handler);  // named handler — only removes this one
  };
}, [socket]);
```

> **Important:** Avoid `socket.off("event")` without a handler reference — this removes **all** listeners for that event, which can break other components.

---

## 14. Authentication & Authorization

### Login Flow

```
POST /api/auth/login  { email, password }
  ↓
Backend returns  { token, user }
  ↓
AuthContext stores token in cookie (30-day expiry)
AuthContext sets axiosInstance Authorization header
AuthContext sets user in state
  ↓
SocketProvider sees token → connects Socket.IO
  ↓
Router pushes to /dashboard
```

### Session Restoration (on app load)

```
AuthProvider mounts
  ↓
Reads token from cookies
  ↓
GET /api/auth/me  (Authorization: Bearer <token>)
  ↓
  success → setUser(data.user), mark isLoading=false
  failure → clear cookie, setUser(null), show login
```

### Route Protection

Wrap any page with `<ProtectedRoute>` to enforce authentication:

```tsx
// Require authentication (any role):
<ProtectedRoute>
  <ProfilePage />
</ProtectedRoute>

// The sidebar already filters items by role — no per-page role checks needed
// for pages reachable only through the sidebar.
```

### Role Enforcement

Role checks happen at two points:

1. **Sidebar config** — `SidebarConfig.getFilteredItems(role)` omits links not accessible to the role.
2. **Backend** — Every API route uses `authorize("admin", "manager", …)` middleware. A forged frontend role gets a `403` from the server.

---

## 15. Settings & Theming

### Theme System

Three modes: `light`, `dark`, `system`.

- `system` reads `window.matchMedia("(prefers-color-scheme: dark)")` and also subscribes to changes via the `change` event listener.
- When dark mode is active, `document.documentElement.classList.add("dark")` is called. Removing it reverts to light.
- `globals.css` overrides Tailwind utility classes under the `html.dark` selector:

```css
html.dark .bg-white       { background-color: #1c1c1e; }
html.dark .text-gray-900  { color: #f5f5f5; }
html.dark .border-gray-200 { border-color: #333333; }
/* … */
```

This universal approach means existing components gain dark mode without per-component `dark:` variants.

### Flash Prevention

`layout.tsx` includes an inline `<script>` that runs synchronously before React hydrates:

```js
(function() {
  try {
    var s = localStorage.getItem("rms_settings");
    var t = s ? JSON.parse(s).theme : "light";
    var d = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (t === "dark" || (t === "system" && d))
      document.documentElement.classList.add("dark");
  } catch(e) {}
})();
```

`<html suppressHydrationWarning>` suppresses the expected hydration class mismatch.

---

## 16. Error Handling

### Result Type (domain / application layers)

Use cases never throw. They return `Result<T>`:

```typescript
// Correct usage:
const result = await loadOrder(repo);
if (!result.ok) {
  setError(result.error);
  return;
}
setCurrentOrder(result.value);
```

### Axios Errors (infrastructure / presentation layers)

The `axiosInstance` response interceptor handles `401` globally (auto-logout). Component-level errors are caught in try/catch and stored in local state:

```typescript
try {
  const { data } = await axiosInstance.get("/api/orders");
  setOrders(data.orders);
} catch {
  setError("Failed to load orders. Please try again.");
}
```

Never surface raw Axios error objects to the UI — extract `error.response?.data?.message` or use a generic fallback string.

### API Error Response Shape

The backend consistently returns:

```typescript
// Success
{ success: true, data?: any, message?: string }

// Failure
{ success: false, message: string }
```

---

## 17. Data Flow Diagrams

### Order Creation (Waiter → Kitchen)

```
Waiter taps [+] on menu row
  ↓
MenuItemRowWaiter calls orderManager.addToOrder(item)
  ↓
useOrderManager → OrderUseCases.addToOrder(repo, item)
  ↓
LocalStorageOrderRepository saves to "waiter_current_order"
  ↓
State updates → cart count badge increments
  ↓
Waiter taps [Send to Kitchen]
  ↓
WaiterOrderInterface: POST /api/orders  { items, tableNumber, … }
  ↓
Backend: validates, creates Order doc, deducts inventory
  ↓
Backend emits order:notification to all clients
  ↓
NotificationContext enqueues toast (if type enabled in settings)
  ↓
socket.emit("order_created", responseData)  ← client notifies KDS
  ↓
KitchenDisplaySystem receives "order_created" → refreshes order list
  ↓
TableSelect marks table as occupied
```

### Payment Processing

```
Cashier/Waiter opens /billing
  ↓
GET /api/billing/served → list of served + unpaid orders
  ↓
Selects order → enters cash amount → change calculated client-side
  ↓
Taps [Mark as Paid]
  ↓
PATCH /api/billing/:id/pay  { paymentMethod }
  ↓
Backend sets paymentStatus="paid", emits billing:payment_updated
  ↓
All open billing sessions update order status via socket
  ↓
[Print Receipt] → window.print() → @media print shows receipt div only
```

### Dark Mode Activation

```
User opens /settings → selects "Dark"
  ↓
SettingsContext.updateSetting("theme", "dark")
  ↓
applyTheme("dark") → document.documentElement.classList.add("dark")
  ↓
settings saved to localStorage "rms_settings"
  ↓
globals.css html.dark overrides take effect immediately (no page reload)
  ↓
Next time user opens app:
  inline <script> reads localStorage → adds "dark" class before first paint
```

---

## 18. Environment & Setup

### Prerequisites

- Node.js ≥ 18
- Backend API running on port 5000 (see backend documentation)

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

This is the only required variable. The socket connection uses the same URL.

For ngrok / remote development:
```env
NEXT_PUBLIC_API_URL=https://your-tunnel.ngrok-free.app
```

### Development

```bash
cd restaurant_mangement_system
npm install
npm run dev          # http://localhost:3000 (Turbopack)
```

### Production Build

```bash
npm run build        # Next.js build with Turbopack
npm start            # Serve production build
```

### Linting

```bash
npm run lint         # ESLint
```

---

## 19. Testing

Tests live in `app/__test__/`. The stack is Jest + React Testing Library.

```bash
npm test             # single run
npm run test:watch   # watch mode
npm run test:coverage
```

### Test File Conventions

| File | What it tests |
|---|---|
| `settingsContext.test.tsx` | Theme application, localStorage persistence, updateSetting, resetSettings |
| `settingsPage.test.tsx` | Theme picker render, toggle switches (aria-label), delete modal flow |
| `notification.test.tsx` | Enqueue, auto-dismiss, max queue limit, type filtering |

### Mocking Pattern

Components that call `useSettings()` or `useAuth()` need those contexts mocked:

```typescript
jest.mock("../contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      soundEnabled: false,
      toastsEnabled: true,
      toastTypes: {
        order_created: true,
        order_preparing: true,
        order_ready: true,
        order_served: true,
      },
    },
    updateSetting: jest.fn(),
    resetSettings: jest.fn(),
  }),
}));
```

---

## 20. Adding New Features

### Adding a New Page

1. Create `app/<route>/page.tsx` with `"use client"` at the top.
2. Use `axiosInstance` from `useAuth()` for all API calls.
3. The page automatically gets the navbar + sidebar from the root layout — no layout wrapper needed.
4. The content area starts below the navbar because `<main>` has `pt-16`. Do not add `mt-16` or `mt-18` to the page root — these are now handled globally.

```tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function NewFeaturePage() {
  const { axiosInstance } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosInstance.get("/api/new-feature").then(r => setData(r.data));
  }, [axiosInstance]);

  return <div className="p-4 md:p-6">{/* … */}</div>;
}
```

### Adding a Sidebar Link

In `app/lib/sidebar/sidebarConfig.tsx`, add to the appropriate section builder:

```typescript
{
  id: "new-feature",
  text: "New Feature",
  icon: <SomeIcon className={this.ICON_SIZE} />,
  link: "/new-feature",
  roles: ["admin", "manager"],   // restrict as needed
},
```

### Adding a New Socket Event

**Backend:** emit the event from the relevant Express controller.

**Frontend:** subscribe in the component or hook that needs it:

```typescript
useEffect(() => {
  if (!socket) return;
  const handler = (payload: MyPayload) => { /* update state */ };
  socket.on("my_new_event", handler);
  return () => { socket.off("my_new_event", handler); };
}, [socket]);
```

Add the event to the [Socket Event Map](#13-real-time-system) table.

### Adding a New Use Case

1. Define the function in `application/usecases/`:

```typescript
export async function myUseCase(
  repo: MyRepository,
  input: InputType,
): Promise<Result<OutputType>> {
  // business logic only — no UI, no direct API calls
  const data = await repo.someMethod(input);
  if (!data) return Err("Resource not found");
  return Ok(data);
}
```

2. Create a repository interface in `domain/repositories/`.
3. Implement it in `infrastructure/repositories/` using `axiosInstance`.
4. Call it from a custom hook in `hooks/` that provides `axiosInstance` from context.

### Dark Mode in New Components

New components automatically inherit dark mode via the global CSS overrides in `globals.css` if they use standard Tailwind colour utilities (`bg-white`, `text-gray-900`, etc.). You only need `dark:` variants for custom colours or components that need distinct dark-mode styling beyond the defaults.

---

*End of documentation.*
