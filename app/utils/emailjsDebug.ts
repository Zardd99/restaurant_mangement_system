/**
 * @module EmailJS Validation Utilities
 * @description Provides validation and configuration utilities for EmailJS integration.
 * These functions help verify that the required environment variables are set,
 * that the EmailJS library is available, and that the templates are properly configured.
 *
 * This module is used primarily in development and debugging to ensure email
 * notifications (low stock alerts, reorder confirmations) are correctly set up.
 */

// ============================================================================
// Function: validateEmailJSTemplate
// ============================================================================

/**
 * Validates the EmailJS configuration and browser environment.
 * Checks for:
 * - Presence of all required environment variables.
 * - Browser environment (EmailJS only works client‑side).
 * - Successful loading of the EmailJS library.
 *
 * @async
 * @returns {Promise<{ isValid: boolean; errors: string[]; testResult?: any }>}
 *          - `isValid`: `true` if no errors were found.
 *          - `errors`: Array of descriptive error messages.
 *          - `testResult`: (Optional) Placeholder for future template validation results.
 *
 * @example
 * const { isValid, errors } = await validateEmailJSTemplate();
 * if (!isValid) {
 *   console.error('EmailJS misconfigured:', errors);
 * }
 */
export const validateEmailJSTemplate = async (): Promise<{
  isValid: boolean;
  errors: string[];
  testResult?: any;
}> => {
  const errors: string[] = [];

  // --------------------------------------------------------------------------
  // 1. Verify that all required environment variables are defined.
  // --------------------------------------------------------------------------
  const requiredEnvVars = [
    "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
    "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
    "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
    "NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL",
  ];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`Missing environment variable: ${varName}`);
    }
  });

  // --------------------------------------------------------------------------
  // 2. Ensure the code is running in a browser (EmailJS requires window).
  // --------------------------------------------------------------------------
  if (typeof window === "undefined") {
    errors.push("EmailJS can only run in browser environment");
  }

  // --------------------------------------------------------------------------
  // 3. Attempt to load the EmailJS library.
  // --------------------------------------------------------------------------
  try {
    const emailjs = await import("@emailjs/browser");
    if (!emailjs.default) {
      errors.push("EmailJS library not properly loaded");
    }
  } catch (error) {
    errors.push(`Failed to load EmailJS: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Function: getEmailJSConfig
// ============================================================================

/**
 * Retrieves the current EmailJS configuration from environment variables.
 * Sensitive values (public key) are partially obfuscated for logging safety.
 *
 * @returns {Object} Configuration object containing:
 *   - `serviceId`    – EmailJS service ID (or "NOT_SET").
 *   - `templateId`   – EmailJS template ID (or "NOT_SET").
 *   - `publicKey`    – EmailJS public key (truncated, or "NOT_SET").
 *   - `managerEmail` – Inventory manager’s email address (or "NOT_SET").
 *   - `isConfigured` – Boolean indicating if all four variables are present.
 *
 * @example
 * const config = getEmailJSConfig();
 * if (!config.isConfigured) {
 *   console.warn('EmailJS not fully configured', config);
 * }
 */
export const getEmailJSConfig = () => ({
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "NOT_SET",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "NOT_SET",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    ? `${process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY.substring(0, 10)}...`
    : "NOT_SET",
  managerEmail: process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL || "NOT_SET",
  isConfigured: Boolean(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY &&
    process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL,
  ),
});

// ============================================================================
// Function: validateTemplateVariables
// ============================================================================

/**
 * Validates that the expected template variables exist in the EmailJS template.
 *
 * @remarks
 * **Important:** EmailJS does **not** provide a public API to fetch template details.
 * Therefore, this function cannot perform a true server‑side validation.
 * It currently logs a warning and returns a dummy success response.
 * It is kept for API consistency and future extension.
 *
 * @param templateId - The EmailJS template ID (unused).
 * @param serviceId  - The EmailJS service ID (unused).
 * @param publicKey  - The EmailJS public key (unused).
 * @returns A promise that resolves to:
 *   - `isValid`: Always `true` (placeholder).
 *   - `missing`: Always an empty array (placeholder).
 */
export const validateTemplateVariables = async (
  templateId: string,
  serviceId: string,
  publicKey: string,
): Promise<{ isValid: boolean; missing: string[] }> => {
  try {
    // EmailJS does not expose template variables via client SDK.
    // This function is a placeholder; real validation would require a backend call.
    console.warn("EmailJS doesn't provide template validation API");
    return { isValid: true, missing: [] };
  } catch (error) {
    console.error("Template validation failed:", error);
    return { isValid: false, missing: [] };
  }
};

// ============================================================================
// Usage Example (for debugging / development)
// ============================================================================

/**
 * Example: Validate configuration and log expected template variables.
 *
 * @remarks
 * This block is **not exported** and serves as a developer reference.
 * It demonstrates how to retrieve the configuration and the list of
 * variables that the EmailJS template should contain.
 *
 * @example
 * Call this function from a component or during development setup:
 * const validateAndSend = async () => {
 *   const config = getEmailJSConfig();
 *   console.log("Template expects:", {
 *     expected: [
 *       "to_name",
 *       "to_email",
 *       "total_alerts",
 *       "critical_count",
 *       "low_count",
 *       "alert_date",
 *       "alert_time",
 *       "dashboard_url",
 *       "has_critical_alerts",
 *       "has_low_alerts",
 *       "critical_items",
 *       "low_items",
 *     ],
 *     config: config,
 *   });
 * };
 */
