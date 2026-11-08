# Imaro progress tracker

## Guest reviews page — 8 November 2026

- **Done (source):** New `/reviews` page lists reviews across all branches (newest first, paginated) with star rating, comment, reviewer first name, branch link, posting date, and average-rating summary. "Helpful" reactions toggle per signed-in user; signed-out visitors are sent to sign-in and returned to `/reviews`.
- **Done (source):** New endpoints `GET /api/v1/reviews` (public, paginated, optional session marks `reacted`) and `POST /api/v1/reviews/:id/reactions` (requires sign-in, toggles). New `review_reactions` table added to `schema.sql` and `migration.sql`; reviews are still created only through the existing verified-stay `POST /bookings/:reference/review` flow.
- **Verified:** `test/api/account.test.ts` passed (7 tests, including new list/reaction coverage); full `npm test` passed all API tests — 2 unrelated unit failures remain from the in-progress checkout refactor (`guestDraft`, `guestStay`). Targeted typecheck is clean for changed files; repo-wide typecheck/lint still fail on that same uncommitted work (`bookingView`, `guestDraft.test`, `imageUploadService`, `validation/admin`).
- **Pending:** Browser verification of the reviews page and migration run against the development database (`npm run db:migrate`).

## Registration and checkout refactor — 8 November 2026

- **Done (source):** “Create an account” now opens a single-page, no-scroll modal with Google as the primary action and only full name, email, and password for email signup.
- **Done (source):** Profile editing keeps name and optional phone; home-address fields are no longer accepted by registration or profile validation and are not rendered in checkout.
- **Done (source):** Authenticated checkout pre-fills account data and offers an inline override; signed-out checkout offers sign-in or expanded guest entry.
- **Verified:** `npm run typecheck` passed. The repository lint command remains blocked by unrelated existing complexity/magic-number errors in image upload and admin validation.
- **Pending:** Focused API tests and browser verification of the new modal remain to be rerun after this simplification.

Last updated: 6 November 2026.

Use this file for task status and next steps. Use [application state](application-state.md) for implementation details and known limitations, and [preferences](preferences.md) for user decisions. Update all relevant records after each agreed step.

Status meanings: **Done** = completed with stated evidence; **Partial** = some code exists but work remains; **Pending** = not completed; **Unresolved** = an observed issue still needs investigation. A passing build does not prove a working reservation flow.

## Current source checkpoint — 6 November 2026

This checkpoint supersedes older current-status summaries below. Historical test/build/browser results remain evidence for those earlier revisions only; they do not verify the latest component migration. This update inspected source only and ran no tests, builds or browser checks, following the user's usage preference.

- Guest-first sprints 0–5 have their principal screens implemented. Original review records remain historical; release acceptance (Sprint 6) is still open.
- UI elevation is partially implemented: Tailwind v4/Vite, HeroUI provider and exports, Framer Motion, hero/cards/reveals/bento amenities, room gallery, checkout controls/summary, account tabs/profile inputs and reservation status chips are wired into existing pages. See [UI elevation status](design/ui-elevation-sprints.md) for exact scope and remaining work.
- Recent repairs are implemented: branch selection uses the URL; legacy native control/label styles exclude marked HeroUI controls; mobile search layout targets direct field wrappers; checkout requires consent; Review uses one one-second clock for countdown and expiry with a click-time payment guard.
- Receipt countdown wiring now supplies the required live `now` prop, matching the Review flow. Typecheck and lint pass after the repair.
- PayFast checkout works according to the user's report. Public HTTPS callback/ITN verification and deployment remain unverified in this checkpoint; checkout success alone does not establish webhook completion.
- Next: manually verify branch Back/Forward/refresh and mobile search/checkout controls, then review the remaining elevation scope.

## Completed steps

| Step                                                | Status | Evidence / scope                                                                                                                                                              |
| --------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React, TypeScript, Redux client foundation          | Done   | Client builds; frontend routes and API request layer exist.                                                                                                                   |
| Correct guest-facing brand to Imaro                 | Done   | Browser title, navigation, and homepage inspected. Older seed names have a guest-display mapping.                                                                             |
| Use Hugeicons                                       | Done   | Shared SVG icon component added; browser rendering and build checked.                                                                                                         |
| Organize React files by feature                     | Done   | Browse, booking, account, and admin folders; shared app setup, components, libraries, styles, and types. Typecheck, lint, and production build passed.                        |
| Record project preferences, state, and coding rules | Done   | Preferences, application state, and coding guidelines recorded in `docs/`; rules prefer short, simple, readable code.                                                                                        |
| Add progress tracking                               | Done   | This tracker added and linked for future agents.                                                                                                                              |
| Read hotel design guidelines                        | Done   | `docs/design/HOTEL_DESIGN_GUIDELINES.md` read in full; recorded as an active design reference.                                                                                |
| Lock font direction                                 | Done   | User selected **Modern Serif**. This records the decision, not installation.                                                                                                  |
| Agree guest page list                               | Done   | Home, Rooms & Suites, Room Details, Our Hotel, Stay Information, Contact. Dining belongs inside Our Hotel initially. Planning approval only.                                  |
| Agree booking page list                             | Done   | Guest Details, Review & Payment, Booking Confirmation, Manage Booking. Dates and room selection stay in the guest room pages. Planning approval only.                         |
| Agree account page list                             | Done   | Sign In, Sign Up, My Profile, Saved Stays. User requires registration with personal details; Google must be optional. Guest checkout stays available. Planning approval only. |

| Agree admin page list | Done | Reservations (landing), Branches, Rooms, Prices. Planning approval only; initial 18-page list is now agreed. |
| Core booking journey screens | Done | Added Room Details, Guest Details, Review & Payment, and Confirmation routes using the existing booking hold and simulated payment API. Client build and lint pass; live browser journey completed with a real hold, simulated payment, server-backed confirmation, Manage Booking lookup, and invalid-token recovery. |
| Admin password access and discovery fix | Done | Seeded local/submission admin credentials, documented them in README, verified password login and admin session issuance, and made published branches discoverable before rooms/rates are configured. |
| Admin/guest usability investigations | Done | Updated the admin and guest investigations with current behavior, evidence, remaining friction, and prioritized next steps. |
| Admin readiness and guest recovery states | Done | Added selected-branch readiness checks with Fix navigation, clearer guest empty states, hotel browse recovery, not-yet-bookable contact actions, and a staff login hint. Typecheck, lint, and targeted guest/admin tests passed. |
| Password reset and availability notifications | Done | Added single-use password reset tokens, local/test reset-link flow, password visibility toggles, and a published-property availability signup with additive migration support. Auth and branch API tests passed. |

## Application work remaining

| Area                                          | Status   | Remaining work                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend sprint verification                   | Pending  | User reported Sprint 1 checks passed previously. Current runtime and later booking/admin flows still need verification; do not infer sprint completion from client code.                                                                                                          |
| Browse API connectivity                       | Done     | User corrected local credentials; API restarted. Health, dated branch search, and Polokwane detail return HTTP 200. Browser shows rooms, rates, house rules, and updated Pretoria data after switching locations. No database reset. Full booking transactions remain unverified. |
| Homepage and navigation                       | Partial  | Existing hero and hotel sections need comparison with the new guideline acceptance criteria.                                                                                                                                                                                      |
| Scroll-aware booking CTA                      | Pending  | Implement threshold-based behavior, mobile safe-area handling, and checkout exclusions. Current header CTA is not this feature.                                                                                                                                                   |
| Rooms and suites listing                      | Partial  | Cards and location selection exist; verify data, availability, actions, and loading states.                                                                                                                                                                                       |
| Room detail page                              | Partial  | Dedicated room details now include the API-backed room image gallery, facts, amenities, stay summary, and booking action; gallery type-check, component lint, and browser thumbnail selection passed; fuller policy content remains.                                              |
| Guest details and booking hold                | Partial  | Targeted booking API suite passed all 30 tests, including hold expiry, conflicts, concurrent protection, and cancellation release; duplicate browser submission remains unverified.                                                                                               |
| Review/payment                                | Partial  | Live review and simulated payment passed. Real PayFast is not connected; do not present simulation as a real payment.                                                                                                                                                             |
| Confirmation receipt                          | Partial  | Live server-backed confirmation and Manage Booking passed; Print confirmation is present but native print output could not be verified through browser automation; Save PDF remains.                                                                                              |
| Reservation management                        | Partial  | Lookup/cancel UI exists; page rendering checked, live reservation actions still need verification.                                                                                                                                                                                |
| House rules / stay information                | Partial  | Homepage and Guest Details disclosures read API policies. Review visibility and broader Stay Information content remain.                                                                                                                                                          |
| Our Hotel, Dining, and Contact                | Pending  | Agreed Our Hotel page will include Dining; Contact will be a separate page. Current Dining anchor is only promotional.                                                                                                                                                            |
| Profile and Google sign-in                    | Partial  | Basic profile and OAuth wiring exist; verify configured sign-in and agree profile content.                                                                                                                                                                                        |
| Email/password registration and sign-in | Done | Sign-in/create-account form and `/auth/login` and `/auth/register` endpoints are implemented alongside optional Google OAuth; API tests passed in the reported audit. |
| Admin operations                              | Partial  | Reservation, branch, room, and rate screens exist; verify permissions and live operations.                                                                                                                                                                                        |
| Content CMS                                   | Pending  | Outside the agreed initial 18-page list; not implemented. Revisit only if separately requested.                                                                                                                                                                                   |
| Favorites and share                           | Partial  | Favorites currently save locations; room labels need alignment. Share behavior needs review.                                                                                                                                                                                      |
| Display typography                            | Done     | User selected the Cinzel + Source Sans 3 pairing. Cinzel is applied to the heading/display token; Source Sans 3 is used for body and interface text.                                                                                                                              |
| Loading, empty, error, and recovery states    | Partial  | Basic states exist; skeletons and complete failure scenarios remain.                                                                                                                                                                                                              |
| Responsive design, accessibility, performance | Pending  | Complete the guideline checks and record measurements; compilation alone is insufficient.                                                                                                                                                                                         |

## Historical checkpoint — superseded by current source checkpoint

Browse connectivity is fixed and verified against the existing database and in the browser. The core booking journey is implemented and live-verified end to end, including invalid-token recovery. The room gallery and Guest Details policy disclosures are implemented and browser-verified. API remains running on port 4000.

Guest page list agreed: Home, Rooms & Suites, Room Details, Our Hotel (including Dining), Stay Information, and Contact. Booking page list agreed: Guest Details, Review & Payment, Booking Confirmation, and Manage Booking. Account page list agreed: Sign In, Sign Up, My Profile, and Saved Stays, with optional Google and email/password registration/sign-in. Account-linked booking history is deferred. Admin page list agreed: Reservations (admin landing page), Branches, Rooms, and Prices. The initial list totals 18 pages; page-list planning is complete. This step is planning and documentation only; no page implementation or font replacement was requested.

Display typography now uses the Cinzel + Source Sans 3 pairing per the user's updated direction. Booking API edge cases are verified; duplicate browser submission and print output remain. Full production build/repository lint remain limited by the earlier Node out-of-memory exits; targeted type-check and component lint passed for the latest policy change.

## Update rules

- Record the task, status, remaining work, and evidence after each step.
- Mark a feature Done only after its requirements are met; separate implementation from verification.
- Record blockers without guessing their causes or inventing completion percentages.
- Keep user decisions in `preferences.md` and implementation facts in `application-state.md` synchronized with this tracker.

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

## Deadline priorities

| Priority                                                 | Target            | Status                                                                         |
| -------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| PayFast sandbox and verified webhook                     | Before 6 November | Pending; simulation is insufficient for the gateway requirement.               |
| First deployment                                         | 4 November        | Pending; choose host, provision/configure services, and verify deployed flows. |
| Profile/my bookings/saved stays endpoints                | Before 6 November | Pending.                                                                       |
| Backend reviews, favourites, notifications               | Before 6 November | Pending.                                                                       |
| Admin room-type creation                                 | Before 6 November | Pending.                                                                       |
| Remaining pages, sticky booking CTA, map/share, admin UI | Before 6 November | Partial; finish in agreed steps.                                               |

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

## Payments/account deadline checkpoint — 3 November 2026

| Part                              | Status                                    | Evidence / limits                                                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — admin review findings         | Done                                      | Existing repairs verified; corrected `pagination` to `meta`; 162 tests passed.                                                                                                                                             |
| 1 — PayFast implementation        | Done; live verification pending           | Signed forms, validated ITNs, transactional/idempotent ledger writes, production simulation guard; 175 tests passed before Part 2. Credentials and public callback still need configuration and real sandbox verification. |
| 2 — account/reviews/notifications | Done                                      | Profile/history/favourites/reviews/ratings and transactional notifications; 183 tests passed before client work.                                                                                                           |
| 3 — client wiring                 | Done; hosted payment verification pending | PayFast redirect and return/cancel screens, account sections, persisted saves, review form, notification bell. Real API browser checks used disposable test records.                                                       |
| CSS import diagnostic             | Done                                      | Added discoverable client TypeScript config; client typechecking included in the check command.                                                                                                                            |

Browser checks: profile save, history, owner booking access, review publication, notification read, saved-stay persistence, and payment-cancel rendering passed. Mobile header overflow was fixed at 320px; 768/1024px checks had no document overflow. Real PayFast checkout/ITN, real OAuth, deployment, and 1440px rendering remain unverified. Final check/build outcome follows below. See application-state.md for operational assumptions, ignored late payments, and simulated refund limitations. Unrelated user formatting changes were preserved.

Final gate: `npm run check` passed with zero lint warnings and 185 tests in 18 files; backend and client builds passed. Work is committed on `codex/payments-account-features`; no push or deployment. Live sandbox verification remains Pending.

## Frontend planning — 5 November 2026

Completed source inventory, page map, sprint scope and acceptance criteria in docs/design/frontend-sprints.md. Recorded product context and the confirmed code-first workflow. No UI or backend source changed. Vite preview started on port 5174; in-app browser navigation timed out, so rendered baseline and visual verification remain pending. No tests run for these documentation/configuration changes. Next: Sprint 1 homepage and shared guest shell.

## Sprint 1 — first guest frontend implementation

Implemented the homepage/shared guest layout and /rooms catalogue entry. Added mobile navigation keyboard behavior, skip link, scroll-aware booking access, stable policy fallback and unknown-route recovery. Live room navigation preserved the selected stay and total. Lint and client build passed; Impeccable detector reported no findings. Design Taste inspection retains animation-count and fixed-bar overlap findings; see docs/design/sprint-1-review.md. Frontend work is ready for visual review, with mobile bar refinement remaining. No backend source changes.

## Sprint 2 — room browsing and detail work in progress

Implemented submitted date/guest search, cancellable requests, stale-result suppression, invalid saved-date recovery, location-level saves, room sorting, and room-detail gallery/summary/policy refinements. Replaced the mobile bottom booking overlay with a compact action in the existing sticky header. Browser verified draft date edits preserve old results until submission, new totals update after submission, largest-room sorting, and header booking access after scrolling. npm run check passed: lint/typechecks and 191 tests in 19 files, including 6 new date regressions. Client production build passed. Gallery interaction and final responsive review are in progress; backend code is unchanged.

## Sprint 2 — implementation and review complete

Completed gallery keyboard/thumbnail and cancellation-policy checks. Room catalogue and room details returned zero Design Taste app-mode failures at 1440/768/390px; remaining style warnings and screenshot-loading caveats are recorded in docs/design/sprint-2-review.md. Updated DESIGN.md, docs/application-state.md and the sprint plan. The mobile summary now follows the gallery, and nightly rate is distinct from the full-stay total. Full gate: 191 tests in 19 files, lint/typechecks passed; client build passed. Next: Sprint 3 booking journey. Real-device touch, slow-response fault injection and deployed payment verification remain release checks.

## Sprint 3 � guest-details presentation slice

Re-read docs/design/HOTEL_DESIGN_GUIDELINES.md directly as the governing brief. Applied sections 8�10: readable form labels and fields, semantic current-step indication, collapsible stay summary above the form on mobile, total repeated before Continue, supplied policies expanded before consent, and change-room/date navigation. Kept existing reservation/payment contracts. Updated DESIGN.md authority and the sprint plan.

Lint and client typecheck/production build passed. Browser inspector captured 1440/768/390px with zero failures; desktop and mobile contact sheets reviewed. Fixed the discovered summary-link contrast and legacy bright-blue/tiny action styling afterward. No reservation was created and no payment was attempted. This is a presentation slice: guest-input retention, loading/recovery, payment state verification, confirmation/print and manage-booking work remain in Sprint 3. Performance field metrics and full guideline breakpoint coverage remain release checks.

## Sprint 3 — retained details and payment states

Implemented memory-only guest drafts, reset consent, duplicate-submit guards, unavailable-room gating, and server amount/status revalidation before payment. Review, return and confirmation now share the guest design system. Payment returns distinguish waiting, expired, cancelled, paid/pending approval and confirmed states. Added mobile payment summary disclosure and print styles.

Verification: seven new regression tests first failed, then passed. Full check passed: 198 tests in 21 files, lint and both TypeScript checks. Final lint/client production build passed. Browser verified guest name/special-request retention. Synthetic fixtures verified changed-price acknowledgement, blocked payment recovery, expired-hold recovery and pending approval. Responsive review covered 1440/768/390px; corrected print-button contrast, and final confirmation inspection reported zero failures. No live reservation/payment writes. Manage booking, rendered print output and remaining loading/recovery work remain pending. See docs/design/sprint-3-review.md.

## Sprint 3 — manage booking, print and recovery

Merged the duplicated Manage/Confirmation receipt and lookup logic into BookingReceipt and useManagedBooking. Manage Booking now follows the confirmation hierarchy (paid, balance due or overpaid, hold and cancellation notes), shows a receipt-shaped skeleton while loading, and gives specific recovery messages for token mismatch, unreachable network and server faults. Confirmation load failures offer Try again. Print styles now cover both pages, with a print-only brand line. Added lookupRecovery unit tests.

Remaining: render and inspect printed output in a browser; verify 320/390/768/1440px, keyboard order and real-device touch; guest drafts still do not survive a full reload; live PayFast redirect/ITN and deployed-origin behaviour are separate integration checks.

## Sprint 4 — hotel information and returning guests

Split HotelInfoPage into a branch-information hook and section components; the location list is fetched once and switching location fetches only that branch. Loading uses the layout-matched skeleton, with retry and honest empty states for missing dining, policy and contact content. Account pages share one loading/error/empty component and no longer blank data on reload. My Bookings groups upcoming and past/closed stays and shows overpayments in the same wording as the receipt. Saved-location labels unified through lib/labels.ts. Added bookingGroups unit tests.

## Sprint 5 — staff workspace

Split the 703-line AdminPage into a shell plus Reservations, Rooms, Rates and Branches panels, with data hooks (useReservations, useBranchInventory, useAdminBranches) and per-area action hooks that all write through one confirm/busy/feedback path (useAdminWrites). Added StaffGate so signed-out users, signed-in non-staff users and a session still being verified each get a distinct state. Rate edit moves focus to the form, room-type ID shows the matching name, branch description is a textarea, row buttons have descriptive labels, and the reservation list keeps page state per branch. Added branchForm unit tests. tsc (server and client), eslint, build:client and the client unit tests pass.

Remaining: browser verification of every staff workflow against a seeded database and a non-staff account; API suite on a machine with Postgres.
Known limits: room type is still entered by ID because the API has no room-type list; reservations are scoped to the selected branch (no all-branches view); there is no reservation detail view.

Remaining: browser verification of /hotel, /stay-information, /contact and the account tabs at 320/390/768/1440px; signed-in empty and error states; Dining stays a placeholder because the API has no dining content.

## Sprint 6 — frontend release check

Verified in headless Chromium against real Postgres: 12 routes at 320/390/768/1440px on the dev server and the production build (no overflow, unique titles, unknown-route page); axe-core WCAG 2 A/AA 0 violations; focus ring ≥3:1 on all tab stops; reduced motion; guest journey through held confirmation, manage, cancel and token recovery (empty submit blocked, double submit creates one booking); print emulation and PDF; 25/25 staff-workspace checks; 214/214 tests; tsc, eslint, build clean.

Fixed: three misnamed admin files that blanked the app, duplicate policy keys, focus-ring and eyebrow contrast, singular/plural labels, hold-time format and zone, Modify offered on held reservations, print background and status tag.

Open (evidence needed outside this environment): PayFast sandbox redirect/ITN (needs credentials and a public notify URL); Google OAuth; native printer and real-device touch/screen-reader pass; Lighthouse LCP/CLS on the deployed site; Dining content; room-type list endpoint.

## Frontend checkpoint — 5 November 2026

The governing brief remains `docs/design/HOTEL_DESIGN_GUIDELINES.md`; retain Imaro, Cinzel, Source Sans 3 and Hugeicons. Backend polish remains deferred.

- Sprint 3: Manage Booking now separates lookup input from the loaded reservation/token, clears stale results, guards cancellation, shows paid/outstanding amounts and reports copy-link success/failure. Checkout has layout-matched loading. Rendered print output and remaining Manage Booking browser checks are still outstanding.
- Sprint 4: `/hotel`, `/stay-information` and `/contact` use supplied branch information, policies and contact links. Missing dining information is explicit; illustrative imagery is labelled. Account pages share the guest styling, and notifications support Escape/focus restoration. Hotel inspection reported zero failures; its desktop capture showed loading, while the mobile capture showed loaded content. Authenticated account verification remains pending.
- Sprint 5: Staff reservations have server search/status filters, branch scope and pagination. Inline editors replace prompts, failed saves retain input, duplicate writes are guarded and destructive actions require confirmation. Synthetic browser checks covered filtering, failed reservation edits and the rooms/rates/branches views with all writes blocked. Final rate-edit/time-field/access-panel adjustments still need targeted browser verification.
- Sprint 6 remains open: printed receipt, production-build browser check, remaining responsive/keyboard/reduced-motion checks and content/integration gates. Live PayFast behavior and field performance metrics are not verified by these previews.

Prior full validation passed 200 tests across 22 files, lint and both TypeScript checks. This checkpoint does not claim all sprint acceptance criteria are met. Continue in bounded slices with targeted checks and a Markdown checkpoint; avoid repeating full audits without a new failure or relevant change.
Closeout verification: lint, client TypeScript and production build passed on 5 November 2026. Vite required an approved retry outside the sandbox after a child-process EPERM. The synthetic preview page was removed from client/ and retained only in ignored .taste-skill/. No full test-suite rerun in this documentation/cleanup pass; the 200-test result above is from the preceding implementation run.

## 6 November 2026 - startup path repair
Corrected npm dev/database scripts, backend TypeScript paths, ESLint scope and test imports to use backend/src after the directory move. Existing frontend edits were preserved; staff filenames already match imports in this checkout. Backend and client TypeScript checks passed. npm run dev started successfully on temporary port 4017. Database migrations and the database-resetting test suite were not run.

## 6 November 2026 - frontend verification and PayFast preparation
See docs/design/sprint-6-review.md for current evidence and remaining acceptance work. Full check passed 214 tests in 26 files, lint and both TypeScript checks; production client build passed. Eight fixture screens checked at four viewport widths without document overflow; account/staff tabs, cancellation error, copy feedback and printed confirmation reviewed. Added payfast:check and docs/payfast-sandbox.md. Sandbox credentials/public callbacks are missing; no live payment performed. Sprint 6 remains open for the documented real integration, accessibility and device checks.

## 6 November 2026 - local room API configuration
Corrected placeholder VITE_API_URL and HTTPS localhost CLIENT_URL in the ignored local environment. Vite now reads the project-root .env through envDir. PayFast settings preserved. Restart both dev servers to apply. No test suite or database changes.

## 6 November 2026 - admin onboarding investigation
Confirmed public branch discovery incorrectly depends on priced, available inventory. Published new branches can be absent from guest lists. Also found missing onboarding guidance, old-branch selection after creation, numeric room-type IDs and incomplete editing. See docs/design/admin-flow-investigation.md. Investigation only; no tests or application changes.

## 6 November 2026 - audit follow-up
Added the static-host SPA fallback and verified the built `dist/client/_redirects` matches its source. Corrected authentication status, documented the current module map/backend layout, and removed dangling agent-file references. Retained `appReducer`: `test/unit/guestDraft.test.ts` imports it. Lint, both type checks and client build passed; the full test suite was not rerun. This build produced 652.65 kB of JavaScript (186.41 kB gzip), triggering the bundle-size warning. Existing integration and device verification gaps remain open.

## 6 November 2026 - guest journey investigation
Source review identified silent property fallback, consent referencing missing cancellation terms, browser-only guest access recovery, storage-failure handling after hold creation, inconsistent sign-in routing and missing review editing. See docs/design/guest-flow-investigation.md for evidence and priorities. Investigation only; no application changes or tests.


## Guest investigation repairs — 6 November 2026

Fixed the high-priority guest findings: requested-property identity is preserved with explicit availability states instead of a silent fallback; consent requires a real cancellation policy; booking tokens survive blocked storage and can be deliberately exported from review, confirmation and manage; password and Google sign-in restore the originating page and a pending save; review reacts to hold expiry. Unavailable rooms keep their detail links.

Evidence: lint, API and client TypeScript checks and 13 focused unit tests pass (new sign-in-path, hold-expiry and storage-failure cases). Client production build result recorded below the run. Not verified: browser rendering, genuine storage failure, live PayFast, email delivery of access details, editing an existing hold and password reset.

## UI wiring repairs - 6 November 2026
Restored required native consent validation plus explicit submit feedback. Migrated HeroUI form controls now carry a boundary class excluded from legacy native input/textarea/select selectors. Review owns the single one-second clock used by both hold countdown and payment expiry; click-time expiry is checked against the current time. Source diff reviewed only; no tests, builds or browser verification run, per usage preference.


## Focused styling and navigation repairs - 6 November 2026

- Branch selection now updates the URL, preserving other query parameters and the hash. Browser Back/Forward and refreshed links use the same selection source.
- Scoped legacy label and checkbox layout rules away from HeroUI controls so their component styles can apply.
- Mobile search grid rules now target direct search fields, including the new location Select wrapper, instead of nested labels.
- Kept the existing design, typography and page structure. Source/whitespace review only; no tests, builds or browser checks run at the user's request. Manual checks remaining: branch selection + Back/Forward/refresh, mobile search layout, checkout labels and terms checkbox.


## Guest visual refinement — 6 November 2026

Implemented a flat booking strip below the hero, consistent outlined date/select controls, quieter location tabs, wider room spacing and persistent hero text without staggered entrances. Room detail actions are native router links; cards no longer lift on hover. Preserved fonts, palette, factual copy and booking logic. Preview launch blocked: default Vite config bundling fails on Tailwind native dependency; runner loader fails on picomatch require. No tests/builds run; rendered desktop/mobile verification remains open.

Follow-up scope: user confirmed dissatisfaction across all surfaces. Added Imaro HeroUI primary/focus/surface tokens and restrained corner radii; unified checkout/profile field slots, added the missing ProfileForm CSS boundary, aligned the global action colour to navy and flattened staff filter backgrounds. This is an implemented consistency pass, not a claim that every screen is redesigned or visually verified. Impeccable detector reported no findings for the discovery files; local preview remains blocked.


## Admin simplification — 8 November 2026

Implemented in imaro-clean: compact heading/filter/table spacing; Rooms, Rates and Branches creation forms collapsed behind named disclosure actions; reservation details and write actions expandable per row; redundant property column removed; unpaid uses warning colour. Section selection is URL-backed (`section` query) and survives refresh/history. Readiness hides after completion and waits for successful inventory loading; only incomplete checks are listed. Existing confirmations and write hooks remain.

Known room categories now appear by name in a select. New properties still require a known category ID when no categories are available: the existing API only supplies categories through inventory/rates. Branch technical labels are clearer, but map coordinates and web address names remain required by the current contract. Guest/room SelectItems now declare their text values; guest results and sign-in spacing are tighter.

Source/whitespace review only; no tests, builds or browser checks. Running-checkout identification was denied by Windows process inspection, so the localhost checkout remains unconfirmed. Manual checks: section history, expand/create/edit/cancel flows, readiness loading, reservation details and guest count labels. These changes do not close release acceptance or the previously documented receipt countdown issue.


## Reference-led admin shell — 8 November 2026

Adapted the supplied dashboard reference into an Imaro navy sidebar, compact staff top bar, warm-neutral property overview and white operational workspace. Authenticated admin no longer uses the guest navigation/footer. Existing four sections, notifications, profile, sign-out, branch selection and write workflows remain connected. Overview uses actual inventory/rate/publication data; no revenue, occupancy or trend claims are fabricated. Mobile sidebar becomes wrapping section navigation. Source/whitespace review only; no tests/builds or rendered verification.


## Notification panel usability — 8 November 2026
Moved notifications to a viewport-positioned portal to avoid header clipping/stacking issues. Added a compact title/44px close control, clear empty state, scrollable height limit, viewport clamping, outside-click/Escape/focus-away dismissal and focus restoration on explicit close. Uses unique panel IDs and preserves read/booking actions. Source/whitespace review only; no tests/build/browser verification.


## Notification trigger refinement — 8 November 2026
Removed the bell trigger’s permanent border/background. Retained a 44px target, subtle hover/open background and keyboard focus outline. CSS-only change; no tests/build run.


## Property switcher polish — 8 November 2026
Replaced the boxed Branch field treatment with a compact rounded white property switcher, inset Current property label and Hugeicons chevron. Removed repeated city text when already present in the property name. Native select behavior retained, including keyboard support, disabled/empty states and visible focus. Source/whitespace check only; no tests/builds or browser verification.


## Property dropdown — 8 November 2026
Replaced native property select with the existing HeroUI Select: styled portalled menu, warm hover, muted selected row, 44px options, string IDs and explicit option text. Preserved branch-change callback and busy/empty disabling; disallowed accidental deselection. Removed superseded native-switcher CSS. Source-only review; no tests/builds or rendered verification.


## Property selector reference refinement — 8 November 2026
Matched the supplied Location selector treatment: external label, 48px white outlined trigger, rounded white menu, warm selected row and bronze chevron. Retained readable navy selected text and full property names for unambiguous branch selection. CSS/source review only; no build/test/browser pass.


## Location option text — 8 November 2026
Property switcher now displays city names in both its selected value and menu. Properties sharing a city retain their property name to distinguish them; missing city falls back to the property name. Source-only change, no tests/build.


## Location menu inset — 8 November 2026
Scoped a list-margin/padding reset to the property dropdown and removed extra listbox wrapper padding. Options retain a 12px text inset. No tests/build or browser verification.


## Dropdown reference correction — 8 November 2026
Added explicit HeroUI list/wrapper classes and reset actual ul indentation and margins. Compact full-width rows with warm selected state; replaced inherited thick outside focus ring with a thin inset keyboard indicator. Source inspection of installed HeroUI confirmed supported class slots. Browser appearance still requires verification; no tests/build run.


## Reservations filter toolbar — 8 November 2026
Aligned search, status and actions at 48px height with consistent corners and subtle surfaces. Added search placeholder and native search input; status uses the existing styled HeroUI menu with explicit text values and list padding reset. Refresh is a secondary button and disabled while loading. Explicit Apply behavior and API filtering preserved. Responsive grid stacks at narrow widths. Source/whitespace review only, no tests/build/browser verification.


## Reservation table consistency — 8 November 2026
Unified status badges with sentence-case text and muted semantic fills; expired/cancelled use neutral styling, unpaid remains amber. Added aligned numeric totals, clearer guest/reference hierarchy, warm row hover, matching detail buttons with expansion chevrons, column scopes and labelled pagination. Existing reservation actions unchanged. Source/whitespace review only; no tests/build/browser verification.


## Reservation details modal — 8 November 2026
View details now opens a compact HeroUI modal with guest/contact, dates, status and payment amounts instead of an expanded table row. Uses library focus management, Escape/backdrop dismissal and scrollable content. Existing approve/modify/cancel actions close the modal before invoking their existing flows. Source/whitespace review only; no tests/build/browser pass.


## Reservation modal hierarchy — 8 November 2026
Grouped modal into Guest, Stay and Payment sections. Sentence-case status badges sit beside their section headings; payment amounts align in rows and balance is emphasized. Removed container focus outline while retaining focus indicators on controls, softened icon close treatment and clarified Cancel reservation wording. Existing data/actions preserved. Source/whitespace review only; no tests/build/browser verification.


## Custom error handling — 8 November 2026

- Added a shared React Form for every active guest, account, search, and staff form, including shared record editors. Native browser validation bubbles are disabled; accessible custom messages identify fields, focus invalid controls, and link errors to controls with aria-describedby. Validation covers required values, whitespace, email, phone, length/range/step constraints and stay date ordering/30-night limits, including custom calendar buttons.
- Centralised API error presentation: known business errors have curated messages; unexpected server text, malformed responses, network failures and HTTP errors have safe actionable fallbacks. Sign-in query errors no longer display arbitrary URL text.
- Reused the existing feedback provider for unhandled promise rejection notifications and added a page rendering error boundary with reload/booking-recovery actions. Added consistent form error styling. Existing API contracts and server validation remain unchanged.
- Preserved prior uncommitted work. Per user request, no tests, lint, typecheck, builds or browser verification were run. Runtime behaviour and accessibility remain unverified.

## Branch creation and setup — 8 November 2026

Completed implementation: draft/published choice; automatic editable slug; coordinate hints/ranges; star dropdown; time defaults; inline contact errors; photo URL/alt-text list; facilities and policy fields; transactional content persistence; and navigation to the new branch's rooms and prices. Added staff room-type catalogue with capacities and active/maintenance choice for new rooms. Reused existing rate and publication actions.

No test/build/lint/typecheck/browser runs or database changes, as requested. Runtime and responsive/accessibility behavior remain unverified. New gallery/facility/policy editing is currently creation-only; the existing branch editor still edits name/description. Cancellation calculations remain independent of policy text.

Published switch correction: replaced the checkbox affected by modal text-input styles with a compact, keyboard-accessible switch beside its label, retaining a 44px target and descriptive hint. No tests/build/browser checks run, per requested scope.


## Consistent success feedback — 8 November 2026

- Reused the global feedback provider for five-second success toasts, with hover/focus timer pauses, timer cleanup, explicit dismiss controls, Hugeicons and soft green styling. Toasts stay below navigation, respect the bottom safe area and are hidden when printing.
- Added a shared accessible SuccessBanner for booking holds, server-confirmed stays/verified payments, cancellation, profile saves, published reviews, password recovery and availability subscriptions. Held reservations explicitly require payment and hotel approval; cancelled/expired bookings never receive payment-success styling.
- Added missing toast feedback for booking creation, both clipboard actions, notification read updates and Google sign-in. Standardized sign-out and saved-location removal as successful actions. Staff messages identify room, branch, reservation action or saved nightly amount.
- Successful staff saves remain successful if a subsequent refresh throws. Guest cancellation reports the accepted cancellation separately from a failed detail reload. Existing user changes were preserved.
- Verification: targeted ESLint passed. Client TypeScript check passed after correcting the pre-existing shared Form event annotation to React SubmitEvent. No database tests, booking/payment writes or browser verification were performed; no preview was listening on the usual local ports. Responsive layout, screen-reader announcements and runtime toast timing still need browser verification.
## Device photos and modal fixes — 8 November 2026

Implemented device image uploads (JPEG/PNG/WebP, 5 MB per image, 20 photos per branch) with staff authorization, public image serving, random filenames, configured storage and friendly partial-failure feedback. URL entry remains available. Unified room/rate modal form styling and placeholder typography; disabled outside-dismiss behavior that can treat native select/file-picker interaction as a click outside the dialog.

No verification commands or browser runs, as requested. Production needs a persistent `UPLOAD_DIR`; abandoned uploads currently remain on disk. No database migration or dependency installation was required.
