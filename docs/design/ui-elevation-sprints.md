# UI elevation sprint status

Updated 6 November 2026 from source in `imaro-clean`. This replaces the pre-implementation plan. Preserve Imaro, Cinzel, Source Sans 3, Hugeicons and the hotel design guidelines. No redesign is being reopened.

## Status and evidence

Implemented means present and connected in source. It does not mean browser-verified. No tests, builds or browser checks were run for this documentation update or the latest styling/navigation repairs. Earlier validation results belong to earlier revisions.

| Sprint | Implemented in source | Remaining / limits |
| --- | --- | --- |
| A — Foundation | Root dependencies include Tailwind v4, HeroUI v2, framer-motion and styling helpers. Vite uses the Tailwind plugin. `styles/index.css` imports theme/utilities without preflight; `hero.mjs` configures Imaro primary/focus/surface tokens and restrained radii. `main.tsx` wires HeroUI navigation and MotionConfig reduced-motion preference. Shared UI exports and motion constants exist. | Partial: no dedicated `tokens.css`; Imaro HeroUI token mapping is now present but unverified in the browser. The UI barrel re-exports library components, not themed wrappers. Compatibility, rendered coexistence and bundle impact have not been verified for this revision. |
| B — Public surfaces | Browse uses HeroSection, RoomCard and Reveal; InformationSections uses local BentoGrid/BentoCard; RoomDetails uses RoomGallery with image controls, thumbnails and arrow-key handling. | Core components wired; gallery is not a lightbox. Unavailable rooms retain detail links while booking eligibility remains separate. Responsive, keyboard/touch and reduced-motion behavior await current browser verification. |
| C — Booking | BookingPage uses HeroUI Input/Textarea/Checkbox and CheckoutSummary; Browse uses location/guest/room Select controls. Review uses CheckoutSummary and HoldCountdown with one parent-owned one-second clock plus click-time expiry checking. Required consent and explicit feedback are implemented. | Partial: dates remain native inputs and policies remain native disclosure UI; DatePicker/Accordion migration is not implemented. BookingReceipt calls HoldCountdown without required `now`, so receipt countdown wiring is incomplete. No current expiry/print/browser verification. |
| D — Account/admin | AccountTabs uses HeroUI Tabs, ProfileForm uses Input, ReservationTable uses status Chips. | Partial: broader sign-in, notifications, account-list and admin Table/Modal/Drawer/editor migration is not implemented. Existing operational screens remain; exports alone do not establish adoption. |
| E — Release verification | Earlier sprint review files retain prior results. Latest targeted changes have source/whitespace review only. | Open: current type/build health, responsive layouts, keyboard flow, reduced motion, print, hold expiry and integration checks have not been established for the migrated revision. User prefers manual verification and no broad test runs. |

## Implemented behavior and deviations from the original plan

- Branch selection writes the `branch` query parameter while preserving other parameters and the hash. The URL is the selection source for refresh and history navigation.
- Marked HeroUI controls are excluded from legacy native input/select/textarea and label rules. Mobile search grid selectors target direct field wrappers.
- The room-count hint is calculated locally from draft guest/room counts and capacities supplied by the API. It is an estimate, not a fresh server availability response; server booking totals and allocations remain authoritative.
- Review's one-second interval updates local time; it is not a periodic server revalidation request. The original plan's description of a retained 15-second server poll was inaccurate.
- MotionConfig requests reduced-motion support and several presentation wrappers explicitly check the preference. Complete reduced-motion behavior across the gallery and animated summary remains unverified.
- Local Aceternity-style components are in `components/aceternity/`; no full Aceternity library migration is claimed.

## Next bounded work

1. Repair the missing receipt countdown clock prop and its ownership.
2. Manually check branch selection with Back/Forward/refresh, mobile search fields, checkout labels and consent.
3. Confirm the remaining A–D migration items are still wanted before expanding them. Keep E open until current evidence exists.

PayFast checkout success is user-reported. Public HTTPS callbacks, real ITN processing, deployment and device checks remain separate release gates. See [progress](../progress.md) and the historical [frontend sprint plan](frontend-sprints.md).
