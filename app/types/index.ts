/**
 * @module MongooseModels
 * @description Defines the MongoDB document interfaces for the restaurant management system.
 * These interfaces represent the shape of the data stored in the database and are used
 * for type‑safety throughout the application.
 *
 * All interfaces extend Mongoose's `Document` to include the built‑in document methods
 * and properties (_id, save(), etc.).
 */

import { Document, Types } from "mongoose";

// ============================================================================
// User & Authentication
// ============================================================================

/**
 * User document interface.
 * Represents a system user with authentication and role‑based access control.
 */
export interface IUser extends Document {
  /** Full name of the user. */
  name: string;
  /** Email address – used for login and communication. */
  email: string;
  /** Hashed password. */
  password: string;
  /** System role determining permissions. */
  role: "customer" | "admin" | "staff";
  /** Timestamp of account creation. */
  createdAt: Date;
  /** Compares a plain‑text password with the stored hash. */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============================================================================
// Menu & Catalog
// ============================================================================

/**
 * Category document interface.
 * Represents a grouping of menu items (e.g., Appetizers, Mains, Desserts).
 */
export interface ICategory extends Document {
  /** Display name of the category. */
  name: string;
  /** Short description of the category. */
  description: string;
  /** URL or path to the category image. */
  image: string;
  /** Whether the category is currently active and visible. */
  isActive: boolean;
  /** Creation timestamp. */
  createdAt: Date;
  /** Last update timestamp. */
  updatedAt: Date;
}

/**
 * Menu item document interface.
 * Represents a single dish or beverage available for order.
 */
export interface IMenuItem extends Document {
  /** Display name of the menu item. */
  name: string;
  /** Detailed description. */
  description: string;
  /** Current selling price. */
  price: number;
  /** Reference to the category this item belongs to. */
  category: Types.ObjectId;
  /** URL or path to the menu item image. */
  image: string;
  /** List of ingredient names (human‑readable). */
  ingredients: string[];
  /** Dietary tags (e.g., "vegan", "gluten‑free"). */
  dietaryTags: string[];
  /** Whether the item is currently available for ordering. */
  availability: boolean;
  /** Estimated preparation time in minutes. */
  preparationTime: number;
  /** Whether the item is marked as a chef's special. */
  chefSpecial: boolean;
  /** Average customer rating (0‑5). */
  averageRating: number;
  /** Number of reviews received. */
  reviewCount: number;
  /** Creation timestamp. */
  createdAt: Date;
  /** Last update timestamp. */
  updatedAt: Date;
}

// ============================================================================
// Orders
// ============================================================================

/**
 * Order item subdocument interface.
 * Represents a single line item within an order.
 */
export interface IOrderItem {
  /** Reference to the menu item being ordered. */
  menuItem: Types.ObjectId;
  /** Quantity of this item. */
  quantity: number;
  /** Special requests or modifications (e.g., "no onions"). */
  specialInstructions: string;
  /** Price per unit at the time of ordering. */
  price: number;
}

/**
 * Order document interface.
 * Represents a customer order placed through the system.
 */
export interface IOrder extends Document {
  /** Array of items included in the order. */
  items: IOrderItem[];
  /** Sum of (price × quantity) for all items. */
  totalAmount: number;
  /** Current processing status. */
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "served"
    | "cancelled";
  /** Reference to the customer who placed the order. */
  customer: Types.ObjectId;
  /** Table number (for dine‑in orders). */
  tableNumber?: number;
  /** Type of order – affects preparation and serving. */
  orderType: "dine-in" | "takeaway" | "delivery";
  /** Date the order was placed (can be in the past for reservations). */
  orderDate: Date;
  /** Record creation timestamp. */
  createdAt: Date;
  /** Record last update timestamp. */
  updatedAt: Date;
}

// ============================================================================
// Reviews & Feedback
// ============================================================================

/**
 * Review document interface.
 * Represents a customer's rating and written feedback for a menu item.
 */
export interface IReview extends Document {
  /** Reference to the user who wrote the review. */
  user: Types.ObjectId;
  /** Reference to the menu item being reviewed. */
  menuItem: Types.ObjectId;
  /** Numerical rating (typically 1‑5). */
  rating: number;
  /** Written feedback text. */
  comment: string;
  /** Date the review was submitted. */
  date: Date;
}

// ============================================================================
// Pricing & History
// ============================================================================

/**
 * Price history document interface.
 * Tracks changes to menu item prices over time for auditing purposes.
 */
export interface IPriceHistory extends Document {
  /** Reference to the menu item whose price changed. */
  menuItem: Types.ObjectId;
  /** Price before the change. */
  oldPrice: number;
  /** Price after the change. */
  newPrice: number;
  /** Reference to the user who performed the change. */
  changedBy: Types.ObjectId;
  /** Timestamp of the price change. */
  changeDate: Date;
}
