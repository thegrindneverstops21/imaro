# Imaro guest design

Recorded 5 November 2026 from the first implemented frontend sprint. Applies to the shared guest header/footer and discovery pages. Guest details, review/payment, payment return and reservation confirmation adopt this system in Sprint 3. Manage booking, account interiors and staff screens remain pending.

## Identity

Preserve Cinzel for display headings, Source Sans 3 for body and controls, and Hugeicons for interface symbols. The wordmark remains Imaro. Use the selected branch's imagery and factual content; photographs are labelled illustrative in the footer.

## Surface and hierarchy

Navy #16324f is the text and action colour. Discovery surfaces use #f5f4f0 with #e9e8e3 for the search area and supporting information. White is reserved for contrast, including the hero action. Bright blue is not used on these surfaces.

Hero headings use two lines, 38–88px with 1.08–1.12 line height. Body text is 16–18px; supporting labels are 13–14px. Controls use sentence case. Do not restore eyebrow labels, decorative image counters or promotional filler sections.

## Composition

Home: simple navigation, immersive branch photograph, concise introduction and search action, full-width booking form, two room highlights, link to the full catalogue, stay information, and branch description. Rooms: title and search followed by all room types. Keep real room specifications and rates together.

Outer margins are 5% on discovery content. Room photographs use a consistent 4:3 crop; two columns on larger screens and one on mobile. Search uses six columns on desktop, three at intermediate widths, and two on mobile with location and submit spanning both.

## Interaction

Mobile navigation opens below the header, closes on selection or Escape, and returns focus to its button on Escape. A skip link reaches main content. Mobile booking access appears inside the existing sticky header after the search area passes above it; there is no bottom overlay. Sign-in/profile access is in the mobile menu. Checkout has no competing header booking action.

Room search distinguishes draft dates/guest counts from the submitted stay used for prices. Changed inputs show an update prompt. A single location save control names what is saved. Room sorting offers recommended order, lowest nightly rate and largest room. Room detail puts the title before the gallery and shows the booking summary immediately after the gallery on mobile, ahead of amenities and policies.

One gentle arrival animation affects the hero photograph; reduced motion disables it. Keep motion restrained rather than adding repeated entrances to satisfy an animation count.

## Implementation

Scoped guest rules live in client/src/styles/guest.css, imported after existing styles. Legacy checkout/account/staff styling remains for later sprints. Consolidate obsolete discovery selectors once the visual direction has been reviewed; do not spread another global override layer.

## Governing brief

Use docs/design/HOTEL_DESIGN_GUIDELINES.md as the product/design authority. This file records implementation choices, not a replacement brief. Sections 8–10 guide checkout: visible server rates, mobile summary disclosure, policies before consent and distinct payment states. The mobile header CTA adapts section 6 to avoid the observed bottom-bar obstruction.

## Booking state and recovery

Guest input stays in Redux memory during room/date navigation; it is not persisted to browser storage and clears after a hold is created. Consent is requested again on return. Review re-fetches the reservation before payment and stops when status or amounts change. Payment return distinguishes server-confirmed, pending approval, expired and cancelled states. The shared numbered progress list marks the current step. Mobile payment summaries are collapsible, and confirmation has a print stylesheet.
