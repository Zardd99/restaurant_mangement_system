/**
 * =============================================================================
 * CUSTOM HOOK: useRegisterForm
 * =============================================================================
 *
 * Manages the registration form state, validation, and submission.
 * Integrates with `react-hook-form` for form handling and `useAuth` for
 * authentication. Redirects the user upon successful registration.
 *
 * ✅ Responsibilities:
 *   - Provide form registration methods and validation errors.
 *   - Handle form submission and authentication.
 *   - Display submission errors.
 *
 * 🚫 Does NOT:
 *   - Render any UI – only provides logic and state.
 *
 * @module useRegisterForm
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Form data structure for user registration.
 */
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// -----------------------------------------------------------------------------
// HOOK DEFINITION
// -----------------------------------------------------------------------------

/**
 * useRegisterForm
 * ---------------
 * Provides state and handlers for the registration form.
 *
 * @returns {Object} An object containing:
 *   - error:        Global form submission error message.
 *   - errors:       Field‑specific validation errors from react‑hook‑form.
 *   - isLoading:    Authentication loading state (from useAuth).
 *   - register:     react‑hook‑form register function for input binding.
 *   - handleSubmit: Pre‑configured submit handler (call with form data).
 *   - password:     Current password field value (for confirmation validation).
 */
const useRegisterForm = () => {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  const [error, setError] = useState<string>("");

  // -------------------------------------------------------------------------
  // CONTEXT & ROUTER
  // -------------------------------------------------------------------------
  const { register: registerUser, isLoading } = useAuth();
  const router = useRouter();

  // -------------------------------------------------------------------------
  // FORM HOOKS
  // -------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  // Watch password field to validate confirmPassword against it
  const password = watch("password");

  // -------------------------------------------------------------------------
  // SUBMIT HANDLER
  // -------------------------------------------------------------------------
  /**
   * Handles the form submission.
   * Calls the `registerUser` method from AuthContext and redirects
   * to the main user interface on success.
   *
   * @param data - Validated form data.
   */
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(""); // Clear any previous errors
      const { confirmPassword, ...userData } = data; // Omit confirmPassword
      await registerUser(userData);
      router.push("/user_interface");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    }
  };

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    error,
    errors,
    isLoading,
    register,
    handleSubmit: handleSubmit(onSubmit), // Pre‑bound submit handler
    password,
  };
};

export default useRegisterForm;
