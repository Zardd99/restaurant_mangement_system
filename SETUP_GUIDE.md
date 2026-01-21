# Ingredient Deduction Feature - Setup Guide

## Architecture Overview

This implementation follows Clean Architecture principles with strict separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  - WaiterOrderInterfaceV2.tsx (< 400 lines)        │
│  - IngredientImpactPreview.tsx (< 200 lines)       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                 ViewModel Layer                      │
│  - OrderViewModel.ts (< 250 lines)                  │
│  - Manages UI state only                            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Business Logic Layer                    │
│  - OrderManager.ts (< 300 lines)                    │
│  - IngredientDeductionService.ts (< 250 lines)     │
│  - Pure, testable, framework-independent            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                Repository Layer                      │
│  - IngredientRepository.ts (interface)              │
│  - APIIngredientRepository.ts (< 200 lines)        │
│  - OrderRepository.ts (interface)                   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                 Backend API                          │
│  - inventory-endpoints.ts (< 300 lines)             │
│  - Uses existing domain models                      │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
frontend/app/
├── core/
│   └── Result.ts                    # Result type for error handling
├── domain/
│   ├── managers/
│   │   └── OrderManager.ts          # Business logic for orders
│   └── services/
│       └── IngredientDeductionService.ts  # Ingredient operations
├── repositories/
│   ├── IngredientRepository.ts      # Interface
│   └── OrderRepository.ts           # Interface
├── infrastructure/
│   └── repositories/
│       └── APIIngredientRepository.ts     # API implementation
├── viewmodels/
│   └── OrderViewModel.ts            # UI state management
└── components/
    └── IngredientImpactPreview/
        └── IngredientImpactPreview.tsx    # Preview modal

backend/api/
└── inventory/
    ├── inventory-endpoints.ts       # API routes
    └── inventory.routes.ts          # Express router setup
```

## Step-by-Step Setup

### 1. Create Core Types

Create `app/core/Result.ts`:

```typescript
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

export const Err = <E = string>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
```

### 2. Backend Setup

#### a) Create Inventory Endpoints

Copy `inventory-endpoints.ts` to `backend/api/inventory/`

#### b) Create Express Routes

Create `backend/api/inventory/inventory.routes.ts`:

```typescript
import { Router } from "express";
import { InventoryEndpoints } from "./inventory-endpoints";
import { protect } from "../../middleware/auth";

const router = Router();
const endpoints = new InventoryEndpoints();

// All routes require authentication
router.use(protect);

// Ingredient availability check
router.post("/check-availability", endpoints.checkAvailability.bind(endpoints));

// Deduct ingredients (when order confirmed)
router.post("/consume", endpoints.consumeIngredients.bind(endpoints));

// Preview impact without deducting
router.post("/preview", endpoints.previewDeduction.bind(endpoints));

// Get stock level
router.get("/stock/:ingredientId", endpoints.getStockLevel.bind(endpoints));

// Get low stock alerts
router.get("/low-stock", endpoints.getLowStockAlerts.bind(endpoints));

export default router;
```

#### c) Register Routes in Main App

In `backend/server.ts`:

```typescript
import inventoryRoutes from "./api/inventory/inventory.routes";

// ... other imports

app.use("/api/inventory", inventoryRoutes);
```

### 3. Frontend Setup

#### a) Install all domain layer files from the artifacts above

#### b) Update Existing WaiterOrderInterface

You can either:

- Replace the existing file with `WaiterOrderInterfaceV2.tsx`
- Or add it as a new page and update your routing

#### c) Add to Navigation

In your navigation component:

```typescript
<Link href="/waiter-v2">
  <button>Take Order (v2 - With Inventory)</button>
</Link>
```

### 4. Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 5. Testing the Flow

#### Test 1: Preview Impact

1. Add items to cart
2. Click "Preview Ingredient Impact"
3. See which ingredients will be deducted
4. See warnings for low stock items

#### Test 2: Submit Order

1. Preview impact
2. Confirm order
3. Backend deducts ingredients
4. Frontend shows success + low stock warnings

#### Test 3: Insufficient Stock

1. Add items that exceed available stock
2. Preview impact
3. See error about insufficient ingredients
4. Order cannot be submitted

### 6. Backend Verification

Check ingredient deduction worked:

```bash
# Get low stock alerts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/inventory/low-stock

# Check specific ingredient stock
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/inventory/stock/INGREDIENT_ID
```

## Key Design Decisions

### 1. Separation of Concerns ✅

- **UI**: Only renders and handles user input
- **ViewModel**: Manages UI state, no business logic
- **Manager**: Enforces business rules
- **Service**: Handles ingredient-specific operations
- **Repository**: Abstracts data access

### 2. File Size Limits ✅

- No file exceeds 400 lines
- Most files under 300 lines
- Components under 200 lines

### 3. Dependency Direction ✅

```
UI → ViewModel → Manager → Service → Repository
(Outer layers depend on inner layers only)
```

### 4. Testability ✅

All business logic is:

- Pure functions
- Framework-independent
- Mockable dependencies
- Deterministic outputs

### 5. Error Handling ✅

- Uses Result type (no throwing across layers)
- Explicit error types
- Graceful degradation

## Business Logic Highlights

### OrderManager Responsibilities:

- ✅ Validate order data
- ✅ Calculate totals
- ✅ Coordinate ingredient checks
- ✅ Handle submission flow
- ❌ No UI state
- ❌ No navigation
- ❌ No API calls

### IngredientDeductionService Responsibilities:

- ✅ Check ingredient availability
- ✅ Calculate ingredient impact
- ✅ Deduct ingredients
- ✅ Preview without committing
- ❌ No UI concerns
- ❌ No order creation

### ViewModel Responsibilities:

- ✅ Manage loading states
- ✅ Handle errors for display
- ✅ Coordinate preview/submit
- ❌ No business rules
- ❌ No data transformation

## Common Issues & Solutions

### Issue: "Cannot find module Result"

**Solution**: Create `app/core/Result.ts` as shown above

### Issue: "Repository not found"

**Solution**: Ensure dependency injection in the component:

```typescript
const ingredientRepo = new APIIngredientRepository(API_URL, token);
```

### Issue: "Preview shows no impacts"

**Solution**: Check:

1. Menu items have ingredientReferences defined
2. Backend has ingredient data
3. API routes are registered

### Issue: "Order submits but ingredients not deducted"

**Solution**: Verify:

1. `/api/inventory/consume` endpoint is hit
2. InventoryManager is properly initialized
3. Database connection is active

## Next Steps

### 1. Add Real-time Updates

Use Socket.IO to notify when stock is low:

```typescript
socket.on("low_stock_alert", (data) => {
  // Show toast notification
});
```

### 2. Add Batch Operations

Allow multiple orders to be processed together:

```typescript
async submitBatch(orders: OrderSubmissionDTO[]): Promise<Result<...>>
```

### 3. Add Undo Feature

Track deductions and allow reversal:

```typescript
async undoDeduction(orderId: string): Promise<Result<...>>
```

### 4. Add Analytics

Track ingredient usage over time:

```typescript
async getIngredientUsageStats(days: number): Promise<Result<...>>
```

## Maintenance Checklist

- [ ] All files under 400 lines
- [ ] Business logic has no UI dependencies
- [ ] All dependencies point inward
- [ ] Error handling uses Result type
- [ ] Unit tests for Managers and Services
- [ ] Integration tests for Repositories
- [ ] API endpoints documented
- [ ] TypeScript strict mode enabled

## Support

For issues or questions:

1. Check this guide first
2. Review the architecture diagram
3. Verify file sizes and dependencies
4. Test in isolation (unit tests)
5. Check API endpoints with curl

## License

This implementation follows clean architecture principles and can be adapted for any similar business logic requirements.
