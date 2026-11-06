# Guest journey investigation - 6 November 2026

Scope: focused source inspection in imaro-clean. No test suite, browser run, database writes or application edits. Findings describe code paths, not observed production incidents.

## High-priority findings

1. Property selection is not dependable. /branches is availability-filtered; BrowsePage selects the first returned branch if the requested slug is absent. useBranchInfo does the same for hotel/contact pages. A saved/deep-linked unavailable property can therefore show a different property instead of explaining why the requested property is unavailable. Fix with a published-property catalogue and explicit selected-property/availability states.
2. Consent can reference absent terms. BookingPage renders policies only when supplied, but always requires agreement to a cancellation-policy anchor. With no policies the target does not exist; generic policies also do not prove cancellation terms were shown. Require an actual cancellation policy or provide an honest, actionable missing-policy state before taking consent.
3. Guest reservation recovery is incomplete. BookingPage stores manageToken only in localStorage. Receipt tells guests to keep it safe but does not provide a recovery/export flow. CopyManageLink intentionally excludes the token. A guest on another browser cannot rely on the copied reference link alone. Provide a deliberate secure access delivery/recovery mechanism; do not expose tokens in public links by default.
4. Browser storage failure can make a successful hold look failed. BookingPage POSTs the hold, then writes the token inside the same try block. If localStorage throws, the error is displayed as a failed submission despite the server hold existing. Handle persistence separately and preserve the successful reference/token in memory with recovery instructions.

## Journey friction and recovery gaps

- Login drops intent: SignInPage always navigates to /profile; saving while signed out routes to /profile without retaining the requested save. Restore the originating page/action after authentication.
- Inconsistent sign-in entry: App wires /profile's sign-in/create button directly to Google, while /favorites routes to /login with password and Google options. Use one consistent sign-in entry.
- Unavailable room cards have no room-detail link. Guests cannot inspect that room and then choose different dates. Keep details accessible and gate only booking.
- Review offers Back to rooms but no direct edit-guest-details path. Guest draft is cleared once the hold is created; returning through selection can create another hold rather than edit the existing reservation. Provide a clear edit flow that handles the existing hold explicitly.
- Review displays a hold deadline but does not update its status as time passes. Expiry is discovered on another request; provide an expiry state and a direct search-again path.
- Payment return checks server truth correctly, but a request error halts polling until manual retry. Public callback wiring and ITN behavior remain separate integration gates; successful PayFast checkout alone does not establish a confirmed hotel booking.
- Password login has no password-reset route/UI in the inspected auth implementation.
- Guest draft survives route navigation only, not reload. State this limitation or introduce proportionate session recovery that respects personal-data handling.
- Contact/dining/property imagery completeness depends on supplied content. Missing content is currently acknowledged; do not replace it with invented information.

## What already works in the source

Guest checkout does not require an account. Stay inputs persist; explicit searches separate draft dates from submitted availability. Checkout displays total/VAT and room context. Review rechecks amount/status before payment and guards duplicate clicks. Payment return does not treat a redirect as proof of payment. Pending hotel approval is distinguished from confirmation. These should be preserved.

## Intended journey

Choose a property -> inspect its rooms even if unavailable -> choose dates/party -> select a bookable offer -> enter/edit guest details -> read actual cancellation terms -> review one reservation hold -> pay -> see verified payment and hotel-approval status -> retain secure access and manage the stay.

Prioritize property identity/visibility, real policy consent and reservation recovery first; then consistent login/resume and editable checkout. Coordinate with admin-flow-investigation.md so new branches, rooms, prices and policies produce predictable guest-facing states.

## Repairs applied — 6 November 2026

Code changes address the four high-priority findings plus the login, unavailable-room and hold-expiry friction items:

- Property identity: BrowsePage and useBranchInformation no longer replace an absent requested slug with the first available property. The requested property keeps its own name, rooms and policies with an explicit no-availability notice; an unknown or unpublished location gets a recovery state. Unavailable room cards still open room details and gate only booking.
- Policy consent: Guest details require an actual cancellation policy. The acknowledgement links to the rendered cancellation disclosure; when none is supplied, the form explains that agreement cannot be recorded and disables Continue.
- Reservation access: booking tokens are kept in memory as well as localStorage, so a successful hold survives blocked storage. Review, confirmation and manage pages offer a deliberate show/copy of the reference and token (never in a public URL) and warn when the browser could not persist them.
- Sign-in intent: password and Google sign-in return to the originating page, and a save started while signed out resumes after sign-in. Profile now uses the same /login entry as the rest of the app.
- Hold expiry: review updates as the hold runs out, disables PayFast, and offers search-again.

Not implemented here: email delivery of access details, a true unpublished-property catalogue endpoint, edits to an existing hold, and password reset. Verification: lint, both TypeScript checks and 13 focused unit tests pass, including new sign-in path, hold-expiry and storage-failure regressions. Browser rendering, real storage failure and live payment were not rechecked.
