/**
 * =============================================================================
 * EMAILJS DEBUG SERVICE – DIAGNOSTIC VERSION
 * =============================================================================
 *
 * Purpose: Provide detailed diagnostics for EmailJS integration.
 *          Logs all steps to console and returns a full diagnostic object.
 *
 * ✅ Responsibilities:
 *   - Initialise EmailJS with public key.
 *   - Validate configuration and template parameters.
 *   - Send test email and capture full response/error details.
 *   - Generate human‑readable diagnostic report.
 *
 * 🚫 Does NOT:
 *   - Send actual business notifications (use NotificationService instead).
 *   - Store any state beyond configuration.
 *
 * @module EmailJSDebugService
 */

import emailjs from "@emailjs/browser";

// =============================================================================
// DIAGNOSTIC SERVICE CLASS
// =============================================================================

/**
 * EmailJSDebugService
 * -------------------
 * A specialised service that sends test emails via EmailJS with exhaustive
 * logging and diagnostics. Useful for debugging configuration issues.
 *
 * @example
 * const service = getEmailJSDebugService();
 * const result = await service.sendWithDiagnostics("manager@example.com");
 * console.log(result.diagnostics);
 */
export class EmailJSDebugService {
  // ---------------------------------------------------------------------------
  // PRIVATE PROPERTIES
  // ---------------------------------------------------------------------------
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private isInitialized: boolean = false;

  // ---------------------------------------------------------------------------
  // CONSTRUCTOR
  // ---------------------------------------------------------------------------
  /**
   * Creates a new diagnostic service instance.
   * Reads environment variables and initialises EmailJS if a public key is present.
   */
  constructor() {
    this.serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
    this.templateId =
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "low_stock_static";
    this.publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

    if (typeof window !== "undefined" && this.publicKey) {
      try {
        emailjs.init(this.publicKey);
        this.isInitialized = true;
        console.log("[EmailJS] Initialized successfully");
      } catch (error) {
        console.error("[EmailJS] Failed to initialize:", error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  /**
   * Sends a test email to the specified manager address.
   * Performs a series of diagnostic checks and returns the full result object.
   *
   * @param managerEmail - Recipient email address.
   * @param managerName  - Recipient name (defaults to "Manager").
   * @returns            - Object containing `success` flag, optional `error` message,
   *                       and a detailed `diagnostics` object.
   */
  async sendWithDiagnostics(
    managerEmail: string,
    managerName: string = "Manager",
  ): Promise<{ success: boolean; error?: string; diagnostics: any }> {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      config: {
        serviceId: this.serviceId || "NOT_SET",
        templateId: this.templateId || "NOT_SET",
        publicKey: this.publicKey ? "SET (hidden)" : "NOT_SET",
        isInitialized: this.isInitialized,
      },
      params: null,
      response: null,
      error: null,
    };

    console.log("[EmailJS] Diagnostic Check");
    console.log("----------------------------------------");

    // Check 1: Initialisation
    console.log("1. Initialization:", this.isInitialized ? "[OK]" : "[FAILED]");
    if (!this.isInitialized) {
      diagnostics.error = "EmailJS not initialized";
      return { success: false, error: "Not initialized", diagnostics };
    }

    // Check 2: Configuration
    console.log("2. Configuration:");
    console.log("   - Service ID:", this.serviceId || "[MISSING]");
    console.log("   - Template ID:", this.templateId || "[MISSING]");
    console.log("   - Public Key:", this.publicKey ? "[SET]" : "[MISSING]");

    if (!this.serviceId || !this.templateId || !this.publicKey) {
      diagnostics.error = "Missing configuration";
      return { success: false, error: "Missing config", diagnostics };
    }

    // Check 3: Template Parameters
    const params = {
      to_email: managerEmail,
      to_name: managerName,
    };

    diagnostics.params = params;

    console.log("3. Template Parameters:");
    console.log("   - to_email:", params.to_email);
    console.log("   - to_name:", params.to_name);
    console.log("   - Parameter count:", Object.keys(params).length);
    console.log("   - Parameter types:", {
      to_email: typeof params.to_email,
      to_name: typeof params.to_name,
    });

    // Check 4: Parameter Validation
    const hasInvalidChars = (str: string) => {
      // Check for characters that might cause issues in EmailJS
      return /[{}\[\]<>]/.test(str);
    };

    console.log("4. Parameter Validation:");
    const emailValid = !hasInvalidChars(params.to_email);
    const nameValid = !hasInvalidChars(params.to_name);
    console.log("   - Email valid:", emailValid ? "[OK]" : "[INVALID]");
    console.log("   - Name valid:", nameValid ? "[OK]" : "[INVALID]");

    if (!emailValid || !nameValid) {
      diagnostics.error = "Invalid characters in parameters";
      return { success: false, error: "Invalid params", diagnostics };
    }

    // Check 5: Send Attempt
    console.log("5. Sending Email...");
    try {
      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        params,
      );

      diagnostics.response = {
        status: result.status,
        text: result.text,
      };

      console.log("[SUCCESS] Email sent successfully!");
      console.log("   - Status:", result.status);
      console.log("   - Response:", result.text);
      console.log("----------------------------------------");

      return { success: true, diagnostics };
    } catch (error: any) {
      diagnostics.error = {
        message: error.message,
        name: error.name,
        status: error.status,
        text: error.text,
        stack: error.stack,
      };

      console.error("[FAILED] Email send failed!");
      console.error("   - Error Name:", error.name);
      console.error("   - Error Message:", error.message);
      console.error("   - Error Status:", error.status);
      console.error("   - Error Text:", error.text);
      console.error("   - Full Error:", error);
      console.log("----------------------------------------");

      return {
        success: false,
        error: error.message || "Unknown error",
        diagnostics,
      };
    }
  }

  /**
   * Generates a plain‑text diagnostic report summarising the current
   * EmailJS configuration and environment state.
   *
   * @returns A formatted string containing the report.
   */
  generateReport(): string {
    const report = `
EmailJS Diagnostic Report
========================================

Environment Check:
- Browser: ${typeof window !== "undefined" ? "[OK] Detected" : "[FAILED] Not detected"}
- EmailJS Library: ${typeof emailjs !== "undefined" ? "[OK] Loaded" : "[FAILED] Not loaded"}
- Initialized: ${this.isInitialized ? "[OK] Yes" : "[FAILED] No"}

Configuration:
- Service ID: ${this.serviceId || "[MISSING]"}
- Template ID: ${this.templateId || "[MISSING]"}
- Public Key: ${this.publicKey ? "[SET]" : "[MISSING]"}
- Manager Email: ${process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL || "[MISSING]"}

Recommendations:
${!this.serviceId ? "- [WARNING] Set NEXT_PUBLIC_EMAILJS_SERVICE_ID in .env.local\n" : ""}${!this.templateId ? "- [WARNING] Set NEXT_PUBLIC_EMAILJS_TEMPLATE_ID in .env.local\n" : ""}${!this.publicKey ? "- [WARNING] Set NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in .env.local\n" : ""}${!this.isInitialized ? "- [WARNING] Check if running in browser environment\n" : ""}
========================================
`;
    return report;
  }
}

// =============================================================================
// SINGLETON ACCESSOR
// =============================================================================

let debugInstance: EmailJSDebugService | null = null;

/**
 * Returns the singleton instance of EmailJSDebugService.
 * Creates it if it does not already exist.
 *
 * @returns The shared EmailJSDebugService instance.
 */
export const getEmailJSDebugService = (): EmailJSDebugService => {
  if (!debugInstance) {
    debugInstance = new EmailJSDebugService();
  }
  return debugInstance;
};
