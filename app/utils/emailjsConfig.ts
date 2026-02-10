export const checkEmailJSConfig = () => {
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

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log("EmailJS Configuration:", {
      serviceId: config.serviceId ? "✓" : "✗",
      templateId: config.templateId ? "✓" : "✗",
      publicKey: config.publicKey
        ? "✓ (first 10 chars: " + config.publicKey.substring(0, 10) + "...)"
        : "✗",
      managerEmail: config.managerEmail ? "✓" : "✗",
      isConfigured: config.isConfigured ? "✓ READY" : "✗ NOT CONFIGURED",
    });
  }

  return config;
};

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
