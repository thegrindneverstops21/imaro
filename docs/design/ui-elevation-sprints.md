# UI elevation sprint plan — HeroUI + Aceternity + Framer Motion

6 November 2026. Elevates the frontend inside `client/` only. Backend (`backend/src`) is untouched; all data continues to flow through `lib/api.ts` → `/api/v1` via RTK state. This plan sits on top of the completed guest-first sprints in `frontend-sprints.md`; it does not reopen their scope.

## 1. Current-state audit (verified in source)

| Area | What exists today | Gap this plan addresses |
| --- | --- | --- |
| Styling | Hand-written CSS: `client/src/styles/global.css` (2061 ln), `guest.css` (1402 ln), `account.css`, `staff.css`. No utility framework. | No design-token layer for HeroUI/Aceternity to merge into; palette is navy-led, not the brief's cream/brown. |
| Component library | Zero UI-library dependencies. Controls are raw `<button>`, `<select>`, `<input>`, `<details>`. | No accessible primitives for modals, dropdowns, date pickers, tables; admin screens hand-roll everything. |
| Motion | One restrained hero arrival animation in `guest.css`; `prefers-reduced-motion` honoured. | No scroll/hover micro-interactions on room galleries, bento sections, or booking transitions. |
| Booking hold | `holdExpiry.ts` classifies held/expiring/expired; `ReviewPage` polls every 15 s and shows "Held until …" text. | No synchronized countdown clock; expiry is only discovered on the next poll or failed request. |
| Pricing | `formatMoney` (ZAR, VAT-inclusive), `balanceLine` for `amountPaid`/`balanceDue`, `roomsNeeded` already on `RoomType`. | Presentation is correct but plain; no staggered/animated summary disclosure. |
| Occupancy | Guests 1–10, rooms 1–5 selects in `BrowsePage`; `validateStay` enforces dates/30-night max. | `roomsNeeded` is computed server-side and displayed, but never surfaced as an explicit "N rooms needed" hint at selection time. |

## 2. Hard dependency finding — read before Sprint A

`package.json` (repo root; there is no `client/package.json`) currently contains **no** Tailwind, HeroUI, Framer Motion, or Aceternity packages. Introducing them is itself a sprint-sized change:

- **HeroUI v2** requires Tailwind CSS + `tailwind-variants`/HeroUI provider setup and its own token system (`heroui()` plugin).
- **Aceternity UI** is copy-paste source (no npm package); its canonical components require `framer-motion`, `clsx`, `tailwind-merge`, `class-variance-authority`, and `motion` primitives.
- **Framer Motion** (now the `motion` package) is the shared animation engine for both.

Two viable paths — decision needed before Sprint A:

- **Path 1 (recommended): staged adoption.** Add Tailwind v4 + HeroUI + `motion` + Aceternity's four small deps in Sprint A, scoped behind new component files. Legacy CSS stays for checkout/admin until each surface migrates. Lowest regression risk; matches the "reviewable sprints" rhythm.
- **Path 2: full rewrite.** Port all 3,500+ lines of hand CSS to Tailwind tokens in one pass. Rejected as a first step — it invalidates the completed sprints' verified visual state and breaks the `sprint-*-review.md` evidence trail.

Also flag: the brief's palette (cream `#E2DAD1`, muted brown `#96775E`, slate, charcoal) differs from `DESIGN.md`'s locked navy `#16324f` + warm neutrals. **Open decision:** either map the new palette onto HeroUI tokens as an intentional rebrand (update `DESIGN.md`), or keep navy and treat the brief palette as accent-only. Recommend keeping navy for actions/text and adopting cream/brown as surface tones — but this must be confirmed before tokens are written.

## 3. Domain invariants every sprint must preserve

- All prices via `formatMoney` → ZAR, VAT-inclusive; `balanceLine` for paid/due; never re-derive totals client-side beyond the existing `room.totalPrice ?? pricePerNight × nights × roomsNeeded` fallback already in `BookingPage`/`RoomDetailsPage`.
- Dates stay `YYYY-MM-DD`; `localToday()`, `nextDay()`, `validateStay` in `client/src/lib/staySearch.ts` remain the single source of truth (check-in ≥ today, check-out > check-in, ≤ 30 nights).
- Guests 1–10, rooms 1–5; `roomsNeeded` surfaced from the API, not recomputed.
- Hold countdown derives from `booking.holdExpiresAt` (server timestamp), never a client-side duration assumption; the existing 15 s poll stays as the reconciliation path.
- API envelope stays `{ data }` / `{ error: { message, details } }` via `lib/api.ts`; no new fetch paths.
- `prefers-reduced-motion` disables all Aceternity/Framer entrances — this is already a DESIGN.md rule and must be enforced in the motion wrapper.
- Lint (`npm run lint`, `--max-warnings 0`) and `npm run typecheck` clean; all new props/state/API shapes fully typed.

## 4. Sprint breakdown

### Sprint A — Foundation: toolchain + design tokens (no visual change)

Goal: make HeroUI/Framer/Tailwind *available* without altering any rendered page.

- Update root `package.json`: add `tailwindcss` (v4), `@tailwindcss/vite`, `@heroui/react` (v2), `framer-motion` (or `motion`), `clsx`, `tailwind-merge`, `tailwind-variants`, `class-variance-authority`. Pin versions ≥7 days old.
- Create `client/src/styles/tokens.css` (Tailwind v4 `@theme` block): map Imaro tokens — navy `#16324f`, cream `#E2DAD1`, muted brown `#96775E`, slate, charcoal; Cinzel/Source Sans 3 stacks; spacing/radius scale matching current CSS.
- Create `client/src/lib/motion.ts`: shared `prefersReducedMotion` hook + fade/slide variants reused by every Aceternity-style component.
- Create `client/src/components/ui/` barrel for HeroUI re-exports themed to Imaro (Button, Input, Select, DatePicker, Modal, Table, Tabs, Chip).
- **Files:** `package.json`, `vite.config.mts`, `client/src/styles/tokens.css`, `client/src/styles/index.css` (Tailwind import), `client/src/lib/motion.ts`, `client/src/components/ui/index.ts`.
- **Done when:** `npm run check` passes; zero rendered diff on `/`, `/rooms`, `/stay`, `/review`, `/admin`; HeroUI `<Button>` renders correctly on a throwaway story/route only.

### Sprint B — Public guest surfaces (Aceternity + Framer Motion)

Goal: the Persuade-mode surfaces get the hospitality micro-interactions; Operate surfaces untouched.

- Landing hero (`client/src/features/browse/BrowsePage.tsx` + new `client/src/features/browse/HeroSection.tsx`): replace the single CSS arrival with a Framer stagger (photo scale/opacity, copy rise, CTA spring); keep the hero photo cache (`rememberedHeroPhoto`) and `overHero` header contract.
- Room catalogue (`BrowsePage` room grid → new `client/src/features/browse/RoomCard.tsx`): hover-sensitive card — image zoom, spec reveal, price emphasis; `whileHover`/`whileTap` via motion; unavailable state stays non-interactive.
- Room details gallery (`client/src/features/booking/RoomDetailsPage.tsx` → new `RoomGallery.tsx`): keyboard-navigable lightbox/grid with motion transitions between images.
- Amenities/hotel info (`client/src/features/browse/InformationSections.tsx`, `HotelInfoPage.tsx`): bento-grid layout for hotel amenities using Aceternity-style `BentoGrid`/`BentoCard` primitives (built locally in `client/src/components/aceternity/` — do not vendor the whole library).
- Scroll/section reveals on home sections; all gated by `prefersReducedMotion`.
- **Done when:** 390/768/1440px renders reviewed; keyboard + touch gallery works; reduced-motion shows static layouts; existing `frontend-sprints.md` Sprint-2 behaviours (draft-vs-submitted search, stale-response guards) still pass their tests.

### Sprint C — Booking journey (HeroUI forms + countdown)

Goal: Operate-mode checkout gets accessible controls and the missing hold clock.

- Guest details (`client/src/features/booking/BookingPage.tsx`): migrate form fields to HeroUI `Input`/`Textarea`/`Checkbox`/`Accordion` (policies); keep `guestDraft` Redux slice, `terms` consent gating, and `#cancellation-policy` anchor contract.
- Search bar (`BrowsePage` search form): HeroUI `Select` for location/guests/rooms and `DatePicker`/`RangeCalendar` for dates — must still emit `YYYY-MM-DD` strings and preserve the draft-vs-submitted distinction.
- **Hold countdown (new):** `client/src/features/booking/HoldCountdown.tsx` — computes remaining from `holdExpiresAt` with a 1 s interval, renders `MM:SS`, pulses/amber under 5 min (reuse `EXPIRING_WINDOW_MS`), flips to expired state at zero. Mount on `ReviewPage` inside `.stay-summary` and on `BookingReceipt`/`ManagePage` where `status === "held"`. The existing 15 s revalidation poll remains authoritative.
- `roomsNeeded` surfacing: when `draft.guests` exceeds room capacity, show "N rooms needed" hint near the guests/rooms selects in `BrowsePage` (read-only hint; server still computes).
- Payment summary disclosure: animate the `<details class="checkout-summary">` open/close with motion; keep mobile collapsible behaviour.
- **Done when:** countdown matches server expiry within ±1 s; expiry still triggers the existing expired panel + "Search rooms again" path; form validation messages unchanged; print stylesheet still hides interactive chrome on confirmation.

### Sprint D — Account + admin (HeroUI Operate surfaces)

Goal: dense operational screens get consistent accessible controls without guest-page motion.

- Admin (`client/src/features/admin/`): `ReservationsPanel`, `ReservationTable`, `BranchesPanel`, `RoomsPanel`, `RatesPanel`, `RecordEditor` → HeroUI `Table`, `Modal`/`Drawer` for editors, `Select`, `DatePicker`, `Chip` for status/payment badges. Keep `adminTypes.ts`, `useAdminWrites.ts`, `StaffGate` auth logic.
- Amounts: `Paid`/`Balance due` columns use `formatMoney`/`balanceLine` exactly as `ReservationTable` does today; status chips map from `status`/`paymentStatus` strings — no invented states.
- Account (`client/src/features/account/`): `AccountTabs` → HeroUI `Tabs`; `SignInPage`, `ProfileForm`, `MyBookings`, `SavedStays`, `NotificationBell` → HeroUI controls; keep `useAccountData` hooks and auth-intent flow (`signInLink`, `rememberSignInNext`).
- **Done when:** every admin mutation still round-trips through existing endpoints; destructive actions remain explicit confirmations; keyboard-navigable tables; no motion on admin surfaces beyond state transitions.

### Sprint E — Release verification

Goal: close the loop the earlier sprint plan left open.

- Route sweep: `/`, `/rooms`, `/room/:slug/:roomType`, `/hotel`, `/stay-information`, `/contact`, `/stay`, `/review`, `/confirmation`, `/booking`, `/manage`, `/payment/return`, `/payment/cancelled`, `/profile`, `/favorites`, `/login`, `/admin`, `*` 404.
- Gates: `npm run check` (lint + typecheck + vitest); production `vite build`; browser pass at 320/390/768/1440px; keyboard-only booking path; `prefers-reduced-motion` emulation; print preview of confirmation; hold-expiry path exercised against a held booking.
- Update `DESIGN.md`, `docs/progress.md`, and `docs/application-state.md` to record the new stack and any palette decision.

## 5. File map (new vs touched)

New shared files:

- `client/src/styles/tokens.css`, `client/src/styles/index.css`
- `client/src/lib/motion.ts`
- `client/src/components/ui/index.ts` (+ themed HeroUI wrappers)
- `client/src/components/aceternity/` (BentoGrid, Spotlight/Card, TextGenerateEffect-style primitives — built locally, typed)
- `client/src/features/browse/HeroSection.tsx`, `RoomCard.tsx`
- `client/src/features/booking/RoomGallery.tsx`, `HoldCountdown.tsx`

Touched existing files (by sprint): `package.json`, `vite.config.mts`, `client/src/app/App.tsx` (header/footer only if HeroUI nav adopted — optional), `BrowsePage.tsx`, `RoomDetailsPage.tsx`, `HotelInfoPage.tsx`, `InformationSections.tsx`, `BookingPage.tsx`, `ReviewPage.tsx`, `ManagePage.tsx`, `BookingReceipt.tsx`, `ConfirmationPage.tsx`, all of `features/admin/*` and `features/account/*` UI files, `styles/guest.css`/`account.css`/`staff.css` (progressively slimmed as surfaces migrate).

## 6. Risks and open decisions

1. **Palette conflict** — navy-locked `DESIGN.md` vs brief cream/brown. Resolve before Sprint A tokens.
2. **HeroUI v2 + Tailwind v4 + React 19** — verify peer compatibility at install time; React 19 support landed in HeroUI v2.6+/Tailwind v4 toolchain, but pin and smoke-test in Sprint A before building on it.
3. **CSS coexistence** — three legacy stylesheets plus Tailwind preflight will fight. Mitigate with layered `@import` order and per-surface migration; do not run both systems on the same element.
4. **Countdown accuracy** — must read `holdExpiresAt` (UTC) and render in the user's locale; add a vitest case for the mm:ss formatter and expiry boundary.
5. **Aceternity licence/maintenance** — components are vendored source; keep the local copies minimal and typed rather than copying the full registry.
