export interface SidebarItem {
  id: string;
  text: string;
  icon: React.ReactNode;
  link?: string;
  onClick?: () => void;
  children?: SidebarItem[];
  badge?: string | number;
  roles?: string[];
  isNew?: boolean;
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
  roles?: string[];
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role?: string;
  } | null;
  onLogout?: () => void;
}
