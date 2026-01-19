import { MenuItem } from "@/app/hooks/useMenuData";

export interface OrderItemDTO {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface OrderRepository {
  load(): Promise<OrderItemDTO[]>;
  save(items: OrderItemDTO[]): Promise<void>;
  clear(): Promise<void>;
}
