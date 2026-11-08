# Imaro project preferences

Last updated: 1 November 2026.

## Brand and design

- The application and hotel brand is **Imaro**. Stillmere is the name used by the older prototype, not the current product name.
- Continue using `docs/design/` for the visual direction. Older references to Stillmere describe the design history; they do not authorize reverting the brand.
- `docs/design/HOTEL_DESIGN_GUIDELINES.md` is an active reference for upcoming work. Apply its relevant guidance to the existing API and the user's agreed step; it does not authorize implementing every section at once.
- Aim for a luxury hotel experience: calm typography, strong photography, clear booking information, and considered spacing.
- **Locked font pairing: Cinzel + Source Sans 3**, as requested by the user. Cinzel is used for the heading/display role; Source Sans 3 is used for body and interface text. Both fonts are loaded from Google Fonts in `client/index.html`.
- Use **Hugeicons**, through `@hugeicons/react` and `@hugeicons/core-free-icons`. Do not substitute Unicode symbols or emoji for interface icons. “Hugeicons” names the library, not oversized icon dimensions.
- Keep decorative icons hidden from assistive technology and label their buttons. Show toggle state accessibly.

## Implementation and collaboration

- Agreed guest pages: Home, Rooms & Suites, Room Details, Our Hotel, Stay Information, and Contact. Dining is a section within Our Hotel initially, not a separate page.
- Agreed booking pages: Guest Details, Review & Payment, Booking Confirmation, and Manage Booking. Dates and room selection remain in Rooms & Suites / Room Details. Payment is clearly labelled as simulated until a real integration exists; confirmation reflects server status.
- Deadline account scope: Google OAuth, My Profile, and Saved Stays. Defer email/password registration, password recovery, and the Sign Up page from the 6 November delivery unless the lecturer explicitly requires them. This supersedes the earlier email/password requirement. Guest checkout remains available without an account.
- My Profile initially contains basic account information and a Manage Booking link. Saved Stays retains location-based favorites. Account-linked booking history is deferred until API support exists. Manage Booking uses the reference and private token for viewing and cancellation. Agreed admin pages: Reservations (admin landing page), Branches, Rooms, and Prices. Reservations supports viewing, approval, modification, and cancellation; Branches manages locations; Rooms manages room types and inventory/status; Prices manages nightly rates.

- React, TypeScript, and Redux must match the API endpoints implemented in the earlier sprints.
- Work through further design changes **step by step** with the user. The initial page list is agreed (18 pages); approval of that list is not a request to implement pages yet.
- Prefer fewer lines of simple code. Avoid complex functions and unnecessary abstractions; choose the shorter approach when behavior and clarity are equivalent. Follow `docs/coding-guidelines.md`.
- Keep application state and preferences in Markdown. Update `docs/application-state.md` after meaningful changes, and update this file when the user changes a preference.
- Track completed work, remaining work, verification, and blockers in `docs/progress.md` after each agreed step.
- Distinguish implemented code from verified runtime behavior. Do not report a working booking flow solely because compilation passes.

## Precedence

The user's latest instructions take precedence over older design documents. Read this file alongside `docs/application-state.md` before continuing implementation.


## Delivery priorities (3 November 2026)

- Target first deployment on 4 November, ahead of the 6 November deadline; host choice and access still need to be established. This is a project milestone, not a scheduled autonomous deployment.
- Prioritize PayFast sandbox and webhook, profile/my-bookings endpoints, backend reviews/favourites/notifications, and admin room-type creation over password authentication.
- Remaining frontend scope: scroll-aware Book Now, Our Hotel with Dining, Contact, map/share, and completing the admin screens. Continue visual work step by step.

## Frontend focus — 5 November 2026
- Prioritise frontend design; defer backend polish.
- Work guest-first: homepage, rooms, then booking.
- Build directly in React rather than starting with image mockups.
- Follow the reviewable slices in docs/design/frontend-sprints.md.



## Verification scope — 8 November 2026
- For the application-wide error-handling refactor, the user requested saving tokens/credits and skipping tests and related verification runs. Report this limitation explicitly.


## Success feedback — 8 November 2026
- Use consistent custom success feedback throughout guest and staff flows: subtle green/checkmark styling, non-blocking auto-dismissing 3–5 second toasts for transient actions, and persistent banners or confirmation screens for major outcomes. Confirm accepted server actions without implying unverified payment or hotel approval.
## Admin forms — 8 November 2026

- Allow photos to be uploaded from a device as well as entered by URL.
- Keep staff modal layout and placeholder styling consistent. Selecting a room must not dismiss its modal.
