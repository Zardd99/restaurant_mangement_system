import { useCallback } from "react";
import { MenuItem } from "./useMenuData";
import { useLocalStorage } from "./useLocalStorage";

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export const useOrderManager = () => {
  const [currentOrder, setCurrentOrder] = useLocalStorage<OrderItem[]>(
    "waiter_current_order",
    []
  );

  const addToOrder = useCallback(
    (item: MenuItem) => {
      setCurrentOrder((prev) => {
        const existingItem = prev.find(
          (orderItem) => orderItem.menuItem._id === item._id
        );

        if (existingItem) {
          return prev.map((orderItem) =>
            orderItem.menuItem._id === item._id
              ? { ...orderItem, quantity: orderItem.quantity + 1 }
              : orderItem
          );
        } else {
          return [
            ...prev,
            { menuItem: item, quantity: 1, specialInstructions: "" },
          ];
        }
      });
    },
    [setCurrentOrder]
  );

  const updateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      setCurrentOrder((prev) => {
        if (newQuantity < 1) {
          return prev.filter((item) => item.menuItem._id !== itemId);
        } else {
          return prev.map((item) =>
            item.menuItem._id === itemId
              ? { ...item, quantity: newQuantity }
              : item
          );
        }
      });
    },
    [setCurrentOrder]
  );

  const updateInstructions = useCallback(
    (itemId: string, instructions: string) => {
      setCurrentOrder((prev) =>
        prev.map((item) =>
          item.menuItem._id === itemId
            ? { ...item, specialInstructions: instructions }
            : item
        )
      );
    },
    [setCurrentOrder]
  );

  const removeFromOrder = useCallback(
    (itemId: string) => {
      setCurrentOrder((prev) =>
        prev.filter((item) => item.menuItem._id !== itemId)
      );
    },
    [setCurrentOrder]
  );

  const calculateTotal = useCallback(() => {
    return currentOrder.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  }, [currentOrder]);

  const clearOrder = useCallback(() => {
    setCurrentOrder([]);
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
