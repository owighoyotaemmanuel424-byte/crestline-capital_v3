# Crestline Capital v3

Crestline Capital is a production-oriented digital banking application built with Next.js, Clerk and Convex. The interface follows the supplied Bnk product direction while the backend enforces authenticated ownership, RBAC, transactional ledger writes, transfer idempotency, fraud evaluation, KYC review, notifications and immutable audit records.

## Backend capabilities

- Clerk JWT authentication validated by Convex
- Canonical user provisioning keyed by authenticated subject
- Customer/support/operator/compliance/admin roles enforced inside Convex functions
- Account ownership checks on every customer-sensitive query/mutation
- Checking accounts and account-number lookup
- Atomic internal Crestline-to-Crestline transfers
- Transfer state machine: initiated/review/processing/completed/failed/cancelled
- Idempotency keys and transfer rate limiting
- Double-entry ledger entries for settled internal transfers
- Deterministic server-side fraud/risk scoring with configurable threshold storage
- KYC submission and manual-review workflow; no automatic fake verification
- In-app notification persistence and deduplicated delivery records
- Immutable audit-log table with restricted read access and no user mutation API
- RBAC-protected operations portal for KYC and transfer review
- Card freeze/unfreeze with ownership and audit enforcement

## External integrations

KYC, regulated payment rails and outbound email/SMS are behind explicit provider interfaces. The repository does not fabricate external provider success. Until real provider credentials/configuration are supplied, KYC remains a manual-review boundary and external settlement is not reported as completed.

Required production configuration is documented in `.env.example`. Secrets must be stored in Convex/Vercel/GitHub secret stores and never committed.

## Development

```bash
bun install --no-frozen-lockfile
bun x convex dev
bun run dev
```

`convex/_generated/` contains a small runtime compatibility layer so the repository can typecheck without a remote Convex deployment. A normal authenticated `bun x convex dev`/`bun x convex deploy` may regenerate the directory with schema-specific bindings for stronger editor-level API typing.

## Validation

```bash
bun install --no-frozen-lockfile
bun run typecheck
bun run lint
bun test
bun run build
```

CI uses the same validation sequence with read-only repository permissions. The workflow intentionally does not mutate or commit lockfiles during a build.

## Deployment

For production Convex deployment, configure `CONVEX_DEPLOY_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, and the provider secrets in the production environment, then run `bun x convex deploy`. Vercel is configured to deploy Convex and build Next.js atomically; it requires the production Convex deploy key and frontend environment variables.

The application is not a regulated bank by itself. Real-money operation requires the appropriate licensed banking/payment partners, KYC/AML provider, fraud controls, operational approvals and compliance review. The software intentionally refuses to claim those external services are active when their credentials/configuration are absent.
