# Imaro Hotel API

Node + Express + TypeScript + PostgreSQL. Base URL: `/api/v1`.

## Setup

1. `npm i`
2. `cp .env.example .env` and set `DATABASE_URL`
3. `createdb stillmere` and `createdb stillmere_test`
4. `npm run db:setup` (creates tables and seeds 3 branches, 36 rooms; wipes existing data)
5. `npm run dev`

Google sign-in needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a matching `GOOGLE_REDIRECT_URI` in Google Cloud OAuth credentials. Set a unique `SESSION_SECRET` (at least 32 characters) and comma-separated `ADMIN_EMAILS` for administrator access. The initial payment endpoint is simulated; it marks a live hold as paid and confirmed and must not be treated as a real payment provider.

## Scripts

| Script                         | What it does                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `npm run dev`                  | Start the API with reload                                                         |
| `npm run build` / `npm start`  | Compile to `dist/` and run it                                                     |
| `npm run lint`                 | ESLint, zero warnings allowed                                                     |
| `npm run typecheck`            | TypeScript, no emit                                                               |
| `npm test`                     | Unit + API tests; rebuilds `stillmere_test` first (`TEST_DATABASE_URL` overrides) |
| `npm run check`                | lint + typecheck + test                                                           |
| `npm run db:setup` / `db:seed` | Schema + seed / seed only                                                         |
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
| POST   | `/bookings` | JSON booking details | Creates a 15-minute room hold and returns the one-time manage token |
| GET    | `/bookings/:reference` | `x-booking-token` header | Reads a booking using its reference and manage token |
| POST   | `/bookings/:reference/cancel` | `x-booking-token` header | Cancels and releases a booking hold |
| POST   | `/bookings/:reference/payment/simulate` | `x-booking-token` header | Simulates successful payment and confirms the booking |
| GET    | `/bookings/admin/list` | Admin bearer token | Lists recent bookings for admins |

- Success: `{ "data": ... }`. Failure: `{ "error": { "message", "details?" } }`.
- Dates are `YYYY-MM-DD`. Check-in must not be in the past, check-out must be after check-in, and a stay is at most 30 nights.
- Guests are 1-10 and rooms are 1-5. When guests exceed a room's capacity, `roomsNeeded` increases.
- Prices are in rand and include 15% VAT.
- The database refuses overlapping bookings for the same room (`no_double_booking`).
- Response fields are camelCase.

## Structure

`domain/` pure rules, no I/O. `repositories/` SQL and database access only. `services/` orchestration. `routes/` HTTP only. `constants/` every shared value.

- `src/` — TypeScript API source and database migrations.
- `test/` — unit and API tests.
- `prototypes/stillmere-demo/` — self-contained static hotel prototype.
- `assets/design/` — design references and generated visual assets.
- `docs/design/` — briefs, moodboards, and prototype notes.
- `scripts/` — repository maintenance and design-build scripts.
