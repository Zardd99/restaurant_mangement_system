import React, { useState } from "react";
import { Save, Loader } from "lucide-react";
import { MenuItem } from "../../../../hooks/useMenuData";

interface EditItemModalProps {
  item: MenuItem;
  processing: boolean;
  onSave: (itemId: string, updates: Partial<MenuItem>) => void;
  onClose: () => void;
  getCategoryName: (category: string | { _id: string; name: string }) => string;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  processing,
  onSave,
  onClose,
  getCategoryName,
}) => {
  const [editName, setEditName] = useState(item.name);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editPrice, setEditPrice] = useState(item.price);
  const [editCategory, setEditCategory] = useState(
    getCategoryName(item.category),
  );
  const [editImage, setEditImage] = useState(item.image);
  const [editDietaryTags, setEditDietaryTags] = useState<string[]>(
    item.dietaryTags,
  );
  const [editAvailability, setEditAvailability] = useState(item.availability);
  const [editPreparationTime, setEditPreparationTime] = useState(
    item.preparationTime,
  );
  const [editChefSpecial, setEditChefSpecial] = useState(item.chefSpecial);

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
    onSave(item._id, {
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
        Edit Menu Item
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
            id="editAvailability"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={editAvailability}
            onChange={(e) => setEditAvailability(e.target.checked)}
          />
          <label
            htmlFor="editAvailability"
            className="ml-2 block text-sm text-gray-700"
          >
            Available
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="editChefSpecial"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={editChefSpecial}
            onChange={(e) => setEditChefSpecial(e.target.checked)}
          />
          <label
            htmlFor="editChefSpecial"
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
              <Save className="mr-2" size={16} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditItemModal;
