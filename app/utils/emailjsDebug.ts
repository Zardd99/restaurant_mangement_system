export const validateEmailJSTemplate = async (): Promise<{
  isValid: boolean;
  errors: string[];
  testResult?: any;
}> => {
  const errors: string[] = [];

  // Check environment variables
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

  // Check if EmailJS is available
  if (typeof window === "undefined") {
    errors.push("EmailJS can only run in browser environment");
  }

  // Check if EmailJS library is loaded
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

// Add to emailjsDebug.ts
export const validateTemplateVariables = async (
  templateId: string,
  serviceId: string,
  publicKey: string,
): Promise<{ isValid: boolean; missing: string[] }> => {
  try {
    // This would require EmailJS API calls to fetch template details
    // Since EmailJS doesn't provide this directly, we can only validate locally

    console.warn("EmailJS doesn't provide template validation API");
    return { isValid: true, missing: [] };
  } catch (error) {
    console.error("Template validation failed:", error);
    return { isValid: false, missing: [] };
  }
};

// Usage in your component:
const validateAndSend = async () => {
  const config = getEmailJSConfig();
  console.log("Template expects:", {
    // List expected variables from your template
    expected: [
      "to_name",
      "to_email",
      "total_alerts",
      "critical_count",
      "low_count",
      "alert_date",
      "alert_time",
      "dashboard_url",
      "has_critical_alerts",
      "has_low_alerts",
      "critical_items",
      "low_items",
    ],
    config: config,
  });
};
