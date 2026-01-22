import { useState, useCallback } from "react";

export const useNavbarViewModel = (
  onMenuToggle: () => void,
  isMenuOpen: boolean,
) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setInternalIsOpen((prev) => !prev);
    onMenuToggle();
  }, [onMenuToggle]);

  const handleClickOutside = useCallback(
    (event: MouseEvent): boolean => {
      const target = event.target as HTMLElement;
      const isSidebar = target.closest("[data-sidebar]");
      const isHamburger = target.closest("[data-hamburger]");

      if (!isSidebar && !isHamburger && internalIsOpen) {
        setInternalIsOpen(false);
        return true;
      }
      return false;
    },
    [internalIsOpen],
  );

  return {
    isMenuOpen: internalIsOpen || isMenuOpen,
    handleMenuToggle,
    handleClickOutside,
  };
};
