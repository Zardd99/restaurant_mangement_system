## Summary

<!-- What does this PR do and why? -->

## Changes

-

## Security checklist

- [ ] No secrets or `.env*` files committed
- [ ] No secrets placed in `NEXT_PUBLIC_*` env vars
- [ ] Route/UI access gated via `ProtectedRoute` / RBAC where applicable
- [ ] RBAC mirror (`app/config/rbac.ts`) kept in sync with the backend

## Verification

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test` passes
- [ ] Manual check of the affected screen(s)
