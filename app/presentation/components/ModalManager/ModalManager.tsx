import React from "react";
import ViewItemModal from "../Modals/ViewItemModal/ViewItemModal";
import EditItemModal from "../Modals/EditItemModal/EditItemModal";
import CreateItemModal from "../Modals/CreateItemModal/CreateItemModal";
import DeleteItemModal from "../Modals/DeleteItemModal/DeleteItemModal";
import { MenuItem } from "../../../hooks/useMenuData";

interface ModalManagerProps {
  modalType: "view" | "edit" | "delete" | "create" | null;
  selectedItem: MenuItem | null;
  processing: boolean;
  onClose: () => void;
  onUpdate: (itemId: string, updates: Partial<MenuItem>) => void;
  onCreate: (newItem: Partial<MenuItem>) => void;
  onDelete: (itemId: string) => void;
  getCategoryName: (category: string | { _id: string; name: string }) => string;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

const ModalManager: React.FC<ModalManagerProps> = ({
  modalType,
  selectedItem,
  processing,
  onClose,
  onUpdate,
  onCreate,
  onDelete,
  getCategoryName,
  formatPrice,
  formatDate,
}) => {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[10000] pt-20 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        {modalType === "view" && selectedItem && (
          <ViewItemModal
            item={selectedItem}
            getCategoryName={getCategoryName}
            formatPrice={formatPrice}
            formatDate={formatDate}
            onClose={onClose}
          />
        )}

        {modalType === "edit" && selectedItem && (
          <EditItemModal
            item={selectedItem}
            processing={processing}
            onSave={onUpdate}
            onClose={onClose}
            getCategoryName={getCategoryName}
          />
        )}

        {modalType === "create" && (
          <CreateItemModal
            processing={processing}
            onCreate={onCreate}
            onClose={onClose}
          />
        )}

        {modalType === "delete" && selectedItem && (
          <DeleteItemModal
            item={selectedItem}
            processing={processing}
            onDelete={onDelete}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default ModalManager;
