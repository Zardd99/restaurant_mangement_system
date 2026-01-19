import { useCallback, useEffect } from "react";
import { MenuItem } from "./useMenuData";
import { useLocalStorage } from "./useLocalStorage";
import { LocalStorageOrderRepository } from "@/app/repositories/LocalStorageOrderRepository";
import {
  loadOrder,
  addToOrder as ucAddToOrder,
  updateQuantity as ucUpdateQuantity,
  updateInstructions as ucUpdateInstructions,
  removeItem as ucRemoveItem,
  clearOrder as ucClearOrder,
} from "@/app/usecases/OrderUseCases";

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export const useOrderManager = () => {
  const [currentOrder, setCurrentOrder] = useLocalStorage<OrderItem[]>(
    "waiter_current_order",
    [],
  );

  // Create repository instance (constructor injection)
  const repo = new LocalStorageOrderRepository();

  // Ensure local state is in sync with repository at mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await loadOrder(repo as any);
      if (mounted && res.ok) setCurrentOrder(res.value as OrderItem[]);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToOrder = useCallback(
    async (item: MenuItem) => {
      const dto = { menuItem: item, quantity: 1, specialInstructions: "" };
      const res = await ucAddToOrder(repo as any, dto as any);
      if (res.ok) setCurrentOrder(res.value as OrderItem[]);
    },
    [setCurrentOrder],
  );

  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      const res = await ucUpdateQuantity(repo as any, itemId, newQuantity);
      if (res.ok) setCurrentOrder(res.value as OrderItem[]);
    },
    [setCurrentOrder],
  );

  const updateInstructions = useCallback(
    async (itemId: string, instructions: string) => {
      const res = await ucUpdateInstructions(repo as any, itemId, instructions);
      if (res.ok) setCurrentOrder(res.value as OrderItem[]);
    },
    [setCurrentOrder],
  );

  const removeFromOrder = useCallback(
    async (itemId: string) => {
      const res = await ucRemoveItem(repo as any, itemId);
      if (res.ok) setCurrentOrder(res.value as OrderItem[]);
    },
    [setCurrentOrder],
  );

  const calculateTotal = useCallback(() => {
    // UI-friendly synchronous total based on current state
    return currentOrder.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0,
    );
  }, [currentOrder]);

  const clearOrder = useCallback(async () => {
    const res = await ucClearOrder(repo as any);
    if (res.ok) setCurrentOrder([]);
  }, [setCurrentOrder]);

  return {
    currentOrder,
    addToOrder,
    updateQuantity,
    updateInstructions,
    removeFromOrder,
    calculateTotal,
    clearOrder,
  };
};
