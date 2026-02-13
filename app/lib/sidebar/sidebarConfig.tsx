/**
 * =============================================================================
 * SIDEBAR CONFIGURATION (Clean Architecture – UI Configuration Layer)
 * =============================================================================
 *
 * Defines the structure, content, and access control for the application’s
 * sidebar navigation. The configuration is role‑based and returns filtered
 * sections and items according to the user’s role.
 *
 * ✅ Responsibilities:
 *   - Provide a single source of truth for sidebar items.
 *   - Enforce role‑based visibility (admin, manager, waiter, chef, guest).
 *   - Support dynamic filtering and badge/update indicators.
 *
 * 🚫 Does NOT:
 *   - Render any UI components.
 *   - Manage authentication state (relies on caller to provide role).
 *
 * @module SidebarConfig
 */

import {
  LayoutDashboard,
  Palette,
  LogIn,
  UserPlus,
  User,
  Users,
  ChefHat,
  ShoppingCart,
  Package,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  BarChart,
  FileText,
  CreditCard,
  MessageSquare,
  Shield,
  Calendar,
  TrendingUp,
  Zap,
} from "lucide-react";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * A single navigation item inside the sidebar.
 */
export interface SidebarItem {
  /** Unique identifier for the item (used for active state look‑ups). */
  id: string;
  /** Display label. */
  text: string;
  /** Lucide React icon component (already instantiated with className). */
  icon: React.ReactNode;
  /** Optional route path for client‑side navigation. */
  link?: string;
  /** Optional click handler (overrides link if provided). */
  onClick?: () => void;
  /** Nested child items (submenu). */
  children?: SidebarItem[];
  /** Optional badge text or number (e.g., "Live", 3). */
  badge?: string | number;
  /** Array of roles that are allowed to see this item. */
  roles?: string[];
  /** If true, shows a "New" indicator. */
  isNew?: boolean;
}

/**
 * A logical grouping of sidebar items.
 */
export interface SidebarSection {
  id: string;
  /** Section title displayed above its items. */
  label: string;
  /** Items belonging to this section. */
  items: SidebarItem[];
  /** Optional role restrictions for the entire section. */
  roles?: string[];
}

// =============================================================================
// SIDEBAR CONFIGURATION – STATIC BUILDER
// =============================================================================

/**
 * SidebarConfig
 * -------------
 * Static utility class that builds and filters sidebar navigation based on
 * user roles. All methods are pure; no side effects.
 */
export class SidebarConfig {
  /** Consistent icon size applied to every Lucide icon. */
  private static readonly ICON_SIZE = "w-5 h-5";

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS
  // ---------------------------------------------------------------------------

  /**
   * Returns all sidebar sections, unfiltered except for the top‑level
   * section role check. This method is primarily used internally; external
   * callers should prefer `getFilteredItems()`.
   *
   * @param role - Current user role (default "guest").
   * @returns Array of sections that the role is permitted to see.
   */
  static getAllSections(role: string = "guest"): SidebarSection[] {
    const allSections = [
      this.getDashboardSection(),
      this.getOperationsSection(),
      this.getUserManagementSection(),
      this.getAuthenticationSection(role),
      this.getSystemSection(),
    ];

    // Section‑level filtering: if section.roles is defined, the role must be included.
    return allSections.filter((section) => {
      if (!section.roles || section.roles.length === 0) return true;
      if (section.roles.includes("all")) return true;
      if (role === "guest") {
        // Guests can only see the authentication section.
        return section.id === "authentication";
      }
      return section.roles.includes(role);
    });
  }

  /**
   * Returns sidebar sections with **both** section‑level and item‑level
   * role filtering applied. Empty sections are removed.
   *
   * @param userRole - Current user role (e.g., "admin", "guest").
   * @returns Fully filtered sidebar sections ready for rendering.
   */
  static getFilteredItems(userRole: string): SidebarSection[] {
    const sections = this.getAllSections(userRole);

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.roles || item.roles.length === 0) return true;
          if (item.roles.includes("all")) return true;
          if (userRole === "guest") {
            return item.roles.includes("guest");
          }
          return item.roles.includes(userRole);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }

  /**
   * Retrieves a single sidebar item by its unique ID.
   * Useful for programmatically setting active states.
   *
   * @param itemId   - ID of the item to find.
   * @param userRole - Role used to filter which sections/items are visible.
   * @returns The matching SidebarItem, or null if not found.
   */
  static getItemById(
    itemId: string,
    userRole: string = "guest",
  ): SidebarItem | null {
    const allSections = this.getAllSections(userRole);
    for (const section of allSections) {
      const item = section.items.find((item) => item.id === itemId);
      if (item) return item;
    }
    return null;
  }

  /**
   * Generates a compact list of sidebar items suitable for mobile bottom
   * navigation. Takes the first two items from each filtered section,
   * up to a maximum of eight items.
   *
   * @param userRole - Current user role.
   * @returns Array of up to 8 SidebarItem objects.
   */
  static getMobileSidebarItems(userRole: string): SidebarItem[] {
    const sections = this.getFilteredItems(userRole);
    const primaryItems: SidebarItem[] = [];

    sections.forEach((section) => {
      // Take first 2 items from each section for mobile brevity
      primaryItems.push(...section.items.slice(0, 2));
    });

    return primaryItems.slice(0, 8); // Cap at 8 items for mobile
  }

  // ---------------------------------------------------------------------------
  // PRIVATE SECTION BUILDERS
  // ---------------------------------------------------------------------------

  /**
   * Dashboard section – general overview and UI component showcase.
   */
  private static getDashboardSection(): SidebarSection {
    return {
      id: "dashboard",
      label: "Dashboard",
      roles: ["admin", "manager", "waiter", "chef", "all"],
      items: [
        {
          id: "main-dashboard",
          text: "Dashboard",
          icon: <LayoutDashboard className={this.ICON_SIZE} />,
          link: "/dashboard",
          badge: "Updated",
        },
        {
          id: "ui-components",
          text: "User Interface",
          icon: <Palette className={this.ICON_SIZE} />,
          link: "/user_interface",
          isNew: true,
          roles: ["admin", "manager"],
        },
        {
          id: "analytics",
          text: "Analytics",
          icon: <BarChart className={this.ICON_SIZE} />,
          link: "/analytics",
          roles: ["admin", "manager"],
        },
      ],
    };
  }

  /**
   * Operations section – core restaurant workflows (ordering, kitchen, inventory).
   */
  private static getOperationsSection(): SidebarSection {
    return {
      id: "operations",
      label: "Restaurant Operations",
      roles: ["admin", "manager", "waiter", "chef"],
      items: [
        {
          id: "waiter-order",
          text: "Waiter Order",
          icon: <ShoppingCart className={this.ICON_SIZE} />,
          link: "/waiter_order",
          badge: "Live",
          roles: ["admin", "manager", "waiter"],
        },
        {
          id: "chef-special",
          text: "Chef Special",
          icon: <ChefHat className={this.ICON_SIZE} />,
          link: "/chef_special",
          roles: ["admin", "manager", "chef"],
        },
        {
          id: "inventory",
          text: "Inventory Dashboard",
          icon: <Package className={this.ICON_SIZE} />,
          link: "/inventory/IngredientStockDashboard",
          roles: ["admin", "manager"],
        },
        {
          id: "orders",
          text: "Order Management",
          icon: <FileText className={this.ICON_SIZE} />,
          link: "/waiter_order",
          roles: ["admin", "manager"],
        },
        {
          id: "billing",
          text: "Billing & Payments",
          icon: <CreditCard className={this.ICON_SIZE} />,
          link: "/billing",
          roles: ["admin", "manager"],
        },
      ],
    };
  }

  /**
   * User management section – staff, promotions, profiles.
   */
  private static getUserManagementSection(): SidebarSection {
    return {
      id: "user-management",
      label: "Management",
      roles: ["admin", "manager"],
      items: [
        {
          id: "users",
          text: "Users",
          icon: <Users className={this.ICON_SIZE} />,
          link: "/users",
          badge: "Admin",
          roles: ["admin"],
        },
        {
          id: "promotions",
          text: "Promotions",
          icon: <Zap className={this.ICON_SIZE} />,
          link: "/promotions",
          roles: ["admin"],
        },
        {
          id: "profile",
          text: "Profile",
          icon: <User className={this.ICON_SIZE} />,
          link: "/profile",
          roles: ["admin", "manager", "waiter", "chef"],
        },
        {
          id: "staff",
          text: "Staff Management",
          icon: <Shield className={this.ICON_SIZE} />,
          link: "/users",
          roles: ["admin", "manager"],
        },
        {
          id: "schedule",
          text: "Shift Schedule",
          icon: <Calendar className={this.ICON_SIZE} />,
          link: "/schedule",
          roles: ["admin", "manager"],
        },
      ],
    };
  }

  /**
   * Authentication / Account section – login, register, or account
   * related items. Dynamically adjusts its label based on the user role.
   *
   * @param role - Current user role.
   */
  private static getAuthenticationSection(role: string): SidebarSection {
    const items = [
      {
        id: "login",
        text: "Login",
        icon: <LogIn className={this.ICON_SIZE} />,
        link: "/login",
        roles: ["guest"],
      },
      {
        id: "register",
        text: "Register",
        icon: <UserPlus className={this.ICON_SIZE} />,
        link: "/register",
        roles: ["guest"],
      },
    ];

    return {
      id: "authentication",
      label: role === "guest" ? "Authentication" : "Account",
      roles: ["all"],
      items: items.filter((item) => {
        if (!item.roles || item.roles.includes("all")) return true;
        return item.roles.includes(role);
      }),
    };
  }

  /**
   * System section – settings, notifications, help, feedback, performance.
   */
  private static getSystemSection(): SidebarSection {
    return {
      id: "system",
      label: "System",
      roles: ["admin", "manager"],
      items: [
        {
          id: "settings",
          text: "Settings",
          icon: <Settings className={this.ICON_SIZE} />,
          link: "/settings",
          roles: ["admin", "manager"],
        },
        {
          id: "notifications",
          text: "Notifications",
          icon: <Bell className={this.ICON_SIZE} />,
          link: "/notifications",
          badge: 3,
          roles: ["admin", "manager", "waiter", "chef"],
        },
        {
          id: "help",
          text: "Help & Support",
          icon: <HelpCircle className={this.ICON_SIZE} />,
          link: "/help",
          roles: ["admin", "manager", "waiter", "chef"],
        },
        {
          id: "feedback",
          text: "Feedback",
          icon: <MessageSquare className={this.ICON_SIZE} />,
          link: "/feedback",
          roles: ["admin", "manager", "waiter", "chef"],
        },
        {
          id: "performance",
          text: "Performance",
          icon: <TrendingUp className={this.ICON_SIZE} />,
          link: "/performance",
          roles: ["admin"],
        },
      ],
    };
  }
}
