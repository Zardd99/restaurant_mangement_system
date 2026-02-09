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

export interface SidebarItem {
  id: string;
  text: string;
  icon: React.ReactNode;
  link?: string;
  onClick?: () => void;
  children?: SidebarItem[];
  badge?: string | number;
  roles?: string[];
  isNew?: boolean;
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
  roles?: string[];
}

export class SidebarConfig {
  private static readonly ICON_SIZE = "w-5 h-5";

  static getAllSections(role: string = "guest"): SidebarSection[] {
    const allSections = [
      this.getDashboardSection(),
      this.getOperationsSection(),
      this.getUserManagementSection(),
      this.getAuthenticationSection(role),
      this.getSystemSection(),
    ];

    // Filter sections based on role
    return allSections.filter((section) => {
      // If section has no roles defined, show to all
      if (!section.roles || section.roles.length === 0) return true;

      // If section has "all" in roles, show to all
      if (section.roles.includes("all")) return true;

      // If role is "guest", only show authentication section
      if (role === "guest") {
        return section.id === "authentication";
      }

      // Check if role is included in section roles
      return section.roles.includes(role);
    });
  }

  private static getDashboardSection(): SidebarSection {
    return {
      id: "dashboard",
      label: "Dashboard",
      roles: ["admin", "manager", "waiter", "chef", "all"], // Added "all"
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
          roles: ["admin", "manager"], // Only for admin and manager
        },
        {
          id: "analytics",
          text: "Analytics",
          icon: <BarChart className={this.ICON_SIZE} />,
          link: "/analytics",
          roles: ["admin", "manager"], // Only for admin and manager
        },
      ],
    };
  }

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
      roles: ["all"], // This section is always visible
      items: items.filter((item) => {
        if (!item.roles || item.roles.includes("all")) return true;
        return item.roles.includes(role);
      }),
    };
  }

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

  static getFilteredItems(userRole: string): SidebarSection[] {
    const sections = this.getAllSections(userRole);

    // Filter items within each section based on roles
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // If item has no roles defined, show to all
          if (!item.roles || item.roles.length === 0) return true;

          // If item has "all" in roles, show to all
          if (item.roles.includes("all")) return true;

          // For guest users, only show guest items
          if (userRole === "guest") {
            return item.roles.includes("guest");
          }

          // Check if user role is included in item roles
          return item.roles.includes(userRole);
        }),
      }))
      .filter((section) => section.items.length > 0); // Remove empty sections
  }

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

  static getMobileSidebarItems(userRole: string): SidebarItem[] {
    const sections = this.getFilteredItems(userRole);
    const primaryItems: SidebarItem[] = [];

    sections.forEach((section) => {
      // Take first 2 items from each section for mobile
      primaryItems.push(...section.items.slice(0, 2));
    });

    return primaryItems.slice(0, 8); // Limit to 8 items for mobile
  }
}
