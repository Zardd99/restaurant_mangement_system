import { useState, memo, useMemo, useCallback } from "react";
import { Order } from "../../../types/order";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  additionalActions?: React.ReactNode;
}

// Helper functions moved outside component to prevent recreation
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

// Memoized OrderItem component to prevent re-renders of individual items
const OrderItem = memo(
  ({ item, index }: { item: any; index: number }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    return (
      <li
        className="text-sm group relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-900 truncate">
              {item.quantity} × {item.menuItem?.name || "Unknown Item"}
            </span>
            {isHovered && item.menuItem && (
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
                    Category:{" "}
                    {typeof item.menuItem.category === "string"
                      ? item.menuItem.category
                      : item.menuItem.category?.name || "N/A"}
                  </p>
                )}
                <p className="text-xs font-medium text-gray-900 mt-2">
                  Price: ${item.menuItem.price?.toFixed(2) || "0.00"} each
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
    );
  },
  // Only re-render if the item data actually changes
  (prevProps, nextProps) => {
    return (
      prevProps.item.menuItem?._id === nextProps.item.menuItem?._id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.specialInstructions === nextProps.item.specialInstructions
    );
  },
);

OrderItem.displayName = "OrderItem";

const OrderCard = memo(
  ({ order, onStatusUpdate }: OrderCardProps) => {
    // Filter out items with null menuItem - memoized
    const validItems = useMemo(
      () => order.items.filter((item: any) => item.menuItem != null),
      [order.items],
    );

    // Memoize status update handlers to prevent recreation
    const handleStartPreparing = useCallback(() => {
      onStatusUpdate(order._id, "preparing");
    }, [order._id, onStatusUpdate]);

    const handleMarkAsReady = useCallback(() => {
      onStatusUpdate(order._id, "ready");
    }, [order._id, onStatusUpdate]);

    const handleMarkAsServed = useCallback(() => {
      onStatusUpdate(order._id, "served");
    }, [order._id, onStatusUpdate]);

    const handleCancel = useCallback(() => {
      onStatusUpdate(order._id, "cancelled");
    }, [order._id, onStatusUpdate]);

    // Memoize the status color and order type icon
    const statusColorClass = useMemo(
      () => getStatusColor(order.status),
      [order.status],
    );
    const orderTypeIcon = useMemo(
      () => getOrderTypeIcon(order.orderType),
      [order.orderType],
    );
    const formattedDate = useMemo(
      () => formatOrderDate(order.orderDate),
      [order.orderDate],
    );

    // Memoize the status text
    const statusText = useMemo(
      () => order.status.charAt(0).toUpperCase() + order.status.slice(1),
      [order.status],
    );

    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{orderTypeIcon}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group relative">
                {order.tableNumber
                  ? `Table ${order.tableNumber}`
                  : order.orderType}
              </h3>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColorClass}`}
          >
            {statusText}
          </span>
        </div>

        {/* Order Items Section */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
          <ul className="space-y-2">
            {validItems.map((item: any, index: number) => (
              <OrderItem
                key={item.menuItem?._id || `item-${index}`}
                item={item}
                index={index}
              />
            ))}
          </ul>
        </div>

        {/* Total Amount */}
        <div className="border-t border-gray-200 pt-3 mb-4">
          <div className="flex justify-between items-center font-medium">
            <span className="text-gray-700">Total Amount:</span>
            <span className="text-lg font-bold text-gray-900">
              ${order.totalAmount?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {order.status === "confirmed" && (
            <button
              onClick={handleStartPreparing}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Start Preparing
            </button>
          )}
          {order.status === "preparing" && (
            <button
              onClick={handleMarkAsReady}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Mark as Ready
            </button>
          )}
          {order.status === "ready" && (
            <button
              onClick={handleMarkAsServed}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Mark as Served
            </button>
          )}

          {(order.status === "confirmed" || order.status === "preparing") && (
            <button
              onClick={handleCancel}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // If the order ID changed, definitely re-render
    if (prevProps.order._id !== nextProps.order._id) return false;

    // If status changed, re-render
    if (prevProps.order.status !== nextProps.order.status) return false;

    // If callback reference changed, re-render (this should be stable now)
    if (prevProps.onStatusUpdate !== nextProps.onStatusUpdate) return false;

    // If number of items changed, re-render
    if (prevProps.order.items.length !== nextProps.order.items.length)
      return false;

    // If items array reference is the same, skip deep comparison
    if (prevProps.order.items === nextProps.order.items) return true;

    // Deep compare items only if array reference changed
    for (let i = 0; i < prevProps.order.items.length; i++) {
      const prevItem = prevProps.order.items[i];
      const nextItem = nextProps.order.items[i];

      if (prevItem.menuItem?._id !== nextItem.menuItem?._id) return false;
      if (prevItem.quantity !== nextItem.quantity) return false;
      if (prevItem.specialInstructions !== nextItem.specialInstructions)
        return false;
    }

    // All checks passed - no re-render needed
    return true;
  },
);

OrderCard.displayName = "OrderCard";

export default OrderCard;
