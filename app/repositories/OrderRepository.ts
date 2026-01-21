import { Result } from "../core/Result";
import { MenuItem } from "../hooks/useMenuData";

export interface OrderItemDTO {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface OrderRepository {
  submitOrder(data: {
    items: Array<{
      menuItem: string;
      quantity: number;
      price: number;
      specialInstructions: string;
    }>;
    totalAmount: number;
    tableNumber: number;
    customerName: string;
    orderType: string;
    status: string;
  }): Promise<Result<{ orderId: string }, string>>;
  load(): Promise<OrderItemDTO[]>;
  save(items: OrderItemDTO[]): Promise<void>;
  clear(): Promise<void>;
}
