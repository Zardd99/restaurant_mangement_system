import { useState, useCallback, useEffect } from "react";
import { SidebarSection } from "./types";
import { SidebarConfig } from "../../../../lib/sidebar/sidebarConfig";

interface UseSidebarViewModelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onLogout?: () => void;
}

export const useSidebarViewModel = ({
  isOpen,
  onClose,
  userRole,
  onLogout,
}: UseSidebarViewModelProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<SidebarSection[]>([]);

  useEffect(() => {
    // Update sections based on user role
    const filteredSections = SidebarConfig.getFilteredItems(userRole);
    const mappedSections: SidebarSection[] = filteredSections.map(
      (section) => ({
        ...section,
        items: section.items || section.items || [],
        content: section.items || section.items || [],
      }),
    );

    setSections(mappedSections);
  }, [userRole]);

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const isItemExpanded = useCallback(
    (itemId: string) => {
      return expandedItems.has(itemId);
    },
    [expandedItems],
  );

  const handleClose = useCallback(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const handleItemClick = useCallback(
    (itemId: string) => {
      const item = SidebarConfig.getItemById(itemId);
      if (item?.onClick) {
        item.onClick();
        if (itemId === "logout" && onLogout) {
          onLogout();
        }
      }
    },
    [onLogout],
  );

  return {
    sections,
    expandedItems,
    toggleItem,
    isItemExpanded,
    handleClose,
    handleItemClick,
    isOpen,
  };
};
