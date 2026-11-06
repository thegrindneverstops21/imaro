# Sprint 2 — rooms and room details

5 November 2026. Implementation complete; real-device touch and deployed-origin verification remain release checks.

## Delivered

- Mobile booking access moved from the bottom overlay into the existing sticky header. Sign-in/profile access is available in the mobile menu.
- Search date/guest/room fields are drafts until Check availability. Existing prices remain labelled with the submitted stay while edits are pending.
- Search and room-detail requests abort on replacement/unmount and ignore aborted responses. Failed searches do not expose old bookable results.
- Saved past or malformed dates recover to a valid stay; checkout must follow checkin. Six date-state regressions cover saved-state recovery, calendar validation and year boundaries.
- Room sorting supports recommended order, lowest nightly rate and largest room. One clearly labelled location-save control replaces misleading room-level hearts.
- Room details use a real image element, labelled previous/next buttons, thumbnail selection and an announced image count. The summary follows the gallery on mobile, ahead of amenities and policies.
- Nightly rate and full-stay total are distinct. Existing API prices, capacity and canBook decisions remain authoritative.

## Verification

`npm run check` passed: ESLint, both TypeScript checks and 191 tests in 19 files. The client production build passed. Impeccable's changed-target detector returned no findings.

Browser checks with existing local API data:

- Editing checkout from 8 to 9 November left the two-night R2,500 Classic total in place with an update prompt. Submitting updated it to three nights and R3,750.
- The room catalogue retained the submitted stay. Largest-room sorting put Suite before Deluxe and Classic.
- Scrolling below search revealed Book inside the header, with no fixed bottom bar.
- Gallery next-image keyboard activation, third-thumbnail selection and the cancellation accordion worked.
- Room detail displayed the retained three-night R3,750 total.

Design Taste app-mode inspection reported zero failures for catalogue and room details at 1440, 768 and 390px. Warnings retain the existing warm palette/display typography and the naturally different heights of gallery and summary. These are hotel discovery surfaces, so compact back-office title sizing is not the intended visual target. One intermediate capture coincided with reload/image loading; native browser inspection verified the loaded gallery. The settled recapture in `.taste-skill/room-details-verified/` completed with zero failures, and its desktop, tablet and mobile screenshots were visually reviewed with the photographs loaded.

No live booking, payment or authenticated favourite mutation was performed in this pass. Request cancellation was reviewed in code; artificial slow-response fault injection is not claimed. No new property imagery was sourced: existing illustrative API assets remain in use. Production build success is not deployed API/payment verification.

## Visual review

ROUND 2

Seen in one second: a room choice with its photograph and stay price.

Idea (one sentence): let guests compare physical room differences and understand the exact stay before entering checkout.

Live thing: submitted availability search, sorting and room-image selection.

Layout words by section: catalogue=search then comparison / details=title then gallery and summary / mobile=gallery then booking decision / policies=expandable information.

Scores (subjective): design 7.5 · usability 8 · creativity 6.5 · content 7 → overall 7.4.

Caps applied: illustrative property content limits distinctiveness; no verified property-specific art direction beyond the existing assets.

Remaining visible issues:

1. Room gallery and summary have different heights on tablet (tablet-page-01.jpg); keep the task-driven layout rather than adding filler. Revisit if richer confirmed room content changes the balance.
2. Three room types leave one empty half-row on desktop (rooms-final/desktop-page-01.jpg); a future comparison layout may use full-width rows, but do not duplicate a room to fill space.
3. Existing remote photographs can load after the initial frame (intermediate desktop capture); dimensions are reserved, but local optimized production assets remain a release-performance task.

## Next

Sprint 3: bring Guest Details, Review & Payment, payment-return/cancel, Confirmation and Manage Booking into this visual system. Preserve server status, retained guest details and real payment semantics. Backend polish remains deferred.
