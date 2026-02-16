import { SidebarSection as SidebarSectionType, SidebarItem } from "./types";
import SidebarItemComponent from "./SidebarItem";

/**
 * Props for the SidebarSection component.
 *
 * @property section - The section data containing a label and an array of items.
 * @property expandedItems - Set of item IDs that are currently expanded (dropdowns open).
 * @property onItemToggle - Callback to toggle the expanded state of an item (used for dropdowns).
 * @property onItemClick - Optional callback triggered when an item is clicked (e.g., for analytics or special actions like logout).
 * @property level - Current nesting depth (0 for top-level items, incremented for children). Used for indentation.
 */
interface SidebarSectionProps {
  section: SidebarSectionType;
  expandedItems: Set<string>;
  onItemToggle: (itemId: string) => void;
  onItemClick?: (itemId: string) => void;
  level?: number;
}

/**
 * SidebarSection Component
 *
 * This component renders a single section of the sidebar, including an optional
 * section label and a list of navigation items. It supports nested items (dropdowns)
 * by recursively rendering child items using the `renderItem` function.
 *
 * The component relies on a Set of `expandedItems` to determine which dropdowns are open,
 * and a callback `onItemToggle` to update that set when a dropdown header is clicked.
 * This design keeps the expansion state external, allowing the parent (e.g., a layout)
 * to manage and persist the state (e.g., via URL or local storage).
 *
 * Styling is applied via Tailwind CSS classes, with indentation controlled by the
 * `level` prop (incremented for children) and a left border for visual hierarchy.
 *
 * @param props - See SidebarSectionProps interface.
 * @returns A React fragment containing the section label (if present) and the rendered items.
 */
const SidebarSection = ({
  section,
  expandedItems,
  onItemToggle,
  onItemClick,
  level = 0,
}: SidebarSectionProps) => {
  // Safely access items array – default to empty array if undefined.
  const items = section.items || [];

  // If there are no items, render nothing (section is effectively empty).
  if (!items.length) return null;

  /**
   * Recursively renders a sidebar item and its children (if any and expanded).
   *
   * This function is defined inside the component to capture the current props
   * (expandedItems, onItemToggle, onItemClick, level) via closure. It returns a
   * fragment containing:
   *   - The SidebarItemComponent for the current item.
   *   - If the item has children and is expanded, a nested container with its children,
   *     each rendered by calling renderItem again with incremented level.
   *
   * The recursion stops when an item has no children or is not expanded.
   *
   * @param item - The sidebar item to render.
   * @param currentLevel - The current indentation level (used for styling and passing down).
   * @returns A React fragment representing the item and its expanded children.
   */
  const renderItem = (item: SidebarItem, currentLevel: number) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="space-y-1">
        {/* Render the item itself */}
        <SidebarItemComponent
          item={item}
          isExpanded={isExpanded}
          // Only provide onToggle if the item actually has children; otherwise, it's not a dropdown.
          onToggle={hasChildren ? () => onItemToggle(item.id) : undefined}
          onClick={() => onItemClick?.(item.id)}
          level={currentLevel}
        />

        {/* If the item has children and is expanded, render them recursively */}
        {hasChildren && isExpanded && item.children && (
          <div className="ml-2 space-y-1 border-l border-gray-800/30 pl-2">
            {item.children.map((child) => renderItem(child, currentLevel + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* Section label – only rendered if provided */}
      {section.label && (
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>{section.label}</span>
            {/* Optional count badge – shows number of items in this section */}
            <span className="text-gray-600 text-xs font-normal">
              {items.length}
            </span>
          </h3>
        </div>
      )}

      {/* Render all top-level items in this section */}
      <div className="space-y-1">
        {items.map((item) => renderItem(item, level))}
      </div>
    </div>
  );
};

export default SidebarSection;
