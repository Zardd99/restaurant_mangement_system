import { OrderItem } from "../../../hooks/useOrderManager";

interface OrderSummaryProps {
  currentOrder: OrderItem[];
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  removeFromOrder: (itemId: string) => void;
  calculateTotal: () => number;
}

const OrderSummary = ({
  currentOrder,
  updateQuantity,
  updateInstructions,
  removeFromOrder,
  calculateTotal,
}: OrderSummaryProps) => {
  if (currentOrder.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          ></path>
        </svg>
        <p>No items in the order yet</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {currentOrder.map((item) => (
          <div
            key={item.menuItem._id}
            className="border-b border-gray-200 pb-4 last:border-0"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {item.menuItem.name}
                </h4>
                <p className="text-sm text-gray-600">
                  ${item.menuItem.price.toFixed(2)} × {item.quantity} = $
                  {(item.menuItem.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeFromOrder(item.menuItem._id)}
                className="text-red-500 hover:text-red-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="mt-2 flex items-center space-x-2">
              <button
                onClick={() =>
                  updateQuantity(item.menuItem._id, item.quantity - 1)
                }
                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 12H4"
                  ></path>
                </svg>
              </button>

              <span className="text-sm font-medium">{item.quantity}</span>

              <button
                onClick={() =>
                  updateQuantity(item.menuItem._id, item.quantity + 1)
                }
                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="mt-2">
              <input
                type="text"
                value={item.specialInstructions || ""}
                onChange={(e) =>
                  updateInstructions(item.menuItem._id, e.target.value)
                }
                placeholder="Special instructions"
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${calculateTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Tax (10%)</span>
          <span className="font-medium">
            ${(calculateTotal() * 0.1).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
