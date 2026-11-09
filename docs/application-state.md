# Imaro application state

## Local API CORS - 9 November 2026

Development CORS now accepts localhost and loopback origins on any port, allowing Vite to use either 5173 or an alternate port such as 5174 when the default is occupied. Production remains restricted to the configured `CLIENT_URL`.

## Google and PayFast checkout refinement - 9 November 2026

Added the Google brand mark to both Google sign-in actions. PayFast development checkout now reports a clear configuration error when local callback URLs are used instead of allowing the sandbox processor to return an opaque 400 error.

Local PayFast testing still requires a public HTTPS tunnel for notify, return, and cancel URLs. Hosted deployment values remain separate from local `.env` values.

## Booking hold database repair - 9 November 2026

Applied the existing additive migration to the development database. The booking insert had been failing because the database lacked the billing address columns already defined in the current schema and migration. No destructive schema reset was used.

Verification: a real local `POST /api/v1/bookings` returned 201 after migration, and all 29 booking API tests passed.

## Guest checkout validation - 9 November 2026

Guest Details consent now uses a native required checkbox so the visible checked state and shared form validator stay aligned. Checkout validation failures use a focused modal with a clear return-to-form action instead of an inline block.

Verification: client TypeScript and targeted ESLint passed. Browser verification remains pending.

## Guest reviews — 8 November 2026

- `GET /api/v1/reviews` returns all published reviews across branches (`{ data, meta: { total, ratingAverage, limit, offset } }`); each item includes rating, comment, first name only, branch slug/name, `helpfulCount`, and `reacted` for the signed-in viewer. `POST /api/v1/reviews/:id/reactions` requires sign-in and toggles the caller's "helpful" reaction (`{ reacted, helpfulCount }`).
- New `review_reactions` table (one row per review per user) exists in `schema.sql` and `migration.sql`; run `npm run db:migrate` on existing databases. Review creation is unchanged: verified completed stays only, via `POST /bookings/:reference/review`.
- Frontend: `client/src/features/reviews/ReviewsPage.tsx` at `/reviews` (nav and footer links), paginated 25 per page, star display, branch links to `/hotel?branch=`, and a Helpful toggle that sends signed-out users through `/login?next=/reviews`. `lib/api.ts` gained `requestPage` for endpoints whose `meta` is needed.

## Registration and checkout update — 8 November 2026

- The “Create an account” action on the sign-in screen opens a single-page modal instead of switching the page into a registration form. The modal uses a compact responsive grid and does not provide an internal scroll area.
- Password registration now collects only full name, email, and an eight-character password, with Google as the primary alternative. Validation messages identify the field that needs attention.
- User profiles expose name and optional phone only. Phone remains required when placing a booking, so it is collected then when an account does not already have one.
- Authenticated room checkout pre-fills the account profile and skips the manual guest-detail form when complete. “Booking for someone else?” reopens the editable form. Signed-out guests retain the expanded form and a direct “Sign in to speed up checkout” option.
- Legacy nullable billing-address columns remain in the database for compatibility, but signup, profile, and checkout no longer collect or require home address details.
- Backend/client TypeScript checks passed after the simplification. Lint still reports unrelated pre-existing errors in image upload and admin validation files.

## Current source checkpoint — 6 November 2026

This checkpoint supersedes older current-status summaries below. Historical test/build/browser results remain evidence for those earlier revisions only; they do not verify the latest component migration. This update inspected source only and ran no tests, builds or browser checks, following the user's usage preference.

- Guest-first sprints 0–5 have their principal screens implemented. Original review records remain historical; release acceptance (Sprint 6) is still open.
- UI elevation is partially implemented: Tailwind v4/Vite, HeroUI provider and exports, Framer Motion, hero/cards/reveals/bento amenities, room gallery, checkout controls/summary, account tabs/profile inputs and reservation status chips are wired into existing pages. See [UI elevation status](design/ui-elevation-sprints.md) for exact scope and remaining work.
- Recent repairs are implemented: branch selection uses the URL; legacy native control/label styles exclude marked HeroUI controls; mobile search layout targets direct field wrappers; checkout requires consent; Review uses one one-second clock for countdown and expiry with a click-time payment guard.
- Receipt countdown wiring now supplies the required live `now` prop, matching the Review flow. Typecheck and lint pass after the repair.
- PayFast checkout works according to the user's report. Public HTTPS callback/ITN verification and deployment remain unverified in this checkpoint; checkout success alone does not establish webhook completion.
- Next: manually verify branch Back/Forward/refresh and mobile search/checkout controls, then review the remaining elevation scope.


## Admin and discovery update - 6 November 2026

Password sign-in is available for the seeded local/submission administrator (`admin@imaro.local`); Google OAuth is not required for the admin demo path. The credential is seeded in `backend/src/db/seed.sql`, documented in `README.md`, and must be changed or removed before shared deployment.

Published branches now appear in public discovery without room inventory or rates. Dated, room-type, and price-filtered searches still require matching availability. The guest browse page communicates the distinction between a published property that is not yet bookable and a property whose rooms are unavailable for the selected stay.

Current usability assessment: guest browsing and booking states are reasonably clear, and admin onboarding now has a readiness checklist with direct navigation to missing publish, room, or rate steps. Guest browse and hotel-information empty states now provide distinct explanations and recovery links; not-yet-bookable properties expose contact actions and availability notification signup. Password reset is implemented with a local/test reset-link flow; production email delivery remains a deployment task. See the admin and guest investigations for evidence and next steps.

## Sprint 3 update - 5 November 2026

Guest details, review/payment, payment return and confirmation now use the guest visual system. Drafts persist in memory across room/date navigation. Server amounts are rechecked before payment; terminal states are distinct. Full check: 198 tests passed. Fixture browser checks do not establish live PayFast verification. Manage booking and rendered print output remain pending. See docs/design/sprint-3-review.md.

## Current frontend checkpoint — 5 November 2026

Sprints 1 and 2 are implemented and browser-reviewed; Sprint 3 (booking journey) is in progress: guest-details presentation now follows HOTEL_DESIGN_GUIDELINES.md sections 8-10, with readable controls, a collapsible mobile summary and policies before consent. Remaining checkout screens and behavior checks are pending. Mobile booking access is now in the sticky header, replacing the bottom overlay. Browse uses draft search fields, submitted Redux stay state and cancellable requests; invalid/expired persisted dates recover through client/src/lib/staySearch.ts. Catalogue sorting and one location-level save control are implemented. Room details have accessible gallery controls, a clearer summary and policies; on mobile the summary follows the gallery.

Verification: npm run check passed with 191 tests in 19 files, client production build passed, and live browser checks covered search submission/totals, sorting, navigation, gallery keyboard/thumbnail interaction and policy disclosure. See docs/design/sprint-2-review.md for visual checks and limitations. No backend source or payment behavior changed. Historical entries below describe earlier checkpoints and may be superseded by this section.

Last updated: 3 November 2026.

## Current implementation

The application has a React + TypeScript + Redux Toolkit client in `client/` and an Express + TypeScript + PostgreSQL API in `backend/src/`. The client runs on port 5173 and uses `VITE_API_URL`, defaulting to `http://localhost:4000/api/v1`.

The frontend contains browse/location selection, room details, guest details, review and simulated payment, server-backed confirmation, reservation lookup, cancellation, Google sign-in/profile, and a role-gated staff console. Staff screens call the existing reservation, branch, room, and price endpoints. Favorites currently save locations in browser storage, even though some UI copy refers to rooms.

The guest design follows the older hotel design documents: photographic hero, date/guest/room controls, room cards, house rules, and editorial hotel sections. The current brand is **Imaro**, not Stillmere. Headings use Cinzel and body text uses Source Sans 3. Interface symbols use a shared Hugeicons wrapper in `client/src/components/Icon.tsx`.

The React client uses feature folders for browse, booking, account, and admin pages. App setup and Redux live in `app/`; shared transport and formatting live in `lib/`; API types live in `types/`; styles live in `styles/`. See `client/README.md` for the file map. Backend code lives in `backend/src/`.

## Module map — 6 November 2026

Paths below are relative to `client/src/features/`.

- `admin/AdminPage.tsx` composes the staff workspace; `StaffGate.tsx` handles session-checking, sign-in and admin-role access states.
- Admin views live in `ReservationsPanel.tsx`, `BranchesPanel.tsx`, `RoomsPanel.tsx` and `RatesPanel.tsx`, with shared `ReservationTable.tsx` and `RecordEditor.tsx` components. The `useAdminBranches`, `useBranchInventory` and `useReservations` hooks load data; `useAdminWrites` coordinates writes, with reservation, branch, room and rate action hooks handling their respective mutations.
- `booking/BookingReceipt.tsx` renders receipt details; `booking/useManagedBooking.ts` manages lookup, saved tokens and cancellation state.
- `account/AccountState.tsx` shares loading, error/retry and empty-state rendering across account lists.
- `browse/useBranchInfo.ts` exports `useBranchInformation`, which loads branch information and supplies loading, error and retry state to `HotelInfoPage`.

Static deployment: `client/public/_redirects` supplies the SPA fallback for hosts supporting this format, including direct booking and payment-return links. The client build copies it to `dist/client/_redirects`. Other hosts need an equivalent rewrite configured in their own format.

## API integration

- Browse and room detail: `GET /branches` and `GET /branches/:slug` with stay parameters.
- Booking hold: `POST /bookings`; the client keeps the returned manage token locally.
- Reservation lookup, cancellation, and simulated payment use the booking reference and `x-booking-token` header.
- Authentication uses `/auth/register`, `/auth/login`, `/auth/google` and `/auth/me`.
- Staff screens use the existing admin endpoints. Content publishing/CMS is not implemented in these screens.

Older seed records still contain Stillmere names. Guest display text uses `displayBrand` for legacy branch names and policy copy. Identifiers and API payloads remain unchanged. No database reseed or stored-record migration was performed for this branding pass. Staff editing continues to show stored names.

## Verification and limits

- The preceding design pass passed ESLint and the client production build.
- Browse API connectivity is verified after the user replaced the placeholder database credentials locally and the API was restarted. Health, dated branch search, and branch details return HTTP 200. Browser room cards, rates, policies, and switching from Polokwane to Pretoria were verified. End-to-end booking transactions remain unverified.
- Payment is simulated. PayFast is not connected.
- Dining currently points to a promotional section, not a completed dining page. Some other brief requirements, including detailed galleries and a complete confirmation receipt, still need review.
- This is a work in progress. The user has requested incremental visual changes rather than a further broad redesign.

## Latest change

Browse fix verified: the user configured database credentials privately in `.env`. Confirmed a read-only connection to the existing `imaro` database and its branch table, then restarted the API on port 4000. No reset or reseed was needed. The original cause was PostgreSQL authentication error `28P01` from placeholder credentials. Example URL formatting and setup/restart instructions were corrected in the preceding step.

Verification: `/api/v1/health`, dated `/api/v1/branches`, and dated `/api/v1/branches/polokwane` returned HTTP 200 for 2â€“3 November 2026, two guests, one room. Search returned three branches; Polokwane details returned Classic, Deluxe, and Suite availability and totals. Browser inspection confirmed room cards, house rules, and location switching to Pretoria with its different rates. The API remains running for the preview. No application-code changes or booking writes were needed; the test suite was not rerun for this configuration fix.

### Page-list planning

Planning checkpoint: the user approved six guest pagesâ€”Home, Rooms & Suites, Room Details, Our Hotel, Stay Information, and Contactâ€”with Dining inside Our Hotel initially. The user also approved four booking pages: Guest Details, Review & Payment, Booking Confirmation, and Manage Booking. Dates and room selection remain in the guest room pages. Recorded in preferences and progress. Account scope is recorded below. Admin pages are also agreed: Reservations (landing), Branches, Rooms, and Prices. The initial 18-page list is complete as a plan; this does not mean the pages are implemented. No runtime changes or code checks in this planning step.

### Core booking journey implementation

Implemented Room Details â†’ Guest Details â†’ Review & Payment â†’ Confirmation. Room cards now open a dedicated room details screen with a real-image gallery; guest details create the existing 15-minute server hold; review reads that hold with its private token and calls the existing simulated payment endpoint; confirmation reloads the booking from the server and presents the reference, stay, guest, payment, total, print action, and manage-booking link. No payment provider or new API contract was added.

Verification: `npm run build:client` and `npm run lint` passed. On 1 November 2026, the live browser journey used Polokwane Classic for 2â€“3 November 2026: room details loaded, a real 15-minute hold was created, the server-backed review showed guest and total data, simulated payment returned the confirmation screen with payment status `paid` and status `pending_approval`, and Manage Booking reopened the reservation. An invalid private token produced the accessible `Booking not found` alert. Hold expiry, room conflicts, cancellation, and print output were not tested.

### Room gallery implementation

The Room Details screen now uses the API-provided image array with accessible thumbnail buttons and previous/next controls. The selected image, thumbnail state, and existing booking summary remain on the same page; no image data was invented.

Verification: client type-check passed with `npx tsc -p tsconfig.client.json --noEmit`; the gallery component passed ESLint; browser inspection confirmed three real room images and thumbnail selection changing the main image. A full production build and repository lint were attempted but Node exited with an environment out-of-memory error during validation.

### Checkout policy presentation

Guest Details now exposes the branch's API-provided policies in an accessible disclosure section before the user continues. The existing required cancellation acknowledgement remains separate; no policy text was invented or changed. Review & Payment continues to use the booking response's server-backed cancellation summary because that response does not include the full branch policy list.

Verification: client type-check and targeted ESLint passed. Browser inspection of Polokwane Guest Details confirmed the four policy disclosures: Check-in and check-out, Smoking, Cancellation, and Prices and payment.

### Booking edge-case verification

The targeted booking API suite passed all 30 tests, including insufficient-room conflicts, concurrent last-room protection, cancellation and room release, invalid access, hold expiry handling, and simulated payment status transitions. The live API health endpoint returned HTTP 200. The confirmation page renders the Print confirmation control, but native print-dialog automation timed out; print output remains unverified.

### Earlier documentation checkpoint

Account planning update: the user accepted My Profile and Saved Stays and required registration with personal details instead of mandatory Google. Planned account pages are Sign In, Sign Up, My Profile, and Saved Stays. Email/password registration and sign-in are implemented through the sign-in/create-account form and API endpoints alongside optional Google OAuth; guest checkout remains available. API tests passed in the reported audit. Password recovery remains outside this implementation. Admin page agreement is recorded above.

Documentation checkpoint: added `docs/progress.md`, read `docs/design/HOTEL_DESIGN_GUIDELINES.md` in full, and recorded Modern Serif as the user's locked font choice. The exact font asset/source remains to be identified. The UI still uses Cormorant Garamond and Inter; no runtime files were changed in this step. No code checks were rerun for this documentation-only change.

### Previous implementation step

Organized the React client by feature, separated booking/manage and account pages into individual files, and moved the shared error helper out of the app component to remove circular page imports. API contracts and page behavior were preserved.

Added `docs/coding-guidelines.md`: prefer the fewest lines of simple, readable code; avoid complex functions and unnecessary abstractions. The preferences document records this direction.

Validation: ESLint and the client production build passed after restructuring. Checked homepage rendering and navigation to the extracted manage-reservation page in the browser, then returned to the homepage. The existing browse API error remains; no live booking transaction was verified in this structural pass.

## Next work

Next work is optional refinement of the remaining design gaps: duplicate browser submission and print output verification. Follow the hotel design guidelines and latest preferences. PayFast remains unconnected and payment is explicitly labelled simulated; hold expiry, room conflicts, and cancellation are covered by the API suite.


## Backend audit repairs — 3 November 2026

Implemented and verified against the isolated test database:

- Branch PATCH preserves omitted publication and check-in/out fields. Database uniqueness conflicts return 409; invalid foreign keys return 400; missing mutation targets return 404.
- Reservation edits reject started stays and excess guests, preserve booked nightly rates, recalculate totals, and allocate available replacement rooms transactionally. Insufficient availability rolls back both the booking and its allocation. Expired holds are swept before modification.
- Admin cancellation shares guest cancellation rules, refuses started stays, updates payment status, releases rooms, and persists the simulated refund and fee in the payment ledger. Refunds use recorded completed payments, so extending a stay cannot inflate its refund. Guest cancellations also persist this ledger entry.
- Added admin-only GET /api/v1/admin/bookings with limit (1–100), offset, status, paymentStatus, and branchId filters. Response contains data and pagination (limit/offset). GET /api/v1/admin/bookings/:reference returns booking details without the private token/hash. The compatibility listing existed at this checkpoint; it is removed by the subsequent admin contract completion below.
- Maintenance and room-type changes reject active current/future reservations. Allocation locks room records to coordinate with those edits. Removed the admin status type casts and replaced literal domain statuses with constants.
- Restored readable schema SQL and kept ON DELETE clauses together. Added SQL exclusions for Prettier and workspace format-on-save; corrected the ignore rule so the workspace setting can be versioned.

Validation: repository ESLint, TypeScript typecheck, backend build, and all 150 tests across 13 files passed. The admin suite now has 12 tests (previously 7), with additional assertions for defaults, duplicate keys, invalid references, authorization, filtering, reallocation, rollback, repricing, refunds, late fees, and room protection. The SQL schema was successfully applied only to the isolated test database. Vitest required execution outside the sandbox because worker startup initially failed with EPERM.

Limits: payment and refunds remain simulated; these changes do not transfer money or automatically collect/refund the balance caused by editing a stay. The total is updated while completed payment records retain the amount actually paid. No development database reset, browser verification, frontend change, or PayFast integration was performed in this repair. The frontend and admin tests already existed before this audit; the older summary saying neither existed was stale. Other missing product features remain separate work.


## Admin contract completion - 3 November 2026

Completed:
- Removed the legacy public-router admin list, its two old tests, and the guest-service list export. Staff client now uses `/admin/bookings`; the admin router calls only the admin service.
- Booking create/read, modify, and admin list/detail expose amountPaid and balanceDue. The regression case for R6,750 total and R2,700 paid returns R4,050 due; shortening also preserves a negative balance rather than silently hiding an overpayment. Completed payments are not fabricated by repricing. The lifecycle paymentStatus is unchanged; outstanding money is represented by balanceDue.
- List returns pagination.total from the same filtered snapshot as the page, including empty/out-of-range pages. Supports branch/status/payment filters, literal case-insensitive search across reference/name/email, and inclusive check-in dateFrom/dateTo filters with calendar/order validation.
- Staff detail adds assigned room numbers, special requests, and safe payment records, without access-token hashes or raw provider payloads.
- HTTP/business-rule errors moved out of repositories; reallocation orchestration and room-change guards live in the service. Admin SQL moved to adminQueries.ts; refund SQL moved to bookingQueries.ts. Shared PostgreSQL codes and messages now live in constants.
- Added explicit named API regressions for rename-only patches, duplicate branch slugs/room numbers, invalid roomTypeId, list filtering/pagination/validation/auth, and staff detail. The earlier CRUD tests already contained some of these assertions; this step makes the coverage explicit and extends it.
- Staff totals now display paid/balance amounts; Review & Payment displays the server balance and recorded paid amount.

Verification: all 162 tests across 13 files pass (25 admin tests). ESLint, backend and client TypeScript checks, backend build, and client production build pass. One initial test expectation incorrectly used Classic instead of the seeded Classic Room; corrected it and reran the full suite. Browser smoke verification could not attach to the in-app webview (timeout); authenticated staff and review rendering remain unverified in the browser. Database tests rebuild only the isolated test database.

Remaining: PayFast sandbox/webhook and balance settlement are not implemented; these fields do not collect money. Full admin pagination/search/detail UI still needs wiring; the current list consumes the canonical endpoint and displays balances. No deployment was performed. The next deployment checkpoint is 4 November, with host/access still to be established. Other brief features remain pending. Password registration was deferred at this checkpoint and has since been implemented alongside optional OAuth.

## Payments and account delivery — 3 November 2026

This checkpoint supersedes older pending statements about PayFast, account history, favourites, reviews, and notifications.

Done:
- Part 0: verified the existing admin fixes and changed the list envelope to `{ data, meta: { total, limit, offset } }`. Search and inclusive check-in filters use `search`, `dateFrom`, and `dateTo`.
- Part 1: added PayFast environment validation and example settings, signed checkout forms, a public form ITN endpoint, signature/merchant/amount/server validation, and atomic, idempotent payment recording. Simulation remains unavailable in production. Invalid notifications do not change bookings. Verification requests time out after three seconds; notifications are acknowledged with HTTP 200, including malformed bodies.
- Part 2: added profile read/edit, booking history by user ID or case-insensitive email, idempotent saved branches, post-stay reviews, public review pagination, branch ratings/favourite indicators, and private in-app notification read/list endpoints. Payment, approval, cancellation, and modification notifications are written in the event transaction.
- Part 3: the client submits PayFast forms, has payment return/cancel pages, profile editing and My Bookings/Saved Stays sections, server-backed save controls, eligible-stay review forms, and a notification bell. Confirmation distinguishes payment received from hotel approval. Existing fonts and design tokens are retained.
- Added `client/tsconfig.json` so editors discover the Vite/CSS declarations. `npm run check` now typechecks both API and client.

Verification:
- Parts 0, 1, and 2 passed their required checks before proceeding (162, 175, and 183 tests respectively). New endpoint tests use the isolated PostgreSQL test database; external PayFast verification is mocked.
- Browser verification against a separate API/client preview and disposable test records covered profile save, booking history, owner access without a manage token, review publication, notification read state, saved-stay persistence after reload, and the payment-cancel page. No console errors/warnings were observed in the checked flows. Fixed header overflow found at 320px; checked widths of 320, 768, and 1024px. The requested 1440px viewport did not settle reliably and is not claimed verified.
- Final check/build results are recorded below after completion.

Pending / assumptions:
- Configure real sandbox merchant credentials and passphrase privately, plus publicly reachable notify/return/cancel URLs. `.env` was not edited or committed. A localhost notify URL in the example must be replaced for PayFast to call it. Live hosted checkout, signature acceptance by PayFast, and delivery of a real sandbox ITN remain unverified.
- Only a live unpaid hold can be settled. Late payments after expiry/cancellation are ignored, never used to revive a room allocation. Because all ITNs receive 200 as requested, network/database failures require operational reconciliation or replay; no durable retry queue was requested or added.
- Extensions expose the outstanding balance but do not collect an additional payment. Existing cancellation/refund accounting remains simulated; this implementation does not send real PayFast refunds.
- History includes email-matched guest bookings, but managing/reviewing them still requires their private manage token unless the booking has the signed-in user's ID. Public reviews expose the booking guest's first name only; review comments are user-authored public content.
- No deployment, live OAuth sign-in, email delivery, development-database reset, or schema migration was performed. Browser sign-in used a disposable local test session, not Google.
- User formatting/comment changes made concurrently were preserved; unrelated files remain outside this task's commits.

Final verification: `npm run check` passed with zero lint warnings, both API/client TypeScript checks, and all 185 tests across 18 files. Backend and client production builds passed. Final webhook tests also cover malformed request acknowledgement and the exact server-validation request. Feature commits are on `codex/payments-account-features`; no push or deployment was performed.

## Frontend direction — 5 November 2026
The current priority is guest-first frontend redesign in React, followed by rooms and booking. Backend polish is deferred. See docs/design/frontend-sprints.md for the source audit, page map, scope and verification gates. This checkpoint changes planning documents only; current UI remains unchanged. Rendered baseline is pending after the preview browser timed out.


## Guest frontend implementation — 5 November 2026
The homepage now shows two room highlights and links to /rooms for the full catalogue. Shared header/footer and discovery styles are scoped in client/src/styles/guest.css. Mobile menu supports Escape and focus restoration, checkout suppresses the header booking CTA, and unknown routes show a recovery page. Browse keeps a stable house-rules anchor with fallback content and a scroll-aware mobile booking shortcut. Existing API contracts and Redux stay state are retained. See DESIGN.md and docs/design/sprint-1-review.md for visual decisions, verification and limitations.


## Frontend checkpoint — 5 November 2026

The governing brief remains `docs/design/HOTEL_DESIGN_GUIDELINES.md`; retain Imaro, Cinzel, Source Sans 3 and Hugeicons. Backend polish remains deferred.

- Sprint 3: Manage Booking now separates lookup input from the loaded reservation/token, clears stale results, guards cancellation, shows paid/outstanding amounts and reports copy-link success/failure. Checkout has layout-matched loading. Rendered print output and remaining Manage Booking browser checks are still outstanding.
- Sprint 4: `/hotel`, `/stay-information` and `/contact` use supplied branch information, policies and contact links. Missing dining information is explicit; illustrative imagery is labelled. Account pages share the guest styling, and notifications support Escape/focus restoration. Hotel inspection reported zero failures; its desktop capture showed loading, while the mobile capture showed loaded content. Authenticated account verification remains pending.
- Sprint 5: Staff reservations have server search/status filters, branch scope and pagination. Inline editors replace prompts, failed saves retain input, duplicate writes are guarded and destructive actions require confirmation. Synthetic browser checks covered filtering, failed reservation edits and the rooms/rates/branches views with all writes blocked. Final rate-edit/time-field/access-panel adjustments still need targeted browser verification.
- Sprint 6 remains open: printed receipt, production-build browser check, remaining responsive/keyboard/reduced-motion checks and content/integration gates. Live PayFast behavior and field performance metrics are not verified by these previews.

Prior full validation passed 200 tests across 22 files, lint and both TypeScript checks. This checkpoint does not claim all sprint acceptance criteria are met. Continue in bounded slices with targeted checks and a Markdown checkpoint; avoid repeating full audits without a new failure or relevant change.
Closeout verification: lint, client TypeScript and production build passed on 5 November 2026. Vite required an approved retry outside the sandbox after a child-process EPERM. The synthetic preview page was removed from client/ and retained only in ignored .taste-skill/. No full test-suite rerun in this documentation/cleanup pass; the 200-test result above is from the preceding implementation run.

## 6 November 2026 - frontend verification and PayFast preparation
See docs/design/sprint-6-review.md for current evidence and remaining acceptance work. Full check passed 214 tests in 26 files, lint and both TypeScript checks; production client build passed. Eight fixture screens checked at four viewport widths without document overflow; account/staff tabs, cancellation error, copy feedback and printed confirmation reviewed. Added payfast:check and docs/payfast-sandbox.md. Sandbox credentials/public callbacks are missing; no live payment performed. Sprint 6 remains open for the documented real integration, accessibility and device checks.


## Admin update — 8 November 2026
Lists now lead the admin sections, with creation forms disclosed on demand and reservation details expandable. Section navigation uses the URL. Readiness waits for inventory success and hides when complete. Known room types display by name; new-branch category discovery remains limited by the API. See progress.md for implementation and manual verification limits.


## Custom error handling — 8 November 2026

- Added a shared React Form for every active guest, account, search, and staff form, including shared record editors. Native browser validation bubbles are disabled; accessible custom messages identify fields, focus invalid controls, and link errors to controls with aria-describedby. Validation covers required values, whitespace, email, phone, length/range/step constraints and stay date ordering/30-night limits, including custom calendar buttons.
- Centralised API error presentation: known business errors have curated messages; unexpected server text, malformed responses, network failures and HTTP errors have safe actionable fallbacks. Sign-in query errors no longer display arbitrary URL text.
- Reused the existing feedback provider for unhandled promise rejection notifications and added a page rendering error boundary with reload/booking-recovery actions. Added consistent form error styling. Existing API contracts and server validation remain unchanged.
- Preserved prior uncommitted work. Per user request, no tests, lint, typecheck, builds or browser verification were run. Runtime behaviour and accessibility remain unverified.

## Branch setup — 8 November 2026

- Add branch now includes a gallery of image URLs/alt text, facilities, cancellation text, house rules, and a Published switch defaulting to draft. Slugs auto-fill from names until manually edited; coordinates have range limits and map-copy hints; stars are limited to 1–5; time inputs retain 14:00/10:00 defaults. Contact errors appear beside fields. Wording asks staff to check details without claiming system verification.
- Branch creation validates and saves optional content in the existing related tables within one transaction. No schema changes are needed. Existing PATCH behavior is unchanged; the new content fields are currently available during creation.
- Successful creation opens a branch-specific rooms-and-prices setup view. A new staff-only `/api/v1/admin/room-types` endpoint supplies the shared catalogue and capacity, including for empty branches. Room creation supports active/maintenance status. Rates remain per room type; actual availability remains date/booking-dependent. Drafts can be published from Branches after setup.
- Cancellation text describes policy only; it does not alter financial cancellation rules. Existing guest endpoints supply the saved photos, amenities and policy text.
- Source inspection only. Tests, lint, typechecks, builds, browser checks and database commands were skipped at the user's request. Updated the existing branch-form expectation to reflect draft-by-default; it was not run.

Published control correction: Add Branch now uses a compact button-based switch with aria-checked, an associated label/hint, and a visible keyboard focus indicator, avoiding inherited full-width input styling. Runtime appearance remains unverified.


## Consistent success feedback — 8 November 2026

- Reused the global feedback provider for five-second success toasts, with hover/focus timer pauses, timer cleanup, explicit dismiss controls, Hugeicons and soft green styling. Toasts stay below navigation, respect the bottom safe area and are hidden when printing.
- Added a shared accessible SuccessBanner for booking holds, server-confirmed stays/verified payments, cancellation, profile saves, published reviews, password recovery and availability subscriptions. Held reservations explicitly require payment and hotel approval; cancelled/expired bookings never receive payment-success styling.
- Added missing toast feedback for booking creation, both clipboard actions, notification read updates and Google sign-in. Standardized sign-out and saved-location removal as successful actions. Staff messages identify room, branch, reservation action or saved nightly amount.
- Successful staff saves remain successful if a subsequent refresh throws. Guest cancellation reports the accepted cancellation separately from a failed detail reload. Existing user changes were preserved.
- Verification: targeted ESLint passed. Client TypeScript check passed after correcting the pre-existing shared Form event annotation to React SubmitEvent. No database tests, booking/payment writes or browser verification were performed; no preview was listening on the usual local ports. Responsive layout, screen-reader announcements and runtime toast timing still need browser verification.
## Device photos and staff modal consistency — 8 November 2026

- Branch photos now support device uploads alongside URLs. The staff-only raw upload endpoint accepts JPEG/PNG/WebP signatures, enforces a 5 MB limit, assigns random filenames, and stores files under configured `UPLOAD_DIR` (default `uploads/`, ignored by Git). Uploaded images are publicly served for guest galleries; alt text is still required when creating a branch. Partial batch failures retain completed uploads and present retry guidance.
- Deployments must mount persistent storage at `UPLOAD_DIR`; this implementation does not provision cloud storage. Removed photos or abandoned forms do not delete uploaded files automatically.
- Rooms and rates now use the shared modal form layout, full-width controls, normal-case labels/hints, consistent placeholder typography, and matching dialog widths. Outside-click dismissal is disabled for room/rate creation so interacting with native selection popups cannot dismiss the modal. Close, Cancel and Escape remain available. Branch creation also avoids outside-click dismissal during device file selection.
- Tests, builds, lint, typechecks and browser verification were skipped per user preference. The modal fix and upload flow are implemented but not runtime-verified.

## Guest fixes, step 1 — 9 November 2026

Fixed the date picker overflow shown in the user's screenshot: the popup now uses a 320px width capped to the viewport with 12px side margins instead of inheriting the narrow trigger width. Seven equal day columns and explicit day padding keep dates contained; the month/year stays on one line. Native button keyboard activation now follows the same positioning path as mouse clicks.

Verification: client TypeScript and targeted ESLint passed; Impeccable detector returned no findings. No app was listening on ports 5173/4000, so rendered appearance and interactions remain for manual testing. No database tests or writes performed.

## Guest fixes, step 2 — 9 November 2026

Removed email/Google sign-in, sign-out completion, notification-read and development reset-link success toasts. Sign-in errors remain inline without a duplicate toast. Restricted the authentication form's navigation guard to account creation, so typing login credentials no longer triggers discard confirmation when choosing Google, password recovery or leaving sign-in. Account creation retains its guard and success feedback; other saved-change and booking feedback remains.

Verification: client TypeScript and targeted ESLint passed. Browser authentication and navigation flows remain unverified; no database tests or account writes performed.

## Guest fixes, step 3 — 9 November 2026

Scoped user-select suppression to the homepage hero and disabled native dragging for its photograph and booking link. The link retains native click/keyboard navigation, text remains exposed to assistive technology, and the existing reduced-motion-aware image arrival is unchanged.

Verification: client TypeScript and targeted ESLint passed. Pointer/touch selection and booking-link behaviour still need browser/manual verification.

## Deployment environment URLs � 9 November 2026

Updated the ignored local .env CLIENT_URL and PayFast return/cancel URLs to https://imaro.vercel.app, removing the duplicate CLIENT_URL entry. Added VITE_API_URL and deployment guidance to the local-development example; PayFast documentation now uses the supplied frontend origin. Secret values were preserved.

Verification: inspected only the relevant URL settings and checked the documentation/template diff. The public backend address is still needed for VITE_API_URL, GOOGLE_REDIRECT_URI and PAYFAST_NOTIFY_URL; the latter remains a placeholder. Hosted environment settings were not changed. Public site inspection was unavailable from this session. No tests, builds, database commands or payment requests were run. Restart the local API to apply .env changes; local browser use will need CLIENT_URL restored to its localhost origin.

## Backend deployment URLs � 9 November 2026

The user supplied https://imaro.onrender.com/api/v1. Updated the ignored .env VITE_API_URL, GOOGLE_REDIRECT_URI and PAYFAST_NOTIFY_URL to that API and its callback routes, preserving secrets and removing any duplicate entries for these keys. Updated the example's deployment comments and PayFast setup documentation with the concrete hosted values and hosting/Google configuration steps.

Verification: asserted each updated local URL occurs exactly once; diff whitespace check passed. Hosted Vercel/Render settings and Google OAuth registration were not changed. No builds, database tests, payment requests or live integration verification were performed. This resolves the missing-backend-address blocker from the preceding checkpoint.

## Guest fixes, step 4 — 9 November 2026

Reproduced Reviews failure against the configured development database: LIST_ALL_REVIEWS raised PostgreSQL 42P01 because review_reactions was missing. Applied only the existing CREATE TABLE IF NOT EXISTS review_reactions statement from migration.sql inside a transaction. Did not run the full migration, seed or destructive schema setup; existing records were preserved. No application code change was needed.

Verification: the exact review query now succeeds. Direct Supertest requests against the Express app for GET /api/v1/reviews?limit=26&offset=0 and offset=25 returned 200 with array data and valid pagination metadata. The database currently has zero reviews, so the page should show its existing empty state. No Vitest/global setup, review/reaction writes, or browser rendering checks were run. Other deployments must also have this existing additive migration applied.

## Restore local development configuration � 9 November 2026

Corrected the preceding deployment configuration changes: restored all six URL settings in ignored .env to localhost (frontend 5173, API 4000), preserving every other setting. Hosted URLs belong in Vercel/Render settings; clarified this in the PayFast guide. Verified exact local values and preservation of unrelated settings; no database writes or tests. Both development servers need restarting to load the restored configuration. Local PayFast notification delivery requires a public tunnel and remains unverified.

## Guest fixes, step 5 — 9 November 2026

Centered desktop guest navigation with a three-column header grid. Wide layouts (1440px+) use equal side columns so navigation stays at the page center; smaller desktop layouts center it in the space between the logo and account actions. Existing mobile menu breakpoint and interaction remain.

Verification: inspected signed-out header in the browser at its default desktop width and a 1782px viewport, plus opened the mobile menu at 390px. Authenticated header remains for user testing. Preview ran on port 5174 after sandbox child-process restrictions required an elevated startup. The preview could not reach its configured API; this check verifies header rendering only, not Reviews data loading. No tests or database changes for this CSS-only step.
## Guest fixes, step 6 - 9 November 2026

Aligned Guest Details with the established native checkout form pattern and native Imaro submit button. This restores form validation/submission behavior for the Continue to review & payment action and keeps its navy styling consistent with the rest of checkout. Room sorting now applies a deterministic name tie-breaker after nightly rate or room size.

Verification: client TypeScript passed and the full lint command still reports pre-existing backend violations in adminService, imageUploadService, and admin validation. Browser checkout and sorting behavior remain pending manual verification.
