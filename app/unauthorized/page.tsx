"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full text-center bg-white border rounded-2xl shadow-sm p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
          ⛔
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-2 text-gray-600">
          {user
            ? `Your role (${user.role}) does not have permission to view this page.`
            : "You need to sign in to view this page."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go home
          </Link>
          {user && (
            <button
              onClick={logout}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
