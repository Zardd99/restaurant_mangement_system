import { useEffect, useCallback, useRef } from "react";
import { createEmailJSNotificationService } from "../services/emailjsNotificationService";
import { IngredientStock } from "../types/inventory";

export const useInventoryAlerts = () => {
  const emailService = useRef(createEmailJSNotificationService());
  const previousAlerts = useRef<Set<string>>(new Set());

  const sendLowStockAlerts = useCallback((ingredients: IngredientStock[]) => {
    const lowStockItems = ingredients.filter(
      (ing) => ing.isLowStock || ing.needsReorder,
    );

    // Only send alerts for new low stock items
    const newAlerts = lowStockItems.filter(
      (item) => !previousAlerts.current.has(item.id),
    );

    if (newAlerts.length > 0) {
      const alerts = newAlerts.map((ing) => ({
        ingredientId: ing.id,
        ingredientName: ing.name,
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        unit: ing.unit,
        reorderPoint: ing.reorderPoint,
        costPerUnit: ing.costPerUnit,
      }));

      emailService.current.sendLowStockAlert(alerts).catch(console.error);

      // Update previous alerts
      newAlerts.forEach((item) => previousAlerts.current.add(item.id));
    }

    // Remove items that are no longer low stock
    Array.from(previousAlerts.current).forEach((itemId) => {
      const item = ingredients.find((i) => i.id === itemId);
      if (item && !item.isLowStock && !item.needsReorder) {
        previousAlerts.current.delete(itemId);
      }
    });
  }, []);

  const sendReorderConfirmation = useCallback(
    (
      ingredientName: string,
      reorderId: string,
      quantity: number,
      estimatedCost: number,
    ) => {
      emailService.current
        .sendReorderConfirmation(
          ingredientName,
          reorderId,
          quantity,
          estimatedCost,
        )
        .catch(console.error);
    },
    [],
  );

  return {
    sendLowStockAlerts,
    sendReorderConfirmation,
  };
};
