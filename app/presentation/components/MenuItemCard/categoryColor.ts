import { MenuItem } from "@/app/hooks/useMenuData";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#0ea5e9",
] as const;

export const getCategoryName = (category: MenuItem["category"]): string =>
  typeof category === "string" ? category : category?.name || "";

const hash = (value: string): number => {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) sum = (sum + value.charCodeAt(i)) % 9973;
  return sum;
};

export interface CategorySwatch {
  name: string;
  accent: string;
  tint: string;
}

export const getCategorySwatch = (category: MenuItem["category"]): CategorySwatch => {
  const name = getCategoryName(category);
  const accent = PALETTE[hash(name.toLowerCase()) % PALETTE.length];
  return { name, accent, tint: `${accent}1A` };
};
