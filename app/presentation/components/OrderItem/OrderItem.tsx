import React from "react";

interface OrderItemProps {
  item: {
    menuItem: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    specialInstructions?: string;
  };
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onUpdateInstructions: (itemId: string, instructions: string) => void;
  onRemove: (itemId: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({
  item,
  onUpdateQuantity,
  onUpdateInstructions,
  onRemove,
}) => {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
          <p className="text-sm text-gray-600">
            ${item.menuItem.price.toFixed(2)} × {item.quantity} = $
            {(item.menuItem.price * item.quantity).toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.menuItem._id)}
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
          onClick={() => onUpdateQuantity(item.menuItem._id, item.quantity - 1)}
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
          onClick={() => onUpdateQuantity(item.menuItem._id, item.quantity + 1)}
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
            onUpdateInstructions(item.menuItem._id, e.target.value)
          }
          placeholder="Special instructions"
          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
};

export default OrderItem;
