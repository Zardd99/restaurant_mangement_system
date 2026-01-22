export interface NavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  user?: {
    name: string;
    email: string;
    role?: string;
  } | null;
}
