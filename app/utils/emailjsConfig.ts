// ============================================================================
// EmailJS Configuration Utilities
// ============================================================================
//
// This module provides utility functions for validating and inspecting the
// EmailJS configuration used for sending inventory notification emails.
//
// It is designed to be used both during development (for debugging) and
// in production (to verify that required environment variables are set).
//
// ============================================================================

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Represents the result of an EmailJS configuration check.
 */
interface EmailJSConfigCheck {
  /** EmailJS service ID (or undefined if not set). */
  serviceId: string | undefined;
  /** EmailJS template ID (or undefined if not set). */
  templateId: string | undefined;
  /** EmailJS public key (or undefined if not set). */
  publicKey: string | undefined;
  /** Inventory manager's email address (or undefined if not set). */
  managerEmail: string | undefined;
  /** Whether all required variables are present and non‑empty. */
  isConfigured: boolean;
}

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Checks the current EmailJS configuration by reading environment variables.
 *
 * - Reads `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`,
 *   `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`, and `NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL`.
 * - Determines if all required variables are set.
 * - In development mode, logs a detailed status table to the console.
 *
 * @returns {EmailJSConfigCheck} An object containing the raw values and a
 *          boolean flag indicating whether the configuration is complete.
 */
export const checkEmailJSConfig = (): EmailJSConfigCheck => {
  const config = {
    serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    managerEmail: process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL,
    isConfigured: false,
  };

  config.isConfigured = !!(
    config.serviceId &&
    config.templateId &&
    config.publicKey &&
    config.managerEmail
  );

  // In development mode, log a human‑readable status summary
  if (process.env.NODE_ENV === "development") {
    console.log("EmailJS Configuration:", {
      serviceId: config.serviceId ? "✓" : "✗",
      templateId: config.templateId ? "✓" : "✗",
      publicKey: config.publicKey
        ? `✓ (first 10 chars: ${config.publicKey.substring(0, 10)}...)`
        : "✗",
      managerEmail: config.managerEmail ? "✓" : "✗",
      isConfigured: config.isConfigured ? "✓ READY" : "✗ NOT CONFIGURED",
    });
  }

  return config;
};

/**
 * Returns a list of all environment variables required by EmailJS,
 * along with their current values (masked for sensitive keys).
 *
 * Useful for displaying configuration status in a UI or for debugging.
 *
 * @returns {Array<{ name: string; value: string | null }>} An array of
 *          variable descriptors. For `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`, the
 *          value is always `"Set (hidden)"` if present, otherwise `null`.
 *          For other variables, the actual value is returned if set,
 *          otherwise `null`.
 */
export const getRequiredEnvVars = () => [
  {
    name: "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
    value: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  },
  {
    name: "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
    value: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  },
  {
    name: "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
    value: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? "Set (hidden)" : null,
  },
  {
    name: "NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL",
    value: process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL,
  },
];
