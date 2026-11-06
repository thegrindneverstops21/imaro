# Hotel information, accounts and staff review

## Frontend checkpoint — 5 November 2026

The governing brief remains `docs/design/HOTEL_DESIGN_GUIDELINES.md`; retain Imaro, Cinzel, Source Sans 3 and Hugeicons. Backend polish remains deferred.

- Sprint 3: Manage Booking now separates lookup input from the loaded reservation/token, clears stale results, guards cancellation, shows paid/outstanding amounts and reports copy-link success/failure. Checkout has layout-matched loading. Rendered print output and remaining Manage Booking browser checks are still outstanding.
- Sprint 4: `/hotel`, `/stay-information` and `/contact` use supplied branch information, policies and contact links. Missing dining information is explicit; illustrative imagery is labelled. Account pages share the guest styling, and notifications support Escape/focus restoration. Hotel inspection reported zero failures; its desktop capture showed loading, while the mobile capture showed loaded content. Authenticated account verification remains pending.
- Sprint 5: Staff reservations have server search/status filters, branch scope and pagination. Inline editors replace prompts, failed saves retain input, duplicate writes are guarded and destructive actions require confirmation. Synthetic browser checks covered filtering, failed reservation edits and the rooms/rates/branches views with all writes blocked. Final rate-edit/time-field/access-panel adjustments still need targeted browser verification.
- Sprint 6 remains open: printed receipt, production-build browser check, remaining responsive/keyboard/reduced-motion checks and content/integration gates. Live PayFast behavior and field performance metrics are not verified by these previews.

Prior full validation passed 200 tests across 22 files, lint and both TypeScript checks. This checkpoint does not claim all sprint acceptance criteria are met. Continue in bounded slices with targeted checks and a Markdown checkpoint; avoid repeating full audits without a new failure or relevant change.
Closeout verification: lint, client TypeScript and production build passed on 5 November 2026. Vite required an approved retry outside the sandbox after a child-process EPERM. The synthetic preview page was removed from client/ and retained only in ignored .taste-skill/. No full test-suite rerun in this documentation/cleanup pass; the 200-test result above is from the preceding implementation run.
