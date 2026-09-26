# JAO LAB Fashion & Styles

JAO LAB is a premium Nigerian fashion and lifestyle storefront with product discovery, wishlist, cart, checkout, installment messaging, customer order tracking, and an admin summary foundation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/jao-lab-fashion/src/App.tsx` — customer storefront routes and interaction state
- `artifacts/jao-lab-fashion/src/index.css` — JAO LAB visual tokens and responsive styles
- `lib/api-spec/openapi.yaml` — source of truth for catalog, wishlist, order, and admin contracts
- `artifacts/api-server/src/lib/catalog.ts` — realistic first-build catalog and sample order data
- `artifacts/api-server/src/routes/store.ts` — API handlers for storefront and admin summary surfaces

## Architecture decisions

- The web app uses generated OpenAPI hooks so a persistent database and auth provider can replace the sample API without changing the product surface.
- Guest cart and theme presentation state stay local for the first build; catalog, wishlist, order, and admin data flow through API hooks.
- Prices are represented as Nigerian Naira amounts throughout the contract and UI.

## Product

- Mobile-first shopping experience with responsive desktop layouts.
- Storefront discovery, filters, search, product variants, wishlist, cart, checkout, installment messaging, account, order history, tracking, auth screens, brand pages, and admin summary.

## User preferences

No additional preferences recorded.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI contract change.
- The API server currently uses in-memory sample data so the first build is immediately usable; persistent auth, storage, payments, and database wiring are the next production layer.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
