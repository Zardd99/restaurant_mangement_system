"use client";

// ─────────────────────────────────────────────────────────────────────────────
// React & Next.js
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Third-party libraries
// ─────────────────────────────────────────────────────────────────────────────
import { useForm } from "react-hook-form";

// ─────────────────────────────────────────────────────────────────────────────
// Application context
// ─────────────────────────────────────────────────────────────────────────────
import { useAuth } from "../../contexts/AuthContext";

/**
 * Login form data interface
 * @property {string} email    - User's email address
 * @property {string} password - User's password
 */
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * LoginPage Component
 *
 * Renders the authentication login form with email/password validation,
 * error handling, and loading state. Uses react-hook-form for validation
 * and AuthContext for actual authentication logic.
 *
 * @component
 * @returns {JSX.Element} The rendered login page
 */
const LoginPage = () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Local state
  // ───────────────────────────────────────────────────────────────────────────
  const [error, setError] = useState<string>("");

  // ───────────────────────────────────────────────────────────────────────────
  // Hooks
  // ───────────────────────────────────────────────────────────────────────────
  const { login, isLoading } = useAuth(); // Authentication methods & loading flag
  const router = useRouter(); // Next.js navigation

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // ───────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ───────────────────────────────────────────────────────────────────────────
  /**
   * Form submission handler
   * Calls the login function from AuthContext and redirects on success.
   * Captures and displays authentication errors.
   *
   * @param {LoginFormData} data - The validated form data
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(""); // Clear previous errors
      await login(data.email, data.password);
      router.push("/user_interface"); // Redirect after successful login
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    }
  };

  return (
    // ─────────────────────────────────────────────────────────────────────────
    // Main container – full screen, centered
    // Classes: layout → sizing → spacing → background
    // ─────────────────────────────────────────────────────────────────────────
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {/* Login card – width constrained, white card with shadow */}
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Welcome Back!
          </h2>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            Form – submit handler attached
            ─────────────────────────────────────────────────────────────────── */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Global error message display */}
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form fields container */}
          <div className="space-y-4">
            {/* Email field */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                placeholder="Enter your email"
                // Classes: layout → sizing → borders → spacing → typography → focus states
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
              />
              {/* Inline validation error */}
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register("password", {
                  required: "Password is required",
                })}
                type="password"
                placeholder="Enter your password"
                // Classes: layout → sizing → borders → spacing → typography → focus states
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
              />
              {/* Inline validation error */}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Forgot password link */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit button with loading state */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              // Classes: layout → sizing → borders → spacing → typography → colors → interactive states
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </div>

          {/* Social login placeholders (visual only, no functionality) */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Or continue with</p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"
              >
                <span className="sr-only">Google</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"
              >
                <span className="sr-only">Facebook</span>
              </button>
            </div>
          </div>

          {/* Link to registration page */}
          <div className="text-center">
            <Link
              href="/register"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Don&apos;t have an account? Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
