import { SidebarSection as SidebarSectionType, SidebarItem } from "./types";
import SidebarItemComponent from "./SidebarItem";

interface SidebarSectionProps {
  section: SidebarSectionType;
  expandedItems: Set<string>;
  onItemToggle: (itemId: string) => void;
  onItemClick?: (itemId: string) => void;
  level?: number;
}

const SidebarSection = ({
  section,
  expandedItems,
  onItemToggle,
  onItemClick,
  level = 0,
}: SidebarSectionProps) => {
  const items = section.items || [];

  if (!items.length) return null;

  const renderItem = (item: SidebarItem, currentLevel: number) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="space-y-1">
        <SidebarItemComponent
          item={item}
          isExpanded={isExpanded}
          onToggle={hasChildren ? () => onItemToggle(item.id) : undefined}
          onClick={() => onItemClick?.(item.id)}
          level={currentLevel}
        />

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
      {section.label && (
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>{section.label}</span>
            <span className="text-gray-600 text-xs font-normal">
              {items.length}
            </span>
          </h3>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => renderItem(item, level))}
      </div>
    </div>
  );
};

export default SidebarSection;
