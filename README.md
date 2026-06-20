# Restaurant Management System — Frontend

Next.js 16 frontend for a multi-role restaurant operations platform. Employee-only system — no customer-facing portal.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:3000
```

Requires the backend API running on port 5000. See [backend setup](../backend_restaurant/README.md).

### Environment

Create `.env.local` in this directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For ngrok / remote tunnels, swap in the tunnel URL.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| UI | React 19.2.4 + TypeScript 6.0.3 |
| Styling | Tailwind CSS 4 |
| Real-time | Socket.io-client 4.8.3 |
| HTTP | Axios 1.13.5 |
| Forms | React Hook Form 7.71.1 |
| Charts | Chart.js + react-chartjs-2 |
| Icons | Lucide React |
| Auth | JWT via js-cookie |
| Testing | Jest + React Testing Library |

## Commands

```bash
npm run dev          # development server (Turbopack)
npm run build        # production build
npm run lint         # ESLint
npm run test         # Jest single run
npm run test:watch   # Jest watch mode
npm run test:coverage
```

## Roles

| Role | Dashboard | Orders | Billing | Inventory | Users |
| --- | --- | --- | --- | --- | --- |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ |
| Waiter | — | ✓ | ✓ | — | — |
| Chef | — | KDS only | — | — | — |
| Cashier | — | — | ✓ | — | — |

## Key Routes

| Path | Purpose |
| --- | --- |
| `/dashboard` | Menu management (admin/manager) |
| `/analytics` | Revenue and kitchen analytics |
| `/waiter_order` | Order taking + Kitchen Display System |
| `/billing` | Payment tracking and receipt printing |
| `/inventory/IngredientStockDashboard` | Stock levels and low-stock alerts |
| `/schedule` | Staff shift scheduling |
| `/users` | User and staff management |
| `/promotions` | Discounts and promotion rules |
| `/chef_special` | Chef's featured items |
| `/profile` | User profile editor |
| `/settings` | Theme, notifications, kitchen display prefs |
| `/notifications` | Notification centre |
| `/help` | FAQ, contact form, role tips |

### Hidden / Utility Routes

These routes are not linked from the sidebar but are accessible directly:

- `/inventory/IngredientDeductionPreview` — Preview ingredient impact before confirming an order

## Project Structure

```
app/
├── (admin)/          # Admin & manager pages
├── (auth)/           # Login / register
├── (user)/           # Shared staff pages (profile, chef_special)
├── (waiter_order)/   # Waiter order interface + KDS
├── billing/          # Billing & payments
├── help/             # Help & support
├── notifications/    # Notification centre
├── settings/         # App settings
├── application/      # Use cases, managers, coordinators
├── contexts/         # React Context providers
├── core/             # Result<T,E> type
├── domain/           # Entities & repository interfaces
├── hooks/            # Custom React hooks
├── infrastructure/   # Axios-based repository implementations
├── lib/              # Sidebar config, MongoDB client
├── presentation/     # Components & view models
├── services/         # Email, inventory, promotions
└── types/            # Global TypeScript types
```

## Architecture

Clean Architecture with four strict layers: Presentation → Application → Domain → Infrastructure. See [RESTAURANT_WEB_APP_DOCUMENTATION.md](./RESTAURANT_WEB_APP_DOCUMENTATION.md) for full details.

## Documentation

| File | Contents |
| --- | --- |
| [RESTAURANT_WEB_APP_DOCUMENTATION.md](./RESTAURANT_WEB_APP_DOCUMENTATION.md) | Full frontend reference: contexts, hooks, components, patterns, data flows |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Ingredient deduction feature setup |

## Branching

- `main` — production
- `feature/<description>` — feature work
- `bugfix/<description>` — bug fixes

Always create a branch before starting work. PRs go against `dev`.
