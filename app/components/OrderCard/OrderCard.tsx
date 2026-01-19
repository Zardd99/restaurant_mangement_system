import { useState } from "react";
import { Order } from "../../types/order";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  additionalActions?: React.ReactNode;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "served":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case "dine-in":
        return "🍽️";
      case "takeaway":
        return "🥡";
      case "delivery":
        return "🚚";
      default:
        return "📦";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getOrderTypeIcon(order.orderType)}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group relative">
              {order.tableNumber
                ? `Table ${order.tableNumber}`
                : order.orderType}
            </h3>
            <p className="text-sm text-gray-500">
              {formatOrderDate(order.orderDate)}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            order.status,
          )}`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Order Items Section */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li
              key={index}
              className="text-sm group relative"
              onMouseEnter={() => setHoveredItem(item.menuItem._id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 truncate">
                    {item.quantity}× {item.menuItem.name}
                  </span>
                  {hoveredItem === item.menuItem._id && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                      <p className="font-semibold text-gray-900">
                        {item.menuItem.name}
                      </p>
                      {item.menuItem.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {item.menuItem.description}
                        </p>
                      )}
                      {item.menuItem.category && (
                        <p className="text-xs text-gray-500 mt-1">
                          Category: {item.menuItem.category}
                        </p>
                      )}
                      <p className="text-xs font-medium text-gray-900 mt-2">
                        Price: ${item.menuItem.price.toFixed(2)} each
                      </p>
                      {item.specialInstructions && (
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-gray-900 ml-2">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
              {item.specialInstructions && (
                <p className="text-xs text-gray-500 mt-1 ml-2 truncate">
                  💬 {item.specialInstructions}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Total Amount */}
      <div className="border-t border-gray-200 pt-3 mb-4">
        <div className="flex justify-between items-center font-medium">
          <span className="text-gray-700">Total Amount:</span>
          <span className="text-lg font-bold text-gray-900">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {order.status === "confirmed" && (
          <button
            onClick={() => onStatusUpdate(order._id, "preparing")}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Start Preparing
          </button>
        )}
        {order.status === "preparing" && (
          <button
            onClick={() => onStatusUpdate(order._id, "ready")}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Mark as Ready
          </button>
        )}
        {order.status === "ready" && (
          <button
            onClick={() => onStatusUpdate(order._id, "served")}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Mark as Served
          </button>
        )}

        {(order.status === "confirmed" || order.status === "preparing") && (
          <button
            onClick={() => onStatusUpdate(order._id, "cancelled")}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
