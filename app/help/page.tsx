"use client";

import { useState, useCallback, useId } from "react";
import {
  HelpCircle, Mail, ChevronDown, ChevronUp,
  ShoppingCart, ChefHat, Package, BarChart2,
  Bell, Settings, Users, CreditCard,
  AlertCircle, CheckCircle2, Clock, Zap,
  Send, BookOpen, MessageSquare, Phone,
  Shield, LayoutDashboard, RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FaqItem = { q: string; a: string };
type SubmitState = "idle" | "sending" | "success" | "error";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES: { icon: React.ReactNode; title: string; desc: string; roles: string }[] = [
  {
    icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />,
    title: "Dashboard",
    desc: "Real-time overview of orders, revenue, and staff activity.",
    roles: "Admin, Manager",
  },
  {
    icon: <ShoppingCart className="w-5 h-5 text-green-500" />,
    title: "Waiter Order",
    desc: "Place and track table orders with live kitchen updates.",
    roles: "Waiter, Admin",
  },
  {
    icon: <ChefHat className="w-5 h-5 text-amber-500" />,
    title: "Kitchen Display",
    desc: "Manage order queue, update prep status, view item details.",
    roles: "Chef, Admin",
  },
  {
    icon: <Package className="w-5 h-5 text-purple-500" />,
    title: "Inventory",
    desc: "Track ingredients, receive low-stock alerts, manage suppliers.",
    roles: "Manager, Admin",
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-rose-500" />,
    title: "Analytics",
    desc: "Sales trends, revenue reports, and performance metrics.",
    roles: "Admin, Manager",
  },
  {
    icon: <CreditCard className="w-5 h-5 text-indigo-500" />,
    title: "Billing",
    desc: "Process payments, generate receipts, and manage cashflow.",
    roles: "Cashier, Admin",
  },
  {
    icon: <Bell className="w-5 h-5 text-orange-500" />,
    title: "Notifications",
    desc: "Live order alerts for new orders, preparation stages, and served.",
    roles: "All staff",
  },
  {
    icon: <Settings className="w-5 h-5 text-gray-500" />,
    title: "Settings",
    desc: "Dark mode, notification preferences, kitchen defaults.",
    roles: "All staff",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "How do I place a new order as a waiter?",
    a: "Go to Waiter Order in the sidebar, select the table, choose menu items, set quantities, and tap 'Place Order'. The kitchen receives it instantly via WebSocket.",
  },
  {
    q: "Why isn't my order showing on the kitchen display?",
    a: "Check your internet connection first — the kitchen display requires a live socket connection. If the socket icon shows 'Disconnected', refresh the page. If the issue persists, contact your admin.",
  },
  {
    q: "How do I update an order's status as a chef?",
    a: "On the Kitchen Display, find the order card and tap 'Start Preparing', 'Ready', or 'Served'. Status updates are instant and notify the relevant staff.",
  },
  {
    q: "How do inventory levels get deducted?",
    a: "When an order is marked as 'Preparing', the system automatically deducts the required ingredients based on each menu item's configured recipe. You can see current stock in Inventory → Ingredient Stock Dashboard.",
  },
  {
    q: "I received a low-stock email alert — what do I do?",
    a: "Navigate to Inventory → Ingredient Stock Dashboard. Red-highlighted items are below threshold. Update quantities after restocking, or contact your supplier from the Suppliers section.",
  },
  {
    q: "How do I add a new staff account?",
    a: "Only Admin accounts can create users. Go to Users in the sidebar, click 'Add User', fill in their name, email, role, and a temporary password. They can change their password on first login.",
  },
  {
    q: "What roles are available in the system?",
    a: "Admin (full access), Manager (operations + reports), Waiter (orders), Chef (kitchen display), Cashier (billing), and Customer (order tracking). Roles control which pages and actions are visible.",
  },
  {
    q: "How do I enable dark mode?",
    a: "Go to Settings (sidebar → System → Settings). Under Appearance, choose Light, Dark, or System. Your choice is saved per device.",
  },
  {
    q: "Can I turn off notification toast pop-ups?",
    a: "Yes. In Settings → Notifications, toggle 'Enable toast notifications' off to silence all pop-ups, or use the per-type switches to disable specific event types.",
  },
  {
    q: "Orders are auto-cancelling — is this expected?",
    a: "Yes. The system has a configurable auto-cancel timeout for orders that haven't been confirmed within a set period. An admin can adjust the timeout window in the system configuration.",
  },
  {
    q: "How does table occupancy tracking work?",
    a: "Tables are marked occupied when an order is placed and cleared when the order is served or cancelled. The waiter order screen shows table availability in real time.",
  },
  {
    q: "I forgot my password — how do I reset it?",
    a: "Contact your system administrator. Admins can reset passwords from the Users management page. Self-service password reset via email can be enabled by your admin.",
  },
];

const QUICK_TIPS: { role: string; color: string; tips: string[] }[] = [
  {
    role: "Admin",
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
    tips: [
      "Use Analytics to spot peak hours and adjust staffing.",
      "Set up SMTP credentials in .env to enable email alerts.",
      "Seed the database with sample data via npm run seed-all.",
    ],
  },
  {
    role: "Manager",
    color: "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
    tips: [
      "Check Inventory daily — alerts fire at 20% stock threshold.",
      "Use Promotions to create time-limited discount codes.",
      "Analytics exports help with weekly reporting.",
    ],
  },
  {
    role: "Waiter",
    color: "border-green-500 bg-green-50 dark:bg-green-950/30",
    tips: [
      "Tap the table number before adding items to auto-assign.",
      "The Live badge on Waiter Order means the socket is connected.",
      "Notifications pop up when your order is ready to serve.",
    ],
  },
  {
    role: "Chef",
    color: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
    tips: [
      "Use the Kitchen Display filter to see only your station's items.",
      "Compact Cards mode (Settings) fits more orders on screen.",
      "Status updates are instant — no need to refresh.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            aria-expanded={open === i}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
              {item.q}
            </span>
            {open === i ? (
              <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
            )}
          </button>
          {open === i && (
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FeatureCard({
  icon, title, desc, roles,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  roles: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
        <span className="inline-block mt-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
          {roles}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

function ContactForm() {
  const { axiosInstance, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  const formId = useId();

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("sending");
      setError("");
      try {
        await axiosInstance.post("/api/support/contact", form);
        setStatus("success");
        setForm((prev) => ({ ...prev, subject: "", message: "" }));
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Failed to send. Please try again.",
        );
        setStatus("error");
      }
    },
    [axiosInstance, form],
  );

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Message sent!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We'll get back to you at <strong>{form.email}</strong> as soon as possible.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-name`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Your name
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={set("name")}
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-email`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            placeholder="jane@restaurant.com"
            value={form.email}
            onChange={set("email")}
            required
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${formId}-subject`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Subject
        </label>
        <select
          id={`${formId}-subject`}
          value={form.subject}
          onChange={set("subject")}
          required
          className={inputCls}
        >
          <option value="">Select a topic…</option>
          <option value="Bug report">Bug report</option>
          <option value="Feature request">Feature request</option>
          <option value="Account or login issue">Account or login issue</option>
          <option value="Order or kitchen issue">Order or kitchen issue</option>
          <option value="Inventory or billing question">Inventory or billing question</option>
          <option value="Performance or connectivity">Performance or connectivity</option>
          <option value="General question">General question</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${formId}-message`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          id={`${formId}-message`}
          placeholder="Describe your issue or question in detail…"
          value={form.message}
          onChange={set("message")}
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className={`${inputCls} resize-none`}
        />
        <p className="text-right text-[11px] text-gray-400">
          {form.message.length}/2000
        </p>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        {status === "sending" ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<"faq" | "contact" | "tips">("faq");
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-gray-900 px-4 pt-10 pb-10 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl mb-4">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Help &amp; Support</h1>
          <p className="mt-2 text-blue-100 text-sm md:text-base max-w-lg mx-auto">
            Find answers, learn the system, or reach us directly. We're here to help your
            restaurant run smoothly.
          </p>
          {/* Status indicator */}
          <div className="mt-5 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs text-blue-100">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
            System online &nbsp;·&nbsp; Support email active
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Quick info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Clock className="w-4 h-4" />, label: "Response time", value: "< 24 hrs", color: "text-blue-600" },
            { icon: <Mail className="w-4 h-4" />, label: "Support email", value: "Available", color: "text-green-600" },
            { icon: <Zap className="w-4 h-4" />, label: "Real-time", value: "WebSocket", color: "text-amber-600" },
            { icon: <Shield className="w-4 h-4" />, label: "Version", value: "1.0.0", color: "text-purple-600" },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center shadow-sm"
            >
              <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1 gap-1 shadow-sm">
          {(
            [
              { key: "faq" as const,     label: "FAQ",           icon: <BookOpen className="w-4 h-4" /> },
              { key: "contact" as const, label: "Contact Us",    icon: <MessageSquare className="w-4 h-4" /> },
              { key: "tips" as const,    label: "Role Tips",     icon: <Zap className="w-4 h-4" /> },
            ] as const
          ).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* FAQ tab */}
        {activeTab === "faq" && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Frequently Asked Questions
            </h2>
            <FaqAccordion items={FAQ} />
          </div>
        )}

        {/* Contact tab */}
        {activeTab === "contact" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-7">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Send us a message
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Fill in the form and we'll reply to your email within 24 hours.
              </p>
            </div>

            <ContactForm />

            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <a href="mailto:c.sakda.chin@gmail.com" className="hover:text-blue-600 transition-colors">
                  c.sakda.chin@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Mon – Fri, 9 AM – 6 PM (ICT)</span>
              </div>
            </div>
          </div>
        )}

        {/* Role tips tab */}
        {activeTab === "tips" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Quick Tips by Role
              {user?.role && (
                <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  You are: {user.role}
                </span>
              )}
            </h2>
            {QUICK_TIPS.map(({ role, color, tips }) => (
              <div
                key={role}
                className={`rounded-xl border-l-4 p-4 ${color}`}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {role}
                </p>
                <ul className="space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* System features grid — always visible */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            System Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>

        {/* Emergency banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Critical issue during service?
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
              For urgent production issues — system down, orders not going through, kitchen display
              offline — email{" "}
              <a
                href="mailto:c.sakda.chin@gmail.com"
                className="font-medium underline underline-offset-2"
              >
                c.sakda.chin@gmail.com
              </a>{" "}
              with subject line{" "}
              <span className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">
                [URGENT]
              </span>
              .
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Restaurant Management System v1.0.0 &nbsp;·&nbsp; Built with Next.js 16 + Express 5
          </p>
        </div>
      </div>
    </div>
  );
}
