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
bun install
bun x convex dev
bun run dev
```

Convex generates `convex/_generated/` during `bun x convex dev`. Commit generated files when your development workflow requires repository typechecking without a live codegen step.

## Validation

```bash
bun install --frozen-lockfile
bun x convex codegen
bun run typecheck
bun run lint
bun test
bun run build
```

GitHub Actions runs the same validation sequence after dependency installation.

## Deployment

For production Convex deployment, configure `CONVEX_DEPLOY_KEY` and the Clerk issuer domain in the production Convex environment, then run `bun x convex deploy`. Vercel should receive `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as production environment variables.

The application is not a regulated bank by itself. Real-money operation requires the appropriate licensed banking/payment partners, KYC/AML provider, fraud controls, operational approvals and compliance review. The software intentionally refuses to claim those external services are active when their credentials/configuration are absent.
