"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

/**
 * Global 404 boundary.
 *
 * Rendered as a fixed, full-viewport overlay (`z-[100]`, above the sidebar at
 * `z-60`) so a dead route reads as a standalone page rather than content nested
 * inside the authenticated dashboard shell. The real-time socket never opens
 * here for unauthenticated visitors — it is gated on a resolved token/role in
 * `SocketContext` — so a mistyped URL from a logged-out client spins up no
 * websocket connection.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-neutral-950 px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-bold tracking-tight text-indigo-500">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/15 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
