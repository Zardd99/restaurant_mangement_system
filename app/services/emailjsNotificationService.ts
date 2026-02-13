// ============================================================================
// Third-Party Libraries
// ============================================================================
import emailjs from "@emailjs/browser";

// ============================================================================
// Types & Interfaces – Email Notifications
// ============================================================================

/**
 * Represents a low‑stock alert for a single ingredient.
 * Used to populate both email templates and internal alerting logic.
 */
export interface LowStockAlert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  reorderPoint: number;
  costPerUnit: number;
}

/**
 * Configuration object required to initialise and use EmailJS.
 * All values should be obtained from environment variables.
 */
export interface EmailJSConfig {
  /** EmailJS service ID (from the EmailJS dashboard). */
  serviceId: string;
  /** EmailJS template ID (e.g., "low_stock_alert"). */
  templateId: string;
  /** EmailJS public key (used to initialise the client). */
  publicKey: string;
  /** Email address of the inventory manager (recipient). */
  managerEmail: string;
  /** Optional display name for the recipient. */
  managerName?: string;
  /** Optional URL to the inventory dashboard (included in alerts). */
  dashboardUrl?: string;
}

// ============================================================================
// EmailJS Notification Service
// ============================================================================

/**
 * EmailJSNotificationService – Handles sending email notifications for
 * inventory events (low stock alerts, reorder confirmations, test emails).
 *
 * - Encapsulates all EmailJS configuration and initialisation.
 * - Provides methods to send low‑stock summaries, test messages, and reorder confirmations.
 * - Gracefully degrades on server‑side (returns mock) or when configuration is incomplete.
 *
 * @class
 */
export class EmailJSNotificationService {
  private config: EmailJSConfig;
  private isInitialized: boolean = false;

  /**
   * Creates an instance of EmailJSNotificationService.
   * Automatically calls `initialize()` to set up the EmailJS client.
   * @param config - Validated EmailJS configuration object.
   */
  constructor(config: EmailJSConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialises the EmailJS client with the public key.
   * Only runs on the client side (window defined).
   */
  private initialize(): void {
    if (typeof window !== "undefined" && this.config.publicKey) {
      emailjs.init(this.config.publicKey);
      this.isInitialized = true;
    }
  }

  // --------------------------------------------------------------------------
  // Public API – Email Sending
  // --------------------------------------------------------------------------

  /**
   * Sends a low‑stock alert email to the inventory manager.
   * Alerts are grouped into two categories: critical (at or below reorder point)
   * and low (above reorder point but at or below minimum stock).
   *
   * @param alerts - Array of low‑stock alerts to include in the email.
   * @returns Promise<boolean> – True if the email was sent successfully, false otherwise.
   */
  async sendLowStockAlert(alerts: LowStockAlert[]): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn("EmailJS not initialized");
      return false;
    }

    if (alerts.length === 0) {
      return true;
    }

    // Group alerts by severity
    const criticalAlerts = alerts.filter(
      (alert) => alert.currentStock <= alert.reorderPoint,
    );
    const lowAlerts = alerts.filter(
      (alert) =>
        alert.currentStock > alert.reorderPoint &&
        alert.currentStock <= alert.minStock,
    );

    // Format bullet lists for the email body
    const formatCriticalList = criticalAlerts
      .map(
        (alert, idx) =>
          `${idx + 1}. ${alert.ingredientName}: ${alert.currentStock}${alert.unit} ` +
          `(Min: ${alert.minStock}${alert.unit}, Reorder: ${alert.reorderPoint}${alert.unit}) - ` +
          `$${alert.costPerUnit.toFixed(2)}/${alert.unit}`,
      )
      .join("\n");

    const formatLowList = lowAlerts
      .map(
        (alert, idx) =>
          `${idx + 1}. ${alert.ingredientName}: ${alert.currentStock}${alert.unit} ` +
          `(Min: ${alert.minStock}${alert.unit}) - ` +
          `$${alert.costPerUnit.toFixed(2)}/${alert.unit}`,
      )
      .join("\n");

    const templateParams = {
      to_name: this.config.managerName || "Inventory Manager",
      to_email: this.config.managerEmail,
      total_alerts: alerts.length.toString(),
      critical_count: criticalAlerts.length.toString(),
      low_count: lowAlerts.length.toString(),
      alert_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      alert_time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dashboard_url:
        this.config.dashboardUrl ||
        "https://restaurant-mangement-system-seven.vercel.app/inventory/IngredientStockDashboard",

      critical_items_list: formatCriticalList || "None",
      low_items_list: formatLowList || "None",
    };

    try {
      console.log("Sending email with params:", templateParams);

      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams,
      );

      console.log("Email sent successfully:", result.text);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);

      // Log specific error details for debugging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }

      return false;
    }
  }

  /**
   * Sends a test email to verify the EmailJS configuration.
   * Uses predefined dummy data to fill the template.
   *
   * @returns Promise<boolean> – True if the test email was sent successfully.
   */
  async sendTestEmail(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn("EmailJS not initialized");
      return false;
    }

    const testParams = {
      to_name: this.config.managerName || "Test User",
      to_email: this.config.managerEmail,
      total_alerts: "3",
      critical_count: "1",
      low_count: "2",
      alert_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      alert_time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dashboard_url:
        this.config.dashboardUrl ||
        "https://restaurant-mangement-system-seven.vercel.app/inventory/IngredientStockDashboard",

      critical_items_list:
        "1. Tomatoes: 5kg (Min: 20kg, Reorder: 10kg) - $2.50/kg",
      low_items_list:
        "1. Onions: 15kg (Min: 25kg) - $1.80/kg\n2. Garlic: 8kg (Min: 15kg) - $3.20/kg",
    };

    try {
      console.log("Sending test email with params:", testParams);

      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        testParams,
      );

      console.log("Test email sent successfully:", result.text);
      return true;
    } catch (error) {
      console.error("Test email failed:", error);
      return false;
    }
  }

  /**
   * Sends a reorder confirmation email after a purchase order is created.
   *
   * @param ingredientName - Name of the ingredient being reordered.
   * @param reorderId     - Unique identifier of the reorder transaction.
   * @param quantity      - Amount ordered.
   * @param estimatedCost - Estimated total cost of the order.
   * @param supplier      - Optional supplier name (defaults to "Default Supplier").
   * @returns Promise<boolean> – True if the email was sent successfully.
   */
  async sendReorderConfirmation(
    ingredientName: string,
    reorderId: string,
    quantity: number,
    estimatedCost: number,
    supplier?: string,
  ): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn("EmailJS not initialized");
      return false;
    }

    const templateParams = {
      to_name: this.config.managerName || "Inventory Manager",
      to_email: this.config.managerEmail,
      ingredient_name: ingredientName,
      reorder_id: reorderId,
      quantity: quantity.toString(),
      estimated_cost: estimatedCost.toFixed(2),
      order_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      order_time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      supplier: supplier || "Default Supplier",
    };

    try {
      await emailjs.send(
        this.config.serviceId,
        "reorder_confirmation", // You must create this template in EmailJS
        templateParams,
      );
      console.log("Reorder confirmation email sent");
      return true;
    } catch (error) {
      console.error("Failed to send reorder confirmation:", error);
      return false;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates and configures an EmailJSNotificationService instance.
 * - On the server side (window undefined), returns a mock service that
 *   always reports success (prevents runtime errors during SSR).
 * - On the client side, reads configuration from environment variables
 *   and validates them. Logs warnings if any required variable is missing.
 *
 * @returns {EmailJSNotificationService} A fully configured service (or mock for SSR).
 */
export const createEmailJSNotificationService =
  (): EmailJSNotificationService => {
    // Server‑side rendering – return a mock object that satisfies the interface
    if (typeof window === "undefined") {
      return {
        sendLowStockAlert: async () => true,
        sendTestEmail: async () => true,
        sendReorderConfirmation: async () => true,
      } as any;
    }

    const config: EmailJSConfig = {
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
      templateId:
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "low_stock_alert",
      publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
      managerEmail: process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL || "",
      managerName:
        process.env.NEXT_PUBLIC_INVENTORY_MANAGER_NAME || "Inventory Manager",
      dashboardUrl:
        process.env.NEXT_PUBLIC_DASHBOARD_URL ||
        "https://restaurant-mangement-system-seven.vercel.app/inventory/IngredientStockDashboard",
    };

    // Validate that all required configuration keys are present
    const isValidConfig =
      config.serviceId &&
      config.templateId &&
      config.publicKey &&
      config.managerEmail;

    if (!isValidConfig) {
      console.warn(
        "EmailJS configuration is incomplete. Email notifications will be disabled.",
      );
      console.warn("Missing configuration:", {
        serviceId: !config.serviceId,
        templateId: !config.templateId,
        publicKey: !config.publicKey,
        managerEmail: !config.managerEmail,
      });
    }

    return new EmailJSNotificationService(config);
  };
