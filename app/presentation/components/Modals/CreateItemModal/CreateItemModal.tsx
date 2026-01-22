import React, { useState } from "react";
import { Plus, Loader } from "lucide-react";
import { MenuItem } from "@/app/hooks/useMenuData";

interface CreateItemModalProps {
  processing: boolean;
  onCreate: (newItem: Partial<MenuItem>) => void;
  onClose: () => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  processing,
  onCreate,
  onClose,
}) => {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDietaryTags, setEditDietaryTags] = useState<string[]>([]);
  const [editAvailability, setEditAvailability] = useState(true);
  const [editPreparationTime, setEditPreparationTime] = useState(15);
  const [editChefSpecial, setEditChefSpecial] = useState(false);

  const dietaryOptions = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "spicy",
    "nut-free",
  ];

  const toggleDietaryTag = (tag: string) => {
    if (editDietaryTags.includes(tag)) {
      setEditDietaryTags(editDietaryTags.filter((t) => t !== tag));
    } else {
      setEditDietaryTags([...editDietaryTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: editName,
      description: editDescription,
      price: editPrice,
      category: editCategory,
      image: editImage,
      dietaryTags: editDietaryTags,
      availability: editAvailability,
      preparationTime: editPreparationTime,
      chefSpecial: editChefSpecial,
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Create New Menu Item
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            required
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editPrice}
            onChange={(e) => setEditPrice(parseFloat(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editImage}
            onChange={(e) => setEditImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dietary Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDietaryTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  editDietaryTags.includes(tag)
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preparation Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editPreparationTime}
            onChange={(e) => setEditPreparationTime(parseInt(e.target.value))}
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="createAvailability"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={editAvailability}
            onChange={(e) => setEditAvailability(e.target.checked)}
          />
          <label
            htmlFor="createAvailability"
            className="ml-2 block text-sm text-gray-700"
          >
            Available
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="createChefSpecial"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={editChefSpecial}
            onChange={(e) => setEditChefSpecial(e.target.checked)}
          />
          <label
            htmlFor="createChefSpecial"
            className="ml-2 block text-sm text-gray-700"
          >
            Chef Special
          </label>
        </div>
        <div className="mt-6 flex space-x-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            {processing ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <Plus className="mr-2" size={16} />
            )}
            Create Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateItemModal;
