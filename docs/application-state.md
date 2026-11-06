# Imaro application state

## Sprint 3 update - 5 November 2026

Guest details, review/payment, payment return and confirmation now use the guest visual system. Drafts persist in memory across room/date navigation. Server amounts are rechecked before payment; terminal states are distinct. Full check: 198 tests passed. Fixture browser checks do not establish live PayFast verification. Manage booking and rendered print output remain pending. See docs/design/sprint-3-review.md.

## Current frontend checkpoint — 5 November 2026

Sprints 1 and 2 are implemented and browser-reviewed; Sprint 3 (booking journey) is in progress: guest-details presentation now follows HOTEL_DESIGN_GUIDELINES.md sections 8-10, with readable controls, a collapsible mobile summary and policies before consent. Remaining checkout screens and behavior checks are pending. Mobile booking access is now in the sticky header, replacing the bottom overlay. Browse uses draft search fields, submitted Redux stay state and cancellable requests; invalid/expired persisted dates recover through client/src/lib/staySearch.ts. Catalogue sorting and one location-level save control are implemented. Room details have accessible gallery controls, a clearer summary and policies; on mobile the summary follows the gallery.

Verification: npm run check passed with 191 tests in 19 files, client production build passed, and live browser checks covered search submission/totals, sorting, navigation, gallery keyboard/thumbnail interaction and policy disclosure. See docs/design/sprint-2-review.md for visual checks and limitations. No backend source or payment behavior changed. Historical entries below describe earlier checkpoints and may be superseded by this section.

Last updated: 3 November 2026.

## Current implementation

The application has a React + TypeScript + Redux Toolkit client in `client/` and an Express + TypeScript + PostgreSQL API in `src/`. The client runs on port 5173 and uses `VITE_API_URL`, defaulting to `http://localhost:4000/api/v1`.

The frontend contains browse/location selection, room details, guest details, review and simulated payment, server-backed confirmation, reservation lookup, cancellation, Google sign-in/profile, and a role-gated staff console. Staff screens call the existing reservation, branch, room, and price endpoints. Favorites currently save locations in browser storage, even though some UI copy refers to rooms.

The guest design follows the older hotel design documents: photographic hero, date/guest/room controls, room cards, house rules, and editorial hotel sections. The current brand is **Imaro**, not Stillmere. Headings use Cinzel and body text uses Source Sans 3. Interface symbols use a shared Hugeicons wrapper in `client/src/components/Icon.tsx`.

The React client uses feature folders for browse, booking, account, and admin pages. App setup and Redux live in `app/`; shared transport and formatting live in `lib/`; API types live in `types/`; styles live in `styles/`. See `client/README.md` for the file map. Backend code remains in the root `src/`.

## API integration

- Browse and room detail: `GET /branches` and `GET /branches/:slug` with stay parameters.
- Booking hold: `POST /bookings`; the client keeps the returned manage token locally.
- Reservation lookup, cancellation, and simulated payment use the booking reference and `x-booking-token` header.
- Authentication uses `/auth/google` and `/auth/me`.
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

Account planning update: the user accepted My Profile and Saved Stays and required registration with personal details instead of mandatory Google. Planned account pages are Sign In, Sign Up, My Profile, and Saved Stays. Email/password authentication requires backend and frontend work; existing Google OAuth remains optional and guest checkout remains available. Registration and recovery details need definition. Admin page agreement is recorded above. This is recorded scope, not implemented functionality.

Documentation checkpoint: added `docs/progress.md`, read `docs/design/HOTEL_DESIGN_GUIDELINES.md` in full, and recorded Modern Serif as the user's locked font choice. The exact font asset/source remains to be identified. The UI still uses Cormorant Garamond and Inter; no runtime files were changed in this step. No code checks were rerun for this documentation-only change.

### Previous implementation step

Organized the React client by feature, separated booking/manage and account pages into individual files, and moved the shared error helper out of the app component to remove circular page imports. API contracts and page behavior were preserved.

Added `docs/coding-guidelines.md` and made it required reading in `AGENTS.md`: prefer the fewest lines of simple, readable code; avoid complex functions and unnecessary abstractions. The preferences document records this direction.

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

Remaining: PayFast sandbox/webhook and balance settlement are not implemented; these fields do not collect money. Full admin pagination/search/detail UI still needs wiring; the current list consumes the canonical endpoint and displays balances. No deployment was performed. The next deployment checkpoint is 4 November, with host/access still to be established. Other brief features remain pending. Password registration is deferred from the deadline scope in favor of OAuth, per the latest direction.

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
