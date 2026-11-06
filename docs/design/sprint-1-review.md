# Sprint 1 implementation review

5 November 2026.

## Delivered

Refined the existing photographic direction in React. Removed the announcement strip, repeated eyebrows, image numbering and the empty Dining promotion. Preserved brand typography and icon library. Added readable guest controls, a compact mobile menu, skip link, Escape behavior, footer navigation and scroll-aware mobile booking access.

Home now previews two room types; /rooms exposes the full catalogue without resetting Redux stay dates or guest counts. Existing room URLs and home anchors remain. Unknown routes show a recovery page. Stay information has a stable anchor and a loading/unavailable state. Header booking actions are suppressed during checkout.

## Evidence

- Client TypeScript and production build passed.
- Compiled frontend rendered at 1440, 768 and 390px on port 4173; reviewed its error-state screenshot sheets. Live API data is blocked on that preview origin, so this is not a production integration pass.
- ESLint passed with zero warnings.
- Impeccable mechanical detector returned no findings for the changed UI targets.
- Live API homepage captured at 1440, 768, 390 and 320px; desktop/tablet/mobile screenshot sheets reviewed. The new headline fits two lines at each width. Running body text increased from 11px to 16px.
- Browser verified mobile menu open/close and Escape focus restoration; Home to full catalogue to Classic room details preserved 6–8 November 2026, two guests, one room and the R2,500 two-night total.
- Existing API was started for read-only room data. No booking/payment mutation, migration or backend source change.

## Visual assessment and limits

The hierarchy is clearer, room comparisons have consistent image sizes, and the header is substantially quieter. The locked typography, existing branch photographs and selected location provide continuity. This is a first reviewable implementation, not the completion of the entire frontend plan.

The Design Taste inspector still flags its minimum animation count and a heading passing beneath the fixed mobile booking bar during scrolling. These are not reported as clean passes. Motion is deliberately restrained; the bar has footer/scroll padding, but its overlap should be reviewed on a real phone before release. Inspector warnings also include the existing warm palette, number of type sizes, absence of video and a small-text item. No footage or replacement property assets were invented.

The live integration was inspected on port 5173. Port 5174 is outside the API's configured allowed origin and shows the fetch-error state. Production preview on 4173 likewise requires the deployment origin to be configured for live API data; this pass does not change backend CORS settings.

Remaining for later sprints: improve search draft/submission behavior and stale-response handling, refine room details and galleries, make saved-location controls clearer, complete dedicated hotel/contact information, and restyle checkout and staff workflows. Previously persisted past dates can still yield validation errors until changed; retain as a Sprint 2 search-state fix.
