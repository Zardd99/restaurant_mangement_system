"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface MenuTopItemsChartBWProps {
  orders: any[];
}

const MenuTopItemsChartBW = ({ orders }: MenuTopItemsChartBWProps) => {
  // Process orders to get top items
  const getTopItems = () => {
    const itemCounts: Record<string, number> = {};

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const name = item.menuItem?.name || item.name;
        if (name) {
          itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const topItems = getTopItems();

  if (topItems.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Top Items</h3>
        <p className="text-sm text-gray-500">No order data available</p>
      </div>
    );
  }

  const data = {
    labels: topItems.map(([name]) => name),
    datasets: [
      {
        label: "Orders",
        data: topItems.map(([, count]) => count),
        backgroundColor: [
          "rgba(0, 0, 0, 0.8)",
          "rgba(50, 50, 50, 0.8)",
          "rgba(100, 100, 100, 0.8)",
          "rgba(150, 150, 150, 0.8)",
          "rgba(200, 200, 200, 0.8)",
        ],
        borderColor: "rgba(0, 0, 0, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Top Ordered Items",
        color: "#000",
        font: {
          size: 14,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#000",
          maxRotation: 45,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#000",
          precision: 0,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <Bar data={data} options={options} />
    </div>
  );
};

export default MenuTopItemsChartBW;
