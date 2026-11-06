# Frontend sprint plan

5 November 2026. Guest-first, directly in the existing React app. Sprints are reviewable slices, not promises of calendar duration. Backend polish is deferred.

## Starting point

The source audit found a working frontend structure that needs clearer page responsibilities and a more consistent visual language:

- BrowsePage combines the homepage, availability search, room catalogue, policies, hotel description and a promotional closing section.
- Dining navigation leads to a generic booking message rather than dining information. Contact and other agreed guest pages have no dedicated route.
- Repeated eyebrows, decorative image counters and interchangeable slogans dominate the hierarchy. Several controls use very small uppercase text.
- Navy, warm neutrals, brass and bright blue compete for attention. Retain the locked fonts and icons while resolving these competing treatments.
- A save button on every room saves the same location. The interface needs to explain what is actually saved.
- Editing search inputs immediately fetches availability, while a separate submit action also fetches it. Search behavior and displayed prices need one clear relationship.
- The wildcard route displays BrowsePage, concealing missing destinations.

These are source findings. A rendered baseline and interaction audit are still required; older screenshots do not establish the current appearance.

## Proposed design direction

A photographic South African hotel experience grounded in the selected location and the practical details of a stay. Preserve Imaro, Cinzel, Source Sans 3 and Hugeicons. Use generous photography, readable sentence-case controls, navy text and actions, and restrained warm neutral surfaces. Confirm the final palette against the rendered page before replacing tokens.

Home should introduce the hotel and lead into choosing a location and dates. Rooms should make comparison easy. Checkout should keep the stay and amount payable visible. Staff screens should prioritise dense, legible operational information.

Replace vague section titles with useful names, remove decorative counters and repeated labels, and use actual property information wherever available. No invented luxury claims, testimonials or dining facilities. Motion should clarify interactions and respect reduced-motion preferences.

## Page map

| Area | Destinations | Main job |
| --- | --- | --- |
| Discovery | Home; Our Hotel (including Dining); Contact | Understand the hotel and find help |
| Choose a stay | Rooms & Suites; Room Details; Stay Information | Compare rooms, understand policies and select a stay |
| Booking | Guest Details; Review & Payment; Confirmation; Manage Booking | Complete and manage a reservation |
| Account | Google sign-in; My Profile; Saved Stays; existing booking history/notifications | Return to personal information and reservations |
| Staff | Reservations; Branches; Rooms; Prices | Maintain the existing hotel operations |

The /rooms route is implemented. Dedicated /hotel, /stay-information and /contact routes are implemented with supplied branch content and explicit missing-content states. Preserve current room, checkout, payment-return and manage URLs. Dining stays within Our Hotel.

## Sprint 0 — Inventory and scope

Status: complete. Source inventory, sprint plan and rendered baseline captured; first implementation reviewed at desktop, tablet and phone widths.

Record the route map, brand constraints, existing integrations and missing content. Capture the current home and room experience at desktop and mobile widths before editing. Establish the design direction from the rendered baseline.

## Sprint 1 — Homepage and shared guest shell

Status: implemented and reviewed. The mobile bottom overlay was replaced with a compact action in the existing header during Sprint 2, removing the lower content obstruction. See sprint-1-review.md for the historical first-pass findings.

Deliver a coherent header, mobile navigation, footer, typography, controls and homepage. Give the opening photograph and concise hotel introduction priority. Place location/date selection within easy reach; make the primary action explicit. Remove decorative counters, redundant announcement copy and empty promotional sections. Keep the availability experience reachable throughout the transition.

Implementation slices:
1. Capture the current render; settle the first viewport and reusable style tokens.
2. Refine shared navigation, buttons, form fields and footer in place.
3. Separate homepage storytelling from room comparison without losing selected stay state or existing deep links.
4. Add scroll-aware booking access, avoiding competing booking prompts during checkout.

Done when: desktop and mobile render are reviewed; menu works by keyboard; no overflow at 390, 768 and 1440px (also check 320px header); navigation reaches real content; dates and guests survive navigation; booking access does not cover controls.

## Sprint 2 — Rooms and room details

Status: implemented and browser-reviewed. Submitted searches, cancellation of obsolete requests, saved-date recovery, sorting, explicit location saves and room-detail refinements are in place. Six new date regression tests pass, and the full check passed with 191 tests. See sprint-2-review.md for checks and release limitations.

Deliver /rooms, useful comparison layouts and room galleries. Keep room size, beds, capacity, nightly rate and stay total together. Make location saving explicit and consolidate redundant controls. Resolve draft search inputs versus submitted availability; prevent stale responses from presenting the wrong stay's prices. Include loading, unavailable, empty and retry states.

Done when: location/date/guest changes produce clearly matched results; unavailable rooms cannot continue to booking; gallery works on keyboard and touch; room selection preserves the stay; prices retain their API meaning. Add focused behavior tests for search and selection changes.

## Sprint 3 — Booking journey

Status: in progress. Guest details, review/payment, payment return and confirmation updated against HOTEL_DESIGN_GUIDELINES.md sections 8–10. Guest drafts survive room/date navigation in memory, and payment review revalidates server amounts. Seven new regression tests pass (198 total); fixture browser checks cover changed prices, request failure and terminal payment states. Manage booking and checkout loading are implemented; targeted Manage Booking verification, rendered print output and remaining recovery checks are pending. See sprint-3-review.md.

Refine Guest Details, Review & Payment, payment return/cancel, Confirmation and Manage Booking. Provide clear progress, retained guest input, an accessible stay summary, readable payment status and a printable confirmation. Distinguish pending, successful, cancelled and failed outcomes using server truth.

Done when: back navigation retains entered information where appropriate; validation and errors have recovery actions; duplicate submissions are prevented; receipt print layout is checked; frontend payment states are exercised. Real PayFast verification remains a separate integration gate and must not be claimed from a UI preview.

## Sprint 4 — Hotel information and returning guests

Status: implemented; account browser verification and loaded desktop hotel review remain pending. See sprint-4-5-review.md.

Deliver Our Hotel with Dining, Stay Information, and Contact using confirmed content. Add useful address/map/share actions only where data exists. Refine profile, saved locations, booking history, reviews and notifications around their existing endpoints.

Done when: policies and contact information are reachable from relevant steps; missing content is reported honestly; account loading/empty/error states are usable; anonymous guests can still book; location saves have consistent labels.

## Sprint 5 — Staff workspace

Status: implemented with synthetic browser checks of core workflows; final editor/access adjustments await targeted verification. Full check previously passed 200 tests. See sprint-4-5-review.md.

Refine Reservations first, then Branches, Rooms and Prices. Use clear table columns, filters, pagination, detail views and edit forms. Put paid and outstanding amounts beside the reservation state. Carry the brand through typography and restrained colour rather than guest-page hero treatments.

Done when: staff workflows use existing contracts, authorization states are clear, destructive actions are explicit, and save/validation/error feedback works. Do not introduce an unimplemented content-publishing CMS.

## Sprint 6 — Frontend release check

Status: open. Build and selected responsive/behavior checks exist; full release acceptance is not complete. See sprint-4-5-review.md for the remaining gates.

Review all routes, responsive layouts, keyboard focus, labels, contrast, reduced motion, image sizing, loading and recovery. Verify the production build in a browser, including unknown-route behavior. Run lint, client typechecking/build and relevant behavior tests. Document any API or content blockers separately.

Done when: a guest can navigate from discovery through the verified booking states, staff can use the verified operational flows, and remaining limitations are recorded with evidence.

## Review rhythm

For each sprint: implement one coherent slice, inspect the rendered result, exercise its interactions, report changes and limits, and update progress. Do not treat compilation as proof of a working booking journey. Review Sprint 1 before rolling its visual system across every screen.
