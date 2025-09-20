import { Order } from "../../(waiter_order)/KitchenDisplaySystem";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
          </h3>
          <p className="text-sm text-gray-500">
            {formatOrderDate(order.orderDate)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            order.status
          )}`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="text-sm">
              <div className="flex justify-between">
                <span>
                  {item.quantity}× {item.menuItem.name}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              {item.specialInstructions && (
                <p className="text-xs text-gray-500 mt-1">
                  Note: {item.specialInstructions}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-3 mb-4">
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        {order.status === "confirmed" && (
          <button
            onClick={() => onStatusUpdate(order._id, "preparing")}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
          >
            Start Preparing
          </button>
        )}
        {order.status === "preparing" && (
          <button
            onClick={() => onStatusUpdate(order._id, "ready")}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
          >
            Mark as Ready
          </button>
        )}
        {order.status === "ready" && (
          <button
            onClick={() => onStatusUpdate(order._id, "served")}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
          >
            Mark as Served
          </button>
        )}
        {(order.status === "confirmed" || order.status === "preparing") && (
          <button
            onClick={() => onStatusUpdate(order._id, "cancelled")}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
