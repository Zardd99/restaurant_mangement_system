/**
 * Frontend mirror of the backend RBAC matrix (backend_restaurant/config/rbac.ts).
 *
 * Used ONLY for UI gating (hiding nav/actions a role cannot use and guarding
 * routes). The backend remains the authoritative enforcement point — never rely
 * on this for security. Keep this matrix in sync with the backend.
 */

export const ROLES = [
  "admin",
  "manager",
  "chef",
  "waiter",
  "cashier",
  "customer",
] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | "menu:read"
  | "menu:write"
  | "category:read"
  | "category:write"
  | "inventory:read"
  | "inventory:write"
  | "supplier:read"
  | "supplier:write"
  | "order:read"
  | "order:create"
  | "order:update"
  | "order:delete"
  | "order:status"
  | "billing:read"
  | "billing:pay"
  | "receipt:read"
  | "receipt:list"
  | "receipt:write"
  | "table:read"
  | "table:manage"
  | "promotion:manage"
  | "price:read"
  | "review:read"
  | "review:write"
  | "notification:read"
  | "notification:manage"
  | "user:manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "menu:read",
    "menu:write",
    "category:read",
    "category:write",
    "inventory:read",
    "inventory:write",
    "supplier:read",
    "supplier:write",
    "order:read",
    "order:create",
    "order:update",
    "order:delete",
    "order:status",
    "billing:read",
    "billing:pay",
    "receipt:read",
    "receipt:list",
    "receipt:write",
    "table:read",
    "table:manage",
    "promotion:manage",
    "price:read",
    "review:read",
    "review:write",
    "notification:read",
    "notification:manage",
    "user:manage",
  ],
  manager: [
    "menu:read",
    "menu:write",
    "category:read",
    "category:write",
    "inventory:read",
    "inventory:write",
    "supplier:read",
    "supplier:write",
    "order:read",
    "order:create",
    "order:update",
    "order:delete",
    "order:status",
    "billing:read",
    "billing:pay",
    "receipt:read",
    "receipt:list",
    "receipt:write",
    "table:read",
    "table:manage",
    "promotion:manage",
    "price:read",
    "review:read",
    "review:write",
    "notification:read",
    "notification:manage",
  ],
  chef: [
    "menu:read",
    "category:read",
    "inventory:read",
    "order:read",
    "order:status",
    "notification:read",
  ],
  waiter: [
    "menu:read",
    "category:read",
    "order:read",
    "order:create",
    "order:update",
    "order:status",
    "billing:read",
    "billing:pay",
    "receipt:read",
    "table:read",
    "table:manage",
    "notification:read",
  ],
  cashier: [
    "menu:read",
    "category:read",
    "order:read",
    "billing:read",
    "billing:pay",
    "receipt:read",
    "notification:read",
  ],
  customer: ["menu:read", "category:read", "order:create", "review:write"],
};

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

export const hasPermission = (
  role: string | undefined,
  permission: Permission,
): boolean => {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

export const hasAnyPermission = (
  role: string | undefined,
  permissions: Permission[],
): boolean => permissions.some((permission) => hasPermission(role, permission));

/** Roles permitted into the staff/admin dashboard area. */
export const STAFF_ROLES: Role[] = [
  "admin",
  "manager",
  "chef",
  "waiter",
  "cashier",
];
