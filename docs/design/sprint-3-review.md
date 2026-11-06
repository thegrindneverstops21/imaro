# Sprint 3 — booking journey checkpoint

5 November 2026. In progress, guided by HOTEL_DESIGN_GUIDELINES.md sections 8–10 and 12.

## Implemented

- Guest input survives room/date navigation in Redux memory; it is not saved to browser storage. A successful hold clears the draft. Consent resets when the stay changes or the form remounts.
- Guest submission has a synchronous duplicate guard and respects the API's canBook flag.
- Review refreshes server status and amounts before payment. A changed amount is displayed and stops that payment attempt, requiring another deliberate action. The payment endpoint retains final authority.
- Review, payment return and confirmation adopt the guest typography, navy controls and warm surfaces. Mobile payment summary is collapsible. A shared ordered list exposes the current booking step.
- Payment return uses sequential polling with cleanup, retry on failure, and explicit expired/cancelled/paid/confirmed states. Returning from PayFast is never evidence of payment success.
- Confirmation uses server status, with a neutral print-reservation action and print CSS that removes navigation and controls.

## Verification

Seven new regression tests failed before implementation, then passed. `npm run check` passed: lint, both TypeScript checks, 198 tests in 21 files. Final lint and client production build passed after visual corrections.

Live local API/browser: entered a synthetic guest name and special request, followed Change room or dates, and returned. Both values were retained; consent remained unchecked.

Browser-only synthetic fixtures (all payment writes blocked):

- Changed the server total from R3,750 to R4,000 before Continue. Review displayed the updated total and an acknowledgement message without attempting payment.
- Continued again with the updated amount. The blocked payment request displayed an error and re-enabled the action.
- Expired payment-return state offered search/manage recovery and stopped the waiting message.
- Paid/pending-approval state explicitly awaited hotel approval.

Reviewed review and confirmation screenshots at 1440, 768 and 390px. The first confirmation inspection found print-button contrast below the threshold; corrected the inherited outline style. Final confirmation inspection: zero failures, four warnings for the retained brand typography/palette and development-server inspection. Review fixture findings about `example.com` and the fixture banner are test-harness findings, not production content. Screenshots are in ignored `.taste-skill/review-sprint3/` and `.taste-skill/confirmation-sprint3-final/`.

## Remaining work

1. Manage Booking is now refined; verify lookup changes, cancellation recovery and copy-link feedback in the browser. See sprint-4-5-review.md for the later implementation checkpoint.
2. Render and inspect printed output; print CSS alone is not print verification.
3. Complete layout-matched loading and remaining recovery/empty states. Verify all guideline breakpoints, keyboard navigation and real-device touch.
4. Guest drafts intentionally do not survive a full reload or closed tab. Reload-safe retention is not claimed.
5. Live PayFast redirect/ITN, late-payment handling and deployed-origin behavior remain separate integration checks. No live reservation or payment was created during this slice.

Visual assessment: the stay, amount due and next action are readable and consistent with discovery. The review screen still has a long mobile flow; its collapsible summary helps, but further shortening should preserve required terms and price context. The work is not a declaration that Sprint 3 or the hotel guideline's full definition of done is complete.
