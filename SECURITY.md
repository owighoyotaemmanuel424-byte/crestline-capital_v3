# Security Policy

## Scope

Crestline Capital v3 is a production-oriented application codebase. Security issues should be reported before public disclosure so they can be assessed and remediated safely.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner or maintainers. Include:

- A clear description of the issue
- Affected route, component, or backend function
- Reproduction steps or a minimal proof of concept
- Security impact and affected roles, if known
- Any suggested mitigation

Do not include real customer data, credentials, API keys, private tokens, or other secrets in a report.

## Secrets

Never commit production credentials. Use the deployment platform's secret/environment-variable facilities. The repository's `.env.example` contains variable names only.

If a secret is accidentally committed, treat it as compromised immediately: revoke/rotate it at the provider, remove it from active configuration, and then clean the repository history where appropriate.

## Financial safety boundary

The application must not be treated as evidence that regulated banking or payment-rail services are active. Production real-money functionality requires appropriate licensed partners, provider credentials, KYC/AML controls, operational approvals, reconciliation, monitoring, and compliance review.

Changes that affect authentication, authorization, account ownership, ledger integrity, fraud controls, or transaction state transitions require focused security review and regression testing before deployment.

## Dependency and deployment hygiene

Run the repository validation commands before deployment:

```bash
bun install --no-frozen-lockfile
bun run typecheck
bun run lint
bun test
bun run build
```

Keep CI credentials read-only where possible and never expose secret values in build logs.