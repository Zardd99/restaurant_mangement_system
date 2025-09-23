import React from "react";
import { Loader } from "lucide-react";
import { MenuItem } from "../../../hooks/useMenuData";

interface DeleteItemModalProps {
  item: MenuItem;
  processing: boolean;
  onDelete: (itemId: string) => void;
  onClose: () => void;
}

const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
  item,
  processing,
  onDelete,
  onClose,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Delete Menu Item
      </h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete <strong>{item.name}</strong>? This
        action cannot be undone.
      </p>
      <div className="flex space-x-3">
        <button
          onClick={() => onDelete(item._id)}
          disabled={processing}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {processing ? (
            <Loader className="animate-spin mr-2" size={16} />
          ) : null}
          Delete
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteItemModal;
