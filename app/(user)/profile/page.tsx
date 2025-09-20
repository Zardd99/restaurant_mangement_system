"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const UserProfile: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [updateStatus, setUpdateStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Simple polling to check for user updates
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          updateUser(response.data.user);
        }
      } catch (error) {
        console.log("Polling for updates failed:", error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, token, updateUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

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
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setUpdateStatus({
        type: "error",
        message:
          axiosError.response?.data?.message || "Failed to update profile",
      });
    }
    setTimeout(() => setUpdateStatus({ type: "", message: "" }), 3000);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please log in to view your profile</div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.isActive ? (
                  <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-2 border-white"></div>
                ) : (
                  <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-gray-500 border-2 border-white"></div>
                )}
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
                      user.role
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

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  User ID
                </label>
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-mono">
                  {user._id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Status
                </label>
                <div className="flex items-center">
                  <span
                    className={`px-4 py-2 rounded-lg ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

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

        {/* Additional Info Card */}
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
                Account Status
              </h3>
              <p className="mt-1 text-lg font-semibold">
                {user.isActive ? "Verified" : "Pending"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
