# Imaro Hotel API

Node + Express + TypeScript + PostgreSQL. Base URL: `/api/v1`.

## Setup

1. `npm i`
2. `cp .env.example .env` and set `DATABASE_URL`
3. `createdb stillmere` and `createdb stillmere_test`
4. `npm run db:setup` (creates tables and seeds 3 branches, 36 rooms; wipes existing data)
5. `npm run dev`

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

## Endpoints

| Method | Path                           | Query                                                                  | Returns                                                                                           |
| ------ | ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/health`                      |                                                                        | `{ status: "ok" }`                                                                                |
| GET    | `/branches`                    | `checkIn, checkOut, guests, rooms, roomType, minPrice, maxPrice, city` | Branches with `fromPrice` that still have a bookable room                                         |
| GET    | `/branches/:slug`              | `checkIn, checkOut, guests, rooms` (optional)                          | Branch details, images, amenities, policies, room types                                           |
| GET    | `/branches/:slug/availability` | `checkIn, checkOut` (required), `guests, rooms`                        | Room types with `availableRooms`, `roomsNeeded`, `canBook`, `nights`, `totalPrice`, `vatIncluded` |

- Success: `{ "data": ... }`. Failure: `{ "error": { "message", "details?" } }`.
- Dates are `YYYY-MM-DD`. Check-in must not be in the past, check-out must be after check-in, and a stay is at most 30 nights.
- Guests are 1-10 and rooms are 1-5. When guests exceed a room's capacity, `roomsNeeded` increases.
- Prices are in rand and include 15% VAT.
- The database refuses overlapping bookings for the same room (`no_double_booking`).
- Response fields are camelCase.

## Structure

`domain/` pure rules, no I/O. `repositories/` SQL and database access only. `services/` orchestration. `routes/` HTTP only. `constants/` every shared value.
