"use client";

// ============================================================================
// Third-Party Libraries
// ============================================================================
import React, { useState, useEffect } from "react";
import axios from "axios";

// ============================================================================
// Application Contexts and Types
// ============================================================================
import { useAuth, User } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

// ============================================================================
// Type Definitions (Internal)
// ============================================================================

/** Form state for editable user profile fields. */
interface EditProfileForm {
  name: string;
  email: string;
  phone: string;
}

/** Status message displayed after profile update attempt. */
interface UpdateStatus {
  type: "success" | "error" | "";
  message: string;
}

/** Structure of error response from Axios. */
interface AxiosErrorWithResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ============================================================================
// UserProfile Component
// ============================================================================

/**
 * UserProfile – Displays and allows editing of the authenticated user's profile.
 * - Shows user details, role, account status, and member since date.
 * - Supports real-time profile and online status updates via Socket.IO.
 * - Falls back to polling when socket connection is unavailable.
 * - Includes an edit mode for modifying name, email, and phone.
 *
 * @component
 * @returns {JSX.Element} The rendered user profile page.
 */
const UserProfile: React.FC = () => {
  // --------------------------------------------------------------------------
  // Hooks & Context
  // --------------------------------------------------------------------------
  const { user, token, updateUser } = useAuth();
  const { socket, isConnected } = useSocket();

  // --------------------------------------------------------------------------
  // Local State
  // --------------------------------------------------------------------------
  /** Controls whether the form is in edit mode. */
  const [isEditing, setIsEditing] = useState<boolean>(false);

  /** Form data for editable fields, initialised from the current user. */
  const [editData, setEditData] = useState<EditProfileForm>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  /** Status message for update feedback (success/error). */
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    type: "",
    message: "",
  });

  /** Current online status of the user (real-time if socket connected). */
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // Effects – Data Synchronisation
  // --------------------------------------------------------------------------

  /**
   * Sync local edit form state with the user object when it changes.
   * Also initialises the online status from user.isActive.
   */
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
      setIsOnline(user.isActive);
    }
  }, [user]);

  /**
   * Socket.IO real-time event listeners.
   * - Joins a private room for this user.
   * - Listens for status and profile updates broadcasted from the server.
   * - Emits online status on mount and offline on unmount.
   */
  useEffect(() => {
    if (!socket || !user) return;

    // ----- Event Handlers -----
    const handleUserStatusUpdate = (updatedUser: User) => {
      if (updatedUser._id === user._id) {
        updateUser(updatedUser);
        setIsOnline(updatedUser.isActive);
        console.log("User status updated via socket:", updatedUser.isActive);
      }
    };

    const handleUserProfileUpdate = (updatedUser: User) => {
      if (updatedUser._id === user._id) {
        updateUser(updatedUser);
        console.log("User profile updated via socket");
      }
    };

    // ----- Join user-specific room -----
    socket.emit("join_user_room", user._id);

    // ----- Register listeners -----
    socket.on("user_status_updated", handleUserStatusUpdate);
    socket.on("user_profile_updated", handleUserProfileUpdate);
    socket.on("user_online", (userId: string) => {
      if (userId === user._id) {
        setIsOnline(true);
        updateUser({ ...user, isActive: true });
      }
    });
    socket.on("user_offline", (userId: string) => {
      if (userId === user._id) {
        setIsOnline(false);
        updateUser({ ...user, isActive: false });
      }
    });

    // ----- Announce online status -----
    socket.emit("user_online", user._id);

    // ----- Cleanup on unmount -----
    return () => {
      socket.off("user_status_updated", handleUserStatusUpdate);
      socket.off("user_profile_updated", handleUserProfileUpdate);
      socket.off("user_online");
      socket.off("user_offline");
      socket.emit("user_offline", user._id);
    };
  }, [socket, user, updateUser]);

  /**
   * Fallback polling mechanism.
   * Only active when socket is **not** connected.
   * Fetches the latest user data every 30 seconds.
   */
  useEffect(() => {
    if (!user || isConnected) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          updateUser(response.data.user);
          setIsOnline(response.data.user.isActive);
        }
      } catch (error) {
        console.log("Polling for updates failed:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, token, updateUser, isConnected]);

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  /**
   * Updates the local edit form state when input fields change.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Submits the updated profile data to the API.
   * On success: updates the global user context, emits a socket event,
   * shows a success message, and exits edit mode.
   * On failure: shows an error message.
   */
  const handleSave = async () => {
    try {
      const response = await axios.put(`/api/users/${user?._id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        updateUser(response.data.user);
        setUpdateStatus({
          type: "success",
          message: "Profile updated successfully!",
        });

        // Notify other clients about the profile update
        if (socket) {
          socket.emit("user_profile_update", response.data.user);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorWithResponse;
      setUpdateStatus({
        type: "error",
        message:
          axiosError.response?.data?.message || "Failed to update profile",
      });
    }

    // Clear status message after 3 seconds
    setTimeout(() => setUpdateStatus({ type: "", message: "" }), 3000);
    setIsEditing(false);
  };

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  /**
   * Returns Tailwind CSS background and text color classes based on user role.
   * @param {string} role - The user's role (admin, manager, chef, waiter, cashier, etc.).
   * @returns {string} Space‑separated CSS classes.
   */
  const getRoleColor = (role: string): string => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "chef":
        return "bg-orange-100 text-orange-800";
      case "waiter":
        return "bg-blue-100 text-blue-800";
      case "cashier":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // --------------------------------------------------------------------------
  // Conditional Rendering (No User)
  // --------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please log in to view your profile</div>
      </div>
    );
  }

  // Use real-time online status if available, otherwise fallback to user.isActive
  const displayStatus = isOnline;

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* -------------------- Connection Status Indicator -------------------- */}
        <div className="mb-4 flex items-center justify-end">
          <div
            className={`flex items-center text-sm ${
              isConnected ? "text-green-600" : "text-yellow-600"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
            {isConnected ? "Real-time connected" : "Using fallback updates"}
          </div>
        </div>

        {/* -------------------- Main Profile Card -------------------- */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-black p-8 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 flex items-center">
                  <div
                    className={`h-6 w-6 rounded-full border-2 border-white ${
                      displayStatus ? "bg-green-500" : "bg-gray-500"
                    }`}
                  ></div>
                  {!isConnected && (
                    <div className="ml-1 text-xs bg-yellow-500 text-white px-1 rounded">
                      Offline
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-6 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      className="text-3xl font-bold bg-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                  )}
                  <span
                    className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      user.role,
                    )}`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 opacity-90">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {/* Update Status Banner */}
            {updateStatus.type && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  updateStatus.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {updateStatus.message}
              </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {user.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add phone number"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {user.phone || "Not provided"}
                  </p>
                )}
              </div>

              {/* User ID (read‑only) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  User ID
                </label>
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-mono">
                  {user._id}
                </p>
              </div>

              {/* Online Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Status
                </label>
                <div className="flex items-center">
                  <span
                    className={`px-4 py-2 rounded-lg ${
                      displayStatus
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {displayStatus ? "Active" : "Inactive"}
                    {!isConnected && " (Offline)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* -------------------- Additional Info Card -------------------- */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">User Role</h3>
              <p className="mt-1 text-lg font-semibold capitalize">
                {user.role}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">
                Last Updated
              </h3>
              <p className="mt-1 text-lg font-semibold">
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">
                Connection Status
              </h3>
              <p className="mt-1 text-lg font-semibold">
                {isConnected ? "Real-time" : "Polling"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
