# Security Policy

## Supported versions

The `main` branch and the current production deployment (Vercel) are supported.

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

- Email: lqykim275@gmail.com
- Or use GitHub's private **"Report a vulnerability"** (Security → Advisories).

Include: affected component, reproduction steps, impact, and any suggested fix.
We aim to acknowledge within 72 hours.

## Handling secrets

- Never commit `.env` / `.env.local` files. Production config lives in the
  **Vercel** dashboard (`NEXT_PUBLIC_API_URL` must include the `https://` prefix).
- Only `NEXT_PUBLIC_*` vars reach the browser — never put secrets there.
- Secret scanning (gitleaks) runs on every push/PR. If a secret is ever
  committed, **rotate it immediately**.

## Authentication & authorization

- This frontend mirrors the backend RBAC matrix in [app/config/rbac.ts](../app/config/rbac.ts)
  for UI gating only — the backend is the authoritative enforcement point.
- Route access is gated by `ProtectedRoute` and the `(admin)` layout guard.
  See the [RBAC access graph](../docs/rbac_access_control.md).
