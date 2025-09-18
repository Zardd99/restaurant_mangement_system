"use client";

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

/**
 * TypeScript interface for User object structure
 * Matches the backend User model from MongoDB
 */
interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "chef" | "waiter" | "cashier" | "customer";
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for displaying user statistics in dashboard cards
 */
interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
}

/**
 * AdminUserDashboard Component
 *
 * A comprehensive admin dashboard for managing users in the system.
 * Features include:
 * - Real-time user data fetching from REST API
 * - Advanced search and filtering capabilities
 * - Role-based access control
 * - CRUD operations (Create, Read, Update, Delete)
 * - Responsive design with mobile support
 * - Professional UI with loading states and error handling
 *
 * @returns React functional component
 */
const AdminUserDashboard = () => {
  // Authentication context - provides JWT token and logout functionality
  const {
    token,
    logout,
    isLoading: authLoading,
    user: currentUser,
  } = useAuth();
  const router = useRouter();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Core data states
  const [users, setUsers] = useState<User[]>([]); // All users from API
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // Users after filtering

  // UI states
  const [loading, setLoading] = useState(true); // Initial data loading
  const [error, setError] = useState<string | null>(null); // Error messages
  const [processing, setProcessing] = useState(false); // Processing operations

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(""); // Search input value
  const [roleFilter, setRoleFilter] = useState("all"); // Role filter dropdown
  const [statusFilter, setStatusFilter] = useState("all"); // Status filter dropdown

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current page number

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // User for modal operations
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [modalType, setModalType] = useState<"view" | "edit" | "delete">(
    "view"
  ); // Modal operation type

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<User["role"]>("customer");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    if (!authLoading && currentUser?.role !== "admin") {
      // Redirect non-admin users
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  // ============================================================================
  // CONFIGURATION CONSTANTS
  // ============================================================================

  // API base URL - uses environment variable with fallback for development
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Pagination configuration
  const usersPerPage = 10;

  // ============================================================================
  // API INTEGRATION FUNCTIONS
  // ============================================================================

  /**
   * Fetches all users from the backend API
   * Handles authentication, error states, and data validation
   * Updates both users and filteredUsers state
   */

  // ============================================================================
  // LIFECYCLE EFFECTS
  // ============================================================================

  /**
   * Effect: Initial data fetch
   * Triggers when component mounts or token changes
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate authentication token
        if (!token || authLoading) return;

        // Make authenticated API request
        const response = await fetch(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`, // JWT authentication
            "Content-Type": "application/json",
          },
        });

        // Handle HTTP error responses
        if (!response.ok) {
          if (response.status === 401) {
            logout(); // Clear invalid/expired token
            throw new Error("Session expired. Please log in again.");
          } else if (response.status === 403) {
            throw new Error(
              "You don't have permission to access this resource."
            );
          } else {
            throw new Error(`Failed to fetch users: ${response.status}`);
          }
        }

        // Parse and validate response data
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
   * Effect: Real-time filtering
   * Filters users based on search term, role, and status
   * Resets pagination to page 1 when filters change
   */
  useEffect(() => {
    const filtered = users.filter((user) => {
      // Text search - matches name or email (case-insensitive)
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Reset edit form when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditRole(selectedUser.role);
      setEditPhone(selectedUser.phone || "");
    }
  }, [selectedUser]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Calculate user statistics for dashboard cards
   * Computed from the full users array (not filtered)
   */
  const stats: UserStats = {
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
    admins: users.filter((user) => user.role === "admin").length,
  };

  /**
   * Pagination calculations
   */
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex); // Users for current page

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Returns CSS classes for role badges based on user role
   * Provides consistent color coding across the application
   *
   * @param role - User role string
   * @returns CSS class string for styling
   */
  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800 border-red-200",
      manager: "bg-purple-100 text-purple-800 border-purple-200",
      chef: "bg-orange-100 text-orange-800 border-orange-200",
      waiter: "bg-blue-100 text-blue-800 border-blue-200",
      cashier: "bg-green-100 text-green-800 border-green-200",
      customer: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[role as keyof typeof colors] || colors.customer;
  };

  /**
   * Formats ISO date string to human-readable format
   *
   * @param dateString - ISO date string from API
   * @returns Formatted date string (e.g., "Jan 15, 2024")
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ============================================================================
  // MODAL MANAGEMENT
  // ============================================================================

  /**
   * Opens modal with specific user and operation type
   *
   * @param user - User object to operate on
   * @param type - Type of operation (view, edit, delete)
   */
  const openModal = (user: User, type: "view" | "edit" | "delete") => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  /**
   * Closes modal and resets modal state
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // ============================================================================
  // API OPERATIONS (CRUD)
  // ============================================================================

  /**
   * Handles user update via API call
   * Updates local state on success to avoid unnecessary refetch
   *
   * @param userId - ID of user to update
   * @param updates - Object with updated user fields
   */
  const handleUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      setProcessing(true); // Show loading state in modal

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to update user: ${response.status}`);
      }

      // Optimistic UI update - update user in local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, ...updates } : user
        )
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
   * Handles user deletion via API call
   * Updates local state on success to avoid unnecessary refetch
   *
   * @param userId - ID of user to delete
   */
  const handleDelete = async (userId: string) => {
    try {
      setProcessing(true); // Show loading state in modal

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      // Optimistic UI update - remove user from local state
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
   * Toggles user active/inactive status via API
   * Optimistically updates UI before API confirmation
   *
   * @param userId - ID of user to toggle
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
        },
        body: JSON.stringify({
          ...user,
          isActive: !user.isActive, // Toggle the current status
        }),
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to update user: ${response.status}`);
      }

      // Optimistic UI update - toggle user status in local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isActive: !user.isActive } : user
        )
      );
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================

  /**
   * Loading state - displayed while initial data is being fetched
   */
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

  // ============================================================================
  // MAIN COMPONENT RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 mt-18">
      <div className="max-w-7xl mx-auto">
        {/* ========================================================================
            HEADER SECTION
            Contains page title, description, and primary action button
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
            ERROR NOTIFICATION
            Displays error messages with dismiss functionality
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
            Four cards showing key metrics: total, active, inactive, admins
        ======================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users Card */}
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

          {/* Active Users Card */}
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

          {/* Inactive Users Card */}
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

          {/* Admins Card */}
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
            FILTERS AND SEARCH SECTION
            Search input and filter dropdowns for users
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
            Main data table with user information and actions
        ======================================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
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

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100">
                {currentUsers.length > 0 ? (
                  // Render user rows
                  currentUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* User Info Column (Avatar, Name, Email) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {/* User Avatar - Generated from first letter of name */}
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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

                      {/* Role Badge Column */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Phone Column */}
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {user.phone || "N/A"}
                      </td>

                      {/* Status Toggle Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {/* Toggle Switch for Active/Inactive Status */}
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

                      {/* Created Date Column */}
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Action Buttons Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {/* View User Button */}
                          <button
                            onClick={() => openModal(user, "view")}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="View user"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => openModal(user, "edit")}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Edit user"
                          >
                            <Edit3 size={16} />
                          </button>

                          {/* Delete User Button */}
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
                  // Empty State - No users found
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
              Displays only when there are multiple pages
          ======================================================================== */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results Info */}
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} results
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-2">
                  {/* Previous Page Button */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page Numbers with Ellipsis Logic */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => {
                      // Add ellipsis for gaps in pagination
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

                  {/* Next Page Button */}
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
          MODAL COMPONENT
          Handles view, edit, and delete operations
      ======================================================================== */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* ====================================================================
                VIEW USER MODAL
                Displays detailed user information in read-only format
            ==================================================================== */}
            {modalType === "view" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  User Details
                </h3>
                <div className="space-y-3">
                  {/* User Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="text-gray-900">{selectedUser.name}</p>
                  </div>

                  {/* User Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>

                  {/* User Role */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Role
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedUser.role}
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <p className="text-gray-900">
                      {selectedUser.phone || "N/A"}
                    </p>
                  </div>

                  {/* Account Status */}
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

                  {/* Account Creation Date */}
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

            {/* ====================================================================
                EDIT USER MODAL
                Form for editing user details
            ==================================================================== */}
            {modalType === "edit" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit User
                </h3>
                <div className="space-y-4">
                  {/* Name Input */}
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

                  {/* Role Select */}
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

                  {/* Phone Input */}
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

                {/* Action Buttons */}
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

            {/* ====================================================================
                DELETE USER MODAL
                Confirmation dialog for user deletion with warning message
            ==================================================================== */}
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

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {/* Delete Confirmation Button */}
                  <button
                    onClick={() => handleDelete(selectedUser._id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                  >
                    {/* Show loading spinner when processing */}
                    {processing ? (
                      <Loader className="animate-spin mr-2" size={16} />
                    ) : null}
                    Delete
                  </button>

                  {/* Cancel Button */}
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
