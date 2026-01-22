"use client";

import React, { useMemo } from "react";
import { Order } from "@/app/types/order";

interface Props {
  orders: Order[];
  maxItems?: number;
}

const MenuTopItemsChart: React.FC<Props> = ({ orders, maxItems = 10 }) => {
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();

    orders.forEach((order) => {
      order.items.forEach((it) => {
        const id = it.menuItem._id;
        const name = it.menuItem.name;
        const qty = it.quantity || 1;
        const cur = map.get(id);
        if (cur) cur.qty += qty;
        else map.set(id, { name, qty });
      });
    });

    const arr = Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
    arr.sort((a, b) => b.qty - a.qty);
    return arr.slice(0, maxItems);
  }, [orders, maxItems]);

  if (!topItems.length) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="text-sm text-gray-600">No sales data yet.</div>
      </div>
    );
  }

  const maxQty = Math.max(...topItems.map((t) => t.qty));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-lg font-semibold mb-3">
        Top {topItems.length} Picks
      </h4>
      <div className="flex flex-col gap-3">
        {topItems.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            <div className="w-36 text-sm text-gray-700 truncate">{t.name}</div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-6 bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${(t.qty / maxQty) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm text-gray-600">{t.qty}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuTopItemsChart;
