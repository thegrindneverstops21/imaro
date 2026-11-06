# Imaro Hotels

Current project notes: [application state](docs/application-state.md) and [user preferences](docs/preferences.md). Read these before implementing changes. The older Stillmere design documents remain visual references; the current brand is Imaro.

Development guidance: [coding guidelines](docs/coding-guidelines.md) and [React file structure](client/README.md).

Track completed and remaining work in [progress](docs/progress.md). Upcoming design work also follows the [hotel design guidelines](docs/design/HOTEL_DESIGN_GUIDELINES.md).

React + TypeScript + Redux Toolkit client with a Node + Express + TypeScript + PostgreSQL API. API base URL: `/api/v1`.

## Setup

1. `npm i`
2. `cp .env.example .env` and replace `YOUR_PASSWORD` in both database URLs with your PostgreSQL password (URL-encode special characters; do not include surrounding spaces).
3. `createdb imaro` and `createdb imaro_test`
4. `npm run db:setup` (creates tables and seeds 3 branches, 36 rooms; wipes existing data), or `npm run db:migrate` to add password-reset and availability-signup tables without wiping existing data
5. Start the API with `npm run dev`
6. In a second terminal, start the frontend with `npm run dev:client`

The frontend runs at `http://localhost:5173` and reads the API at `http://localhost:4000/api/v1`. Set `VITE_API_URL` to override the API URL at client build time. Keep `CLIENT_URL` in the API environment set to the frontend origin for Google OAuth redirects and CORS.

Restart the API after editing `.env`. `GET /api/v1/health` checks the database connection as well as the server. If it fails with PostgreSQL error `28P01` in the server logs, check the database credentials before investigating frontend requests. Do not rerun `db:setup` to fix authentication; it wipes existing data.

Google sign-in needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a matching `GOOGLE_REDIRECT_URI` in Google Cloud OAuth credentials. Password sign-in is also available, so Google is not required for the administrator flow.

The seeded local/demo administrator is:

| Field | Value |
|-------|-------|
| Email | `admin@imaro.local` |
| Password | `ImaroAdmin2026!` |

Use these credentials at `http://localhost:5173/login` after running `npm run db:setup`. This account is for local setup and submission review only; change or remove it before deploying to a shared or production environment. Set a unique `SESSION_SECRET` (at least 32 characters) and comma-separated `ADMIN_EMAILS` for administrator access to Google accounts. The initial payment endpoint is simulated; it marks a live hold as paid and confirmed and must not be treated as a real payment provider.

Password reset is available from the sign-in page. In development and test environments, the reset link opens directly in the browser because no email provider is configured; production requires wiring the reset token to an email delivery service.

## Scripts

| Script                         | What it does                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `npm run dev`                  | Start the API with reload                                                         |
| `npm run dev:client`           | Start the React client on port 5173                                               |
| `npm run build` / `npm start`  | Compile to `dist/` and run it                                                     |
| `npm run build:client`         | Type-check and build the React client to `dist/client/`                          |
| `npm run lint`                 | ESLint, zero warnings allowed                                                     |
| `npm run typecheck`            | TypeScript, no emit                                                               |
| `npm test`                     | Unit + API tests; rebuilds `stillmere_test` first (`TEST_DATABASE_URL` overrides) |
| `npm run check`                | lint + typecheck + test                                                           |
| `npm run db:setup` / `db:seed` / `db:migrate` | Schema + seed / seed only / additive schema changes |
| `npm run design:build`         | Generate the design-reference PNG/SVG assets                                     |

## Endpoints

| Method | Path                           | Query                                                                  | Returns                                                                                           |
| ------ | ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/health`                      |                                                                        | `{ status: "ok" }`                                                                                |
| GET    | `/branches`                    | `checkIn, checkOut, guests, rooms, roomType, minPrice, maxPrice, city` | Branches with `fromPrice` that still have a bookable room                                         |
| GET    | `/branches/:slug`              | `checkIn, checkOut, guests, rooms` (optional)                          | Branch details, images, amenities, policies, room types                                           |
| GET    | `/branches/:slug/availability` | `checkIn, checkOut` (required), `guests, rooms`                        | Room types with `availableRooms`, `roomsNeeded`, `canBook`, `nights`, `totalPrice`, `vatIncluded` |
| GET    | `/auth/google` | | Returns the Google OAuth authorization URL |
| GET    | `/auth/google/callback` | `code, state` | Exchanges the Google authorization code and returns a bearer session token |
| POST   | `/auth/register` | JSON `name, email, password` | Creates a password account and returns a bearer session token |
| POST   | `/auth/login` | JSON `email, password` | Signs in with a password and returns a bearer session token |
| POST   | `/auth/password-reset/request` | JSON `email` | Starts a password reset; development returns a reset token for local use |
| POST   | `/auth/password-reset/complete` | JSON `token, password` | Sets a new password using a valid, single-use token |
| POST   | `/branches/:slug/availability-notifications` | JSON `email` | Saves an email for availability updates for a published property |
| POST   | `/bookings` | JSON booking details | Creates a 15-minute room hold and returns the one-time manage token |
| GET    | `/bookings/:reference` | `x-booking-token` header | Reads a booking using its reference and manage token |
| POST   | `/bookings/:reference/cancel` | `x-booking-token` header | Cancels and releases a booking hold |
| POST   | `/bookings/:reference/payment/simulate` | `x-booking-token` header | Simulates successful payment and confirms the booking |
| GET | `/admin/bookings` | Admin bearer token; `limit, offset, status, paymentStatus, branchId, search, dateFrom, dateTo` | Filtered reservations and `pagination: { total, limit, offset }` |
| GET | `/admin/bookings/:reference` | Admin bearer token | Reservation, assigned room numbers, payment records, special requests |
| GET/POST | `/admin/branches` | Admin bearer token | Lists or creates branches |
| PATCH/DELETE | `/admin/branches/:id` | Admin bearer token | Updates a branch or unpublishes it |
| GET/POST | `/admin/branches/:branchId/rooms` | Admin bearer token | Lists or adds physical rooms |
| PATCH/DELETE | `/admin/rooms/:id` | Admin bearer token | Updates a room or marks it for maintenance |
| GET | `/admin/branches/:branchId/prices` | Admin bearer token | Lists room type prices for a branch |
| PUT/DELETE | `/admin/branches/:branchId/prices/:roomTypeId` | Admin bearer token | Sets or removes a branch room type price |
| POST/PATCH | `/admin/bookings/:reference/approve` or `/admin/bookings/:reference` | Admin bearer token | Approves a paid reservation or changes its dates/guest count |
| POST | `/admin/bookings/:reference/cancel` | Admin bearer token | Cancels a reservation and releases its room holds |

- Success: `{ "data": ... }`. Failure: `{ "error": { "message", "details?" } }`.
- Dates are `YYYY-MM-DD`. Check-in must not be in the past, check-out must be after check-in, and a stay is at most 30 nights.
- Guests are 1-10 and rooms are 1-5. When guests exceed a room's capacity, `roomsNeeded` increases.
- Prices are in rand and include 15% VAT.
- The database refuses overlapping bookings for the same room (`no_double_booking`).
- Admin branch and room delete actions are soft changes: branches are unpublished and rooms are marked for maintenance to preserve booking history.
- The PayFast sandbox integration is not present; the booking simulation endpoint remains the payment fallback.
- Booking create/read, admin list/detail, and modify responses expose `amountPaid` (sum of completed payments) and `balanceDue` (total minus amount paid, rounded to cents). A negative balance denotes overpayment; it is not an automatic refund. `paymentStatus` remains the payment lifecycle marker; use the numeric balance to determine the outstanding amount. Refund entries are separately visible in admin payment history.
- Admin list `search` is a case-insensitive literal substring across reference, guest name, and guest email. `dateFrom` and `dateTo` are inclusive bounds on the check-in date; either can be supplied alone. Dates must be real ISO dates and the range must be ordered. All filters apply to both the page and `pagination.total`; an offset beyond the last page returns an empty array with the full matching total.
- Admin detail adds `specialRequests`, `assignedRooms` (roomId, roomNumber, roomType, pricePerNight, active), and `payments` (id, provider, providerReference, amount, status, createdAt). Provider raw payloads and private booking credentials are excluded.
- The legacy public-router admin listing has been removed. Staff clients must use `/admin/bookings`.
- Response fields are camelCase.

## Structure

`domain/` pure rules, no I/O. `repositories/` SQL and database access only. `services/` orchestration. `routes/` HTTP only. `constants/` every shared value.

- `src/` — TypeScript API source and database migrations.
- `client/` — React, TypeScript, and Redux Toolkit booking client.
- `test/` — unit and API tests.
- `prototypes/imaro-demo/` — self-contained static hotel prototype; the React client is the API-connected experience.
- `assets/design/` — design references and generated visual assets.
- `docs/design/` — briefs, moodboards, and prototype notes.
- `scripts/` — repository maintenance and design-build scripts.
