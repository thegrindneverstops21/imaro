# Imaro Hotels

Imaro is a South African hotel booking application with guest discovery and checkout, personal accounts, and a staff console for managing reservations, properties, rooms, and rates.

**Project status:** Completed for project submission, as confirmed by the project owner on 16 November 2026. The implemented scope is summarised below; deployment and payment-provider verification are documented separately.

## Features

- **Guest experience:** Browse properties and room offers, select dates and guests, view availability and pricing, and book without creating an account.
- **Booking:** Guest details, a 15-minute room hold, review and payment, server-backed booking status, booking management, cancellation, and printable receipts.
- **Payments:** PayFast checkout and payment notifications. Verified payment moves a booking to pending staff approval; staff approval is a separate step.
- **Accounts:** Password registration and sign-in, Google sign-in, password reset, profile editing, booking history, saved stays, and notifications.
- **Reviews:** Public guest reviews, helpful reactions, and verified-stay review submission.
- **Administration:** Reservation filtering, approval, modification and cancellation; branch details and photos; physical room inventory and status; room types and nightly rates.
- **Email:** Resend integration for booking messages and password resets, enabled through server environment settings.

Prices are in South African rand (ZAR), including 15% VAT. The interface uses Cinzel headings, Source Sans 3 body text, and Hugeicons.

## Design and planning

These artefacts document the project's research, structure, and design process. Some retain the original **Stillmere** name; the final application brand is **Imaro**.

| Artefact | Link |
| --- | --- |
| Responsive working prototype | [View prototype](https://www.figma.com/make/UIemSGV1hESWfTwFzDPBon/Stillmere-Hotel-%E2%80%94-Responsive-Working-Prototype?code-node-id=1-5&t=JG4nQNN5bZscAExe-0&fullscreen=1) |
| Sitemap | [View sitemap](https://www.figma.com/board/cE85n146VLrakalQVDua0x/Stillmere-Hotel-%E2%80%94-Sitemap?node-id=0-1&t=zPmO9FfigMHPRw8R-1) |
| Mobile booking wireframes | [View wireframes](https://www.figma.com/design/MkeNn3PtdCYVfifTwNlWeO/Stillmere-Hotel-%E2%80%94-Mobile-Booking-Wireframes?node-id=0-1&t=MC6ynR1tVpafQ8dz-1) |
| Moodboard | [View moodboard](https://www.canva.com/design/DAHYEOM5GUw/LGlT0klsjxzsx2lV4qmxyg/edit?utm_content=DAHYEOM5GUw&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton) |
| Information architecture | [View information architecture](https://www.figma.com/board/0LLG4Ecd9Bf1blabzz7atO/Hotel-App-%E2%80%94-Administrator-Journey?node-id=10-188&t=t5KATf0n5fJAVjHz-1) |
| Admin user flow | [View admin user flow](https://www.figma.com/board/0LLG4Ecd9Bf1blabzz7atO/Hotel-App-%E2%80%94-Administrator-Journey?node-id=0-1&t=VHMj2K8hEKxvOyNr-1) |
| Guest user flow | [View guest user flow](https://www.figma.com/board/b5tPDjzzuTtcbNKDAEcJ4s/Hotel-App-%E2%80%94-Naledi-Guest-Journey?node-id=0-1&t=Ey9qRFJWJBgb7m7j-1) |
| User story | [View user story](https://www.canva.com/design/DAHX-yO0ZSw/-hxd1y_D8NdxKwkzA7eyVw/edit) |
| User persona | [View user persona](https://www.canva.com/design/DAHX9kARg2Y/AYJ452-P4sGagDUW84ljcQ/edit) |

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Redux Toolkit |
| Interface | Tailwind CSS, HeroUI, Framer Motion, Hugeicons |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Database | PostgreSQL with parameterised SQL through `pg` |
| Integrations | PayFast, Google OAuth, Resend |
| Checks | ESLint, TypeScript, Vitest, Supertest |

## Local setup

Install Node.js with npm and PostgreSQL. Run all commands from the repository root.

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`). Replace `YOUR_PASSWORD` in both database URLs with your URL-encoded PostgreSQL password and set a unique `SESSION_SECRET` of at least 32 characters.
3. Create separate databases: `createdb imaro` and `createdb imaro_test`.
4. For a **new, disposable local database**, run `npm run db:setup`. This drops existing tables and seeds demo data. For an existing database, inspect `backend/src/db/migration.sql` before using the additive `npm run db:migrate` command.
5. Start the API: `npm run dev`.
6. In a second terminal, start the frontend: `npm run dev:client`.

Open [the local application](http://localhost:5173). The API uses `http://localhost:4000/api/v1`; [its health endpoint](http://localhost:4000/api/v1/health) checks database connectivity.

Keep `CLIENT_URL=http://localhost:5173` and `VITE_API_URL=http://localhost:4000/api/v1` for local development. Restart the relevant servers after environment changes. PostgreSQL error `28P01` indicates invalid database credentials; do not rebuild the database to fix it.

### Demo administrator

The seeded account is for local demonstrations and submission review only:

| Field | Value |
| --- | --- |
| Email | `admin@imaro.local` |
| Password | `ImaroAdmin2026!` |

Sign in at `/login` after seeding. Change or remove this account before using a shared or production environment. Administrator access is enforced by the API.

### Optional integrations

- **Google sign-in:** Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`, with the same redirect URI registered in Google Cloud. `ADMIN_EMAILS` configures the administrator email allowlist. Password sign-in remains available.
- **PayFast:** Configure the merchant credentials and notify/return/cancel URLs. Follow [PayFast sandbox setup and acceptance checks](docs/payfast-sandbox.md). PayFast cannot send notifications to localhost; use a publicly reachable API or a tunnel for local sandbox testing. A checkout redirect alone does not prove payment.
- **Email:** Configure `RESEND_API_KEY` and an authorised `EMAIL_FROM` sender. Without an API key, email delivery is skipped. Development/test password reset also supports a direct reset-link flow.

Keep secrets in server environment settings, never in `VITE_` variables or source control.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with reload |
| `npm run dev:client` | Start the Vite client |
| `npm run build` | Compile the API to `dist/` |
| `npm start` | Run the compiled API |
| `npm run build:client` | Type-check and build the client to `dist/client/` |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Check backend, test, and client TypeScript |
| `npm test` | Run unit and API tests with database setup |
| `npm run check` | Run lint, type checks, and tests |
| `npm run db:setup` | Rebuild the database schema and seed demo data; destructive |
| `npm run db:migrate` | Apply additive schema changes |
| `npm run db:seed` | Write seed records |
| `npm run payfast:check` | Check PayFast configuration without printing secrets |

**Test database:** Every Vitest run, including filtered unit tests, rebuilds schema and seed data. Verify that `TEST_DATABASE_URL` points to a disposable database distinct from the development or deployed database. The example uses `imaro_test`.

## API overview

Routes use the `/api/v1` prefix. Normal success responses use `{ data: ... }`; failures use `{ error: { message, details? } }`. Health returns `{ status: "ok" }`, and the PayFast notification endpoint returns an empty response.

| Area | Routes |
| --- | --- |
| Health | `/health` |
| Properties and availability | `/branches`, `/branches/:slug`, `/branches/:slug/availability` |
| Authentication | `/auth/register`, `/auth/login`, `/auth/google`, `/auth/google/callback`, `/auth/password-reset/request`, `/auth/password-reset/complete` |
| Bookings | `/bookings`, `/bookings/:reference`, `/bookings/:reference/cancel` |
| Payments | `/bookings/:reference/payment`, `/payments/payfast/notify` |
| Account | `/me`, `/me/bookings`, `/me/favourites`, `/me/notifications` |
| Reviews | `/reviews`, `/reviews/:id/reactions`, `/bookings/:reference/review` |
| Administration | `/admin/bookings`, `/admin/branches`, `/admin/branches/:branchId/rooms`, `/admin/rooms/:id`, `/admin/branches/:branchId/prices` |

Sessions use bearer tokens. Guest booking access uses a private `x-booking-token` header; the signed-in booking owner can also access their booking. Staff routes require a database-backed administrator role.

Dates use `YYYY-MM-DD`, with checkout exclusive. Stays are limited to 30 nights, 1-10 guests, and 1-5 requested rooms; capacity may increase the calculated rooms needed. PostgreSQL prevents overlapping reservations for the same physical room. Branch deletion unpublishes a property, and room deletion marks it for maintenance to preserve booking history.

The simulated payment endpoint is restricted to development/tests. Refund accounting records and negative balances do not establish that a payment provider has returned funds.

## Repository structure

```text
backend/src/       Express API, authentication, validation, services and database
client/src/        React app, browse/booking/account/admin features and shared UI
test/              Unit and API tests
scripts/           Configuration diagnostics and maintenance scripts
docs/              Project checkpoints, design references and setup guidance
```

Backend responsibilities are separated into routes, validation, services, domain rules, repositories, and constants. See the [client structure guide](client/README.md) for frontend organisation.

## Project records and deployment

- [Application state](docs/application-state.md) records implementation checkpoints and verification evidence.
- [Progress log](docs/progress.md) preserves the development history and outstanding verification notes.
- [Project preferences](docs/preferences.md) and [coding guidelines](docs/coding-guidelines.md) document conventions.
- [Product brief](PRODUCT.md), [design direction](DESIGN.md), and [hotel design guidelines](docs/design/HOTEL_DESIGN_GUIDELINES.md) provide design context.
- [PayFast setup](docs/payfast-sandbox.md) documents hosted environment settings and payment acceptance checks.

The frontend and API are deployed separately: the API build does not serve the client. Configure hosted URLs in the hosting dashboards while retaining localhost settings for local development. Device photo uploads require persistent storage in a hosted environment.

Project completion does not imply that every historical test result applies to the current checkout or that live payment acceptance is verified. This README update checked source and configuration; it did not rerun application tests, browser flows, hosted payment notifications, or email delivery.
