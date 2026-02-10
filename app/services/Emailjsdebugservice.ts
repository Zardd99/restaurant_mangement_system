import emailjs from "@emailjs/browser";

/**
 * DIAGNOSTIC VERSION - Logs everything to help debug EmailJS issues
 */
export class EmailJSDebugService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private isInitialized: boolean = false;

  constructor() {
    this.serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
    this.templateId =
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "low_stock_static";
    this.publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

    if (typeof window !== "undefined" && this.publicKey) {
      try {
        emailjs.init(this.publicKey);
        this.isInitialized = true;
        console.log("✅ EmailJS initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize EmailJS:", error);
      }
    }
  }

  /**
   * Send with full diagnostics
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

    console.log("🔍 EmailJS Diagnostic Check");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Check 1: Initialization
    console.log(
      "1. Initialization:",
      this.isInitialized ? "✅ OK" : "❌ FAILED",
    );
    if (!this.isInitialized) {
      diagnostics.error = "EmailJS not initialized";
      return { success: false, error: "Not initialized", diagnostics };
    }

    // Check 2: Configuration
    console.log("2. Configuration:");
    console.log("   - Service ID:", this.serviceId || "❌ MISSING");
    console.log("   - Template ID:", this.templateId || "❌ MISSING");
    console.log("   - Public Key:", this.publicKey ? "✅ SET" : "❌ MISSING");

    if (!this.serviceId || !this.templateId || !this.publicKey) {
      diagnostics.error = "Missing configuration";
      return { success: false, error: "Missing config", diagnostics };
    }

    // Check 3: Parameters
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

    // Check 4: Parameter validation
    const hasInvalidChars = (str: string) => {
      // Check for characters that might cause issues
      return /[{}\[\]<>]/.test(str);
    };

    console.log("4. Parameter Validation:");
    const emailValid = !hasInvalidChars(params.to_email);
    const nameValid = !hasInvalidChars(params.to_name);
    console.log("   - Email valid:", emailValid ? "✅" : "❌");
    console.log("   - Name valid:", nameValid ? "✅" : "❌");

    if (!emailValid || !nameValid) {
      diagnostics.error = "Invalid characters in parameters";
      return { success: false, error: "Invalid params", diagnostics };
    }

    // Check 5: Attempt to send
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

      console.log("✅ EMAIL SENT SUCCESSFULLY!");
      console.log("   - Status:", result.status);
      console.log("   - Response:", result.text);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return { success: true, diagnostics };
    } catch (error: any) {
      diagnostics.error = {
        message: error.message,
        name: error.name,
        status: error.status,
        text: error.text,
        stack: error.stack,
      };

      console.error("❌ EMAIL SEND FAILED!");
      console.error("   - Error Name:", error.name);
      console.error("   - Error Message:", error.message);
      console.error("   - Error Status:", error.status);
      console.error("   - Error Text:", error.text);
      console.error("   - Full Error:", error);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return {
        success: false,
        error: error.message || "Unknown error",
        diagnostics,
      };
    }
  }

  /**
   * Generate full diagnostic report
   */
  generateReport(): string {
    const report = `
╔════════════════════════════════════════════════════════════════╗
║                    EmailJS Diagnostic Report                    ║
╚════════════════════════════════════════════════════════════════╝

Environment Check:
├─ Browser: ${typeof window !== "undefined" ? "✅ Detected" : "❌ Not detected"}
├─ EmailJS Library: ${typeof emailjs !== "undefined" ? "✅ Loaded" : "❌ Not loaded"}
└─ Initialized: ${this.isInitialized ? "✅ Yes" : "❌ No"}

Configuration:
├─ Service ID: ${this.serviceId || "❌ NOT SET"}
├─ Template ID: ${this.templateId || "❌ NOT SET"}
├─ Public Key: ${this.publicKey ? "✅ SET" : "❌ NOT SET"}
└─ Manager Email: ${process.env.NEXT_PUBLIC_INVENTORY_MANAGER_EMAIL || "❌ NOT SET"}

Recommendations:
${!this.serviceId ? "⚠️  Set NEXT_PUBLIC_EMAILJS_SERVICE_ID in .env.local\n" : ""}${!this.templateId ? "⚠️  Set NEXT_PUBLIC_EMAILJS_TEMPLATE_ID in .env.local\n" : ""}${!this.publicKey ? "⚠️  Set NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in .env.local\n" : ""}${!this.isInitialized ? "⚠️  Check if running in browser environment\n" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    return report;
  }
}

// Singleton
let debugInstance: EmailJSDebugService | null = null;

export const getEmailJSDebugService = (): EmailJSDebugService => {
  if (!debugInstance) {
    debugInstance = new EmailJSDebugService();
  }
  return debugInstance;
};
