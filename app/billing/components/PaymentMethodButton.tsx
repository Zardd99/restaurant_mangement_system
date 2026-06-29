"use client";

import { CreditCard, Smartphone, Wallet } from "lucide-react";
import type { PayMethod } from "../types";
import { labelFor } from "../utils";

const icons: Record<PayMethod, React.ReactNode> = {
  cash: <Wallet className="w-4 h-4" />,
  credit_card: <CreditCard className="w-4 h-4" />,
  khqr: <Smartphone className="w-4 h-4" />,
};

export function PaymentMethodButton({
  method,
  selected,
  onClick,
}: {
  method: PayMethod;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
        selected
          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      {icons[method]}
      {labelFor[method]}
    </button>
  );
}
