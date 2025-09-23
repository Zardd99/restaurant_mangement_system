interface OrderFormProps {
  tableNumber: number;
  setTableNumber: (number: number) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
}

const OrderForm = ({
  tableNumber,
  setTableNumber,
  customerName,
  setCustomerName,
  orderNotes,
  setOrderNotes,
}: OrderFormProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Table Number *
        </label>
        <input
          type="number"
          min="1"
          value={tableNumber}
          onChange={(e) => setTableNumber(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer Name
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Optional"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order Notes
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Special requests or instructions"
          rows={2}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
};

export default OrderForm;
