"use client";

// ============================================================================
// External Imports
// ============================================================================
import React, { useState, useEffect } from "react";
import {
  Search,
  Edit3,
  Trash2,
  Eye,
  Users,
  UserCheck,
  UserX,
  Shield,
  Loader,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

/**
 * Represents a user in the system.
 * Matches the backend MongoDB User model.
 */
interface User {
  /** Unique identifier (MongoDB ObjectId) */
  _id: string;
  /** Full name of the user */
  name: string;
  /** Email address (unique) */
  email: string;
  /** System role – determines permissions and access levels */
  role: "admin" | "manager" | "chef" | "waiter" | "cashier" | "customer";
  /** Optional contact phone number */
  phone?: string;
  /** Account status: true = active, false = inactive/disabled */
  isActive: boolean;
  /** Timestamp of user creation */
  createdAt: string;
  /** Timestamp of last update */
  updatedAt: string;
}

/**
 * Aggregated user statistics for the dashboard header cards.
 */
interface UserStats {
  /** Total number of users in the system */
  total: number;
  /** Number of active users (isActive = true) */
  active: number;
  /** Number of inactive users (isActive = false) */
  inactive: number;
  /** Number of users with admin role */
  admins: number;
}

// ============================================================================
// Helper Functions (Pure, UI‑focused)
// ============================================================================

/**
 * Returns Tailwind CSS classes for a role badge based on the user's role.
 * Provides consistent, semantic color coding across the UI.
 *
 * @param role - The user's role string
 * @returns Space-separated CSS classes for background, text, and border
 */
const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 border-red-200",
    manager: "bg-purple-100 text-purple-800 border-purple-200",
    chef: "bg-orange-100 text-orange-800 border-orange-200",
    waiter: "bg-blue-100 text-blue-800 border-blue-200",
    cashier: "bg-green-100 text-green-800 border-green-200",
    customer: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[role] || colors.customer;
};

/**
 * Formats an ISO 8601 date string into a human‑readable format.
 * Example: "2024-01-15T10:30:00.000Z" → "Jan 15, 2024"
 *
 * @param dateString - ISO date string from the API
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ============================================================================
// Main Component: AdminUserDashboard
// ============================================================================

/**
 * AdminUserDashboard Component
 *
 * A comprehensive user management dashboard for administrators.
 * Provides full CRUD operations, real‑time filtering, role assignment,
 * status toggling, and detailed user views.
 *
 * Features:
 * - Fetch and display all users with pagination
 * - Search by name or email
 * - Filter by role and account status
 * - View user details, edit profile, delete user
 * - Toggle active/inactive status with an optimistic UI
 * - Responsive design with loading and error states
 *
 * @component
 * @returns {JSX.Element} The rendered dashboard
 */
const AdminUserDashboard = () => {
  // --------------------------------------------------------------------------
  // Hooks & Context
  // --------------------------------------------------------------------------
  const {
    token,
    logout,
    isLoading: authLoading,
    user: currentUser,
  } = useAuth();
  const router = useRouter();

  // --------------------------------------------------------------------------
  // State Declarations
  // --------------------------------------------------------------------------

  /** All users fetched from the API */
  const [users, setUsers] = useState<User[]>([]);
  /** Users after applying search and filter criteria */
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  /** UI loading state for initial data fetch */
  const [loading, setLoading] = useState(true);
  /** Error message to display, or null if no error */
  const [error, setError] = useState<string | null>(null);
  /** Processing state for asynchronous operations (edit/delete) */
  const [processing, setProcessing] = useState(false);

  /** Current search term (case‑insensitive substring) */
  const [searchTerm, setSearchTerm] = useState("");
  /** Currently selected role filter value */
  const [roleFilter, setRoleFilter] = useState("all");
  /** Currently selected status filter value */
  const [statusFilter, setStatusFilter] = useState("all");

  /** Current pagination page (1‑indexed) */
  const [currentPage, setCurrentPage] = useState(1);

  /** User being viewed/edited/deleted in the modal */
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  /** Whether the modal is visible */
  const [showModal, setShowModal] = useState(false);
  /** Type of modal operation */
  const [modalType, setModalType] = useState<"view" | "edit" | "delete">(
    "view",
  );

  /** Edit form field: user name */
  const [editName, setEditName] = useState("");
  /** Edit form field: user role */
  const [editRole, setEditRole] = useState<User["role"]>("customer");
  /** Edit form field: user phone number */
  const [editPhone, setEditPhone] = useState("");

  // --------------------------------------------------------------------------
  // Constants & Configuration
  // --------------------------------------------------------------------------

  /** Base API URL from environment variables */
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  /** Number of users displayed per page */
  const usersPerPage = 10;

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * Effect: Redirect non‑admin users away from the dashboard.
   * Runs once when authentication state is resolved.
   */
  useEffect(() => {
    if (!authLoading && currentUser?.role !== "admin") {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  /**
   * Effect: Fetch all users from the API when the component mounts
   * or when the authentication token changes.
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Guard: authentication must be ready
        if (!token || authLoading) return;

        const response = await fetch(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        // Handle HTTP errors and session expiration
        if (!response.ok) {
          if (response.status === 401) {
            logout();
            throw new Error("Session expired. Please log in again.");
          } else if (response.status === 403) {
            throw new Error(
              "You don't have permission to access this resource.",
            );
          } else {
            throw new Error(`Failed to fetch users: ${response.status}`);
          }
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, authLoading, logout, API_URL]);

  /**
   * Effect: Apply client‑side filtering whenever users, search term,
   * role filter, or status filter changes.
   * Resets pagination to page 1 when filters change.
   */
  useEffect(() => {
    const filtered = users.filter((user) => {
      // Search by name or email (case‑insensitive)
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page
  }, [users, searchTerm, roleFilter, statusFilter]);

  /**
   * Effect: Populate edit form fields when a user is selected for editing.
   */
  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditRole(selectedUser.role);
      setEditPhone(selectedUser.phone || "");
    }
  }, [selectedUser]);

  // --------------------------------------------------------------------------
  // Derived Data (Computed Values)
  // --------------------------------------------------------------------------

  /** Aggregated user statistics for the dashboard cards */
  const stats: UserStats = {
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
    admins: users.filter((user) => user.role === "admin").length,
  };

  /** Total number of pages based on filtered users */
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  /** Index of the first user on the current page (0‑based) */
  const startIndex = (currentPage - 1) * usersPerPage;
  /** Index of the last user on the current page (exclusive) */
  const endIndex = startIndex + usersPerPage;
  /** Users to display on the current page */
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // --------------------------------------------------------------------------
  // Event Handlers & API Operations
  // --------------------------------------------------------------------------

  /**
   * Opens the modal with the specified user and operation type.
   *
   * @param user - The user to operate on
   * @param type - Type of modal (view, edit, delete)
   */
  const openModal = (user: User, type: "view" | "edit" | "delete") => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  /**
   * Closes the modal and clears the selected user.
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  /**
   * Updates an existing user's information via API call.
   * Optimistically updates the local state.
   *
   * @param userId - ID of the user to update
   * @param updates - Partial user object containing fields to update
   */
  const handleUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to update user: ${response.status}`);
      }

      // Optimistic update
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, ...updates } : user,
        ),
      );
      closeModal();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Deletes a user from the system via API call.
   * Optimistically removes the user from local state.
   *
   * @param userId - ID of the user to delete
   */
  const handleDelete = async (userId: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      // Optimistic removal
      setUsers(users.filter((user) => user._id !== userId));
      closeModal();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Toggles a user's active status (active ↔ inactive).
   * Optimistically updates the UI and reverts on failure.
   *
   * @param userId - ID of the user to toggle
   */
  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find((u) => u._id === userId);
      if (!user) return;

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          ...user,
          isActive: !user.isActive,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to update user: ${response.status}`);
      }

      // Optimistic toggle
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isActive: !user.isActive } : user,
        ),
      );
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  // --------------------------------------------------------------------------
  // Conditional Rendering (Early Returns)
  // --------------------------------------------------------------------------

  /** Loading state for initial authentication check */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  /** Access denied for non‑admin users */
  if (!authLoading && currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You must be an administrator to access this page.
          </p>
        </div>
      </div>
    );
  }

  /** Loading state for initial data fetch */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white p-4 md:p-6 mt-18">
      <div className="max-w-7xl mx-auto">
        {/* ========================================================================
            HEADER SECTION
        ======================================================================== */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">Manage all users in your system</p>
            </div>
          </div>
        </div>

        {/* ========================================================================
            ERROR DISPLAY
        ======================================================================== */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-800 hover:text-red-900"
            >
              &times;
            </button>
          </div>
        )}

        {/* ========================================================================
            STATISTICS CARDS
        ======================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <UserCheck className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Inactive Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Users
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <UserX className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.admins}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Shield className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================
            FILTERS & SEARCH
        ======================================================================== */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Role Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="chef">Chef</option>
                  <option value="waiter">Waiter</option>
                  <option value="cashier">Cashier</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================
            USERS TABLE
        ======================================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* User Info (Avatar + Name + Email) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(
                            user.role,
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {user.phone || "N/A"}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              user.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                user.isActive
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`ml-2 text-xs font-medium ${
                              user.isActive ? "text-green-600" : "text-gray-500"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal(user, "view")}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="View user"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openModal(user, "edit")}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Edit user"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => openModal(user, "delete")}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Empty State
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="mt-1">
                          {searchTerm ||
                          roleFilter !== "all" ||
                          statusFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "No users in the system"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================================
              PAGINATION
          ======================================================================== */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} results
                </div>
                <div className="flex items-center space-x-2">
                  {/* Previous Page */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page Numbers with Ellipsis */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1),
                    )
                    .map((page, index, array) => {
                      const showEllipsis =
                        index > 0 && page - array[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  {/* Next Page */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================
          MODAL (View / Edit / Delete)
      ======================================================================== */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* View Mode */}
            {modalType === "view" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  User Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Role
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedUser.role}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <p className="text-gray-900">
                      {selectedUser.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <p
                      className={`font-medium ${
                        selectedUser.isActive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Created At
                    </label>
                    <p className="text-gray-900">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {modalType === "edit" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit User
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editRole}
                      onChange={(e) =>
                        setEditRole(e.target.value as User["role"])
                      }
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="chef">Chef</option>
                      <option value="waiter">Waiter</option>
                      <option value="cashier">Cashier</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="mt-6 flex space-x-3 justify-end">
                  <button
                    onClick={closeModal}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdate(selectedUser._id, {
                        name: editName,
                        role: editRole,
                        phone: editPhone,
                      })
                    }
                    disabled={processing}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? (
                      <Loader className="animate-spin mr-2" size={16} />
                    ) : (
                      <Save className="mr-2" size={16} />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Delete Mode */}
            {modalType === "delete" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Delete User
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete{" "}
                  <strong>{selectedUser.name}</strong>? This action cannot be
                  undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDelete(selectedUser._id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? (
                      <Loader className="animate-spin mr-2" size={16} />
                    ) : null}
                    Delete
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDashboard;
