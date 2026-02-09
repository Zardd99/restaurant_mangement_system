export interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role?: string;
  } | null;
}
