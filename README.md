# Crestline Capital v3

Crestline Capital is a modern digital-banking application scaffold built with Next.js and Convex. The UI follows the supplied Bnk documentation: midnight/slate surfaces, electric-blue accents, responsive navigation, dashboard cards, accounts, transactions, card controls and security surfaces. fileciteturn0file0L5-L20

## Included

- Responsive public landing page and authentication interface
- Customer dashboard with checking and savings views
- Transaction history and account summaries
- Card freeze/unfreeze interaction
- Convex schema for users, accounts, transactions, immutable ledger entries, cards, transfers and notifications
- Convex mutations for dashboard reads, transfers and card state changes
- Safe demo seed data (no real money movement)

The source documentation calls for identity/KYC/AML, a core double-entry ledger, fraud detection, card/notification gateway, and the users/accounts/transactions/cards data model. Those are represented as the application architecture and Convex domain model; production integrations still require approved identity, banking, payment and compliance providers. fileciteturn0file0L49-L64 fileciteturn0file0L82-L103

## Run locally

```bash
npm install
npx convex dev
npm run dev
```

`npx convex dev` generates the `convex/_generated` bindings and supplies the Convex deployment URL. Do not commit secrets.

## Important

This repository is a software prototype/scaffold, not a licensed bank or payment processor. The demo transfer mutation changes simulated balances only. Before enabling real financial operations, add a production identity provider, server-side authorization, KYC/AML vendor, regulated banking/payment rails, audit controls, rate limiting, fraud controls, key management, monitoring and independent security/compliance review.
