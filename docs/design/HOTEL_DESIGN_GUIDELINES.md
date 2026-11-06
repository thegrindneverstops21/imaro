# Luxury Hotel Website — Design & Implementation Brief

> **Instructions for the coding agent:** Use this document as a product/design specification for improving an existing hotel or accommodation website. Draw inspiration from the linked references, but create an original visual identity and implementation. Inspect the current repository, framework, routes, components, design tokens, booking flow, and APIs before changing anything. Preserve working functionality and do not invent rates, availability, property policies, or payment integrations.

## 1. Objective

Build a polished, fast, accessible, conversion-focused luxury hospitality experience that feels editorial, calm, premium, and trustworthy. Combine immersive storytelling with an exceptionally clear path from discovering a property to selecting a room and completing a reservation.

**Design pillars:** visual restraint; high-quality photography; expressive typography; generous whitespace; intuitive navigation; transparent pricing; smooth but lightweight motion; accessible, mobile-first interactions; and fast perceived performance.

## 2. Reference websites and intended takeaways

These are inspiration references, **not instructions to reproduce proprietary assets, exact layouts, animations, source code, or branding**. Verify current live behavior where possible; reference pages and booking URLs may change, expire, or require session data.

| Reference | URL | Principle to adapt |
|---|---|---|
| Rosewood Hong Kong | https://www.rosewoodhotels.com/en/hong-kong#full-width-carousel-item-bf5c3b6337-tabpanel | Cinematic, full-bleed homepage hero; immersive imagery; minimal overlay text; restrained carousel controls. |
| Four Seasons | https://www.fourseasons.com/ | Refined loading/skeleton states, strong trust cues, polished booking summary or checkout slip, elegant transitions. |
| Aman Nai Lert Bangkok booking | https://www.aman.com/book/aman-nai-lert-bangkok | Editorial room-selection presentation: large photography, concise descriptions, clear rate/benefit details, unobtrusive booking actions. The supplied deep link includes transient booking/session parameters; use the stable booking entry URL instead. |
| Belmond accommodation booking | https://www.belmond.com/en/booking/select-accommodation?rooms=1&adults=2&startDate=2026-10-20&endDate=2026-10-21&productId=COP&fromBookingModal=1 | Clear accommodation selection and reservation progression, visible totals, date/guest context, confidence-building checkout flow. The example dates are historical; never hardcode them. |
| Little Donkey Bay | https://www.littledonkeybay.co.nz/ | Surface property-specific house rules and practical stay information in a clearly labeled, readable section. Do not copy their actual rules. |
| UP Hotel Agency performance article | https://uphotel.agency/how-we-reduce-load-times-without-sacrificing-design/ | Optimize image delivery, render paths, font loading, scripts, and motion without sacrificing visual quality. |
| Cvent hotel website design article | https://www.cvent.com/en/blog/hospitality/best-hotel-website-design | Inspiration for hospitality UX, compelling storytelling, mobile usability, and direct-booking conversion. |

## 3. Required site architecture

Adapt to existing routes and architecture; avoid creating duplicate pages if equivalent ones already exist.

1. **Homepage:** cinematic hero, property introduction, featured accommodations, amenities/experiences, location, social proof where real, and booking calls to action.
2. **Rooms & suites listing:** rich room cards, filters where justified, occupancy and bed information, photo galleries, rates/availability where connected.
3. **Room detail:** image gallery, room description, size, occupancy, amenities, inclusions, policies, and prominent booking action.
4. **Booking flow:** dates/guests → room/rate selection → guest details → review/payment (only if payment is integrated) → confirmation.
5. **Stay information:** check-in/out, house rules, cancellation, accessibility, parking, children, pets, and contact details when supplied.
6. **Shared components:** responsive navigation, footer, sticky booking CTA, date/guest picker, room card, price summary, loading skeleton, toast/error states.

## 4. Visual system

### 4.1 Art direction

- Create a quiet luxury aesthetic rather than a crowded travel marketplace.
- Use full-bleed or generously cropped authentic property imagery; prioritize atmosphere and architectural details.
- Maintain consistent photo treatment, aspect ratios, spacing, and visual hierarchy.
- Avoid excessive gradients, glassmorphism, shadows, borders, decorative icons, and animated effects.
- Do not invent property imagery or use competitor photos as if they represent this property. Use authorized assets; use clearly labeled placeholders if unavailable.

### 4.2 Typography and color

- Pair an elegant editorial serif for headings with a highly legible sans-serif for UI and body copy, subject to existing brand identity.
- Establish fluid type sizes and a consistent spacing scale.
- Suggested palette direction: warm ivory, stone, charcoal, muted bronze/olive accents; adapt to the property's brand rather than applying these blindly.
- Ensure sufficient contrast, visible focus indicators, and readable text over photographs via a subtle overlay or localized scrim.
- Use no more than two font families and limit downloaded weights.

### 4.3 Motion

- Prefer subtle fades, gentle image reveals, and short transitions (roughly 150–350 ms for UI feedback).
- Never block navigation, booking, or primary content behind entrance animations.
- Honor `prefers-reduced-motion` and disable autoplay motion where appropriate.

## 5. Homepage hero — Rosewood-inspired

**Priority: high.**

- Build an immersive hero occupying approximately 85–100svh on larger screens, with a sensible shorter treatment on mobile.
- Use an optimized, high-quality property image; optionally support a small editorial carousel if multiple genuine images exist.
- Overlay a concise property name/headline, short value proposition, and one prominent CTA (e.g., **Explore stays** or **Book your stay**).
- Keep navigation legible and unobtrusive. It may start transparent over the hero and transition to a solid surface as the page scrolls.
- If carousel is used: provide visible previous/next controls, current slide indicator, keyboard operation, meaningful image alternatives, and a pause control for automatic rotation. Prefer no autoplay by default.
- Keep headline text and CTAs in stable positions when slides change.
- On mobile, ensure the focal point is preserved and controls do not overlap text.

**Acceptance criteria:** hero is readable at 320px width; primary CTA is usable; no layout shift during image loading; no hidden content due to viewport/browser chrome; keyboard and reduced-motion behavior work.

## 6. Scroll-aware “Book now” button

**Priority: high.** The user explicitly requests a booking button that appears when scrolling down.

- Keep the booking CTA accessible in the header or hero initially.
- After the visitor scrolls beyond the hero or a defined threshold, reveal a persistent **Book now** action.
- On desktop, use a discreet sticky header CTA or floating action aligned with the layout.
- On mobile, prefer a fixed bottom booking bar respecting safe-area insets; do not obscure content, consent controls, chat widgets, or form actions.
- Avoid duplicate competing CTAs when the primary booking button is already visible.
- Smoothly reveal/hide the element without jank; avoid scroll-event state updates on every frame (use `IntersectionObserver` when practical).
- Clicking the button should open the actual date/guest booking interface or navigate to the existing booking route, preserving selections.
- Hide or adapt the sticky CTA on checkout, confirmation, or other screens where it would interfere.

**Acceptance criteria:** the CTA appears reliably after the hero leaves view, is keyboard-accessible, has a sufficiently large tap target, and works on mobile Safari/Chrome.

## 7. Rooms and suites — Aman-inspired

**Priority: high.**

- Use spacious room cards with substantial photography and minimal clutter.
- Display only verified attributes: room name, occupancy, area, bed configuration, view, key amenities, inclusions, and cancellation conditions as available.
- Show **From [currency][amount] / night** only when a real rate is available and properly scoped to dates/guests/taxes; otherwise show **Check availability**.
- Provide a clear **View details** action and a prominent **Select room** / **Book this room** action.
- Room details should have a responsive photo gallery with thumbnails or controls, accessible lightbox where appropriate, and an at-a-glance facts section.
- Preserve selected dates and guest counts when navigating between room cards and booking.
- Distinguish room type, rate plan, and available inventory; never treat them as interchangeable.
- Show unavailable states honestly and provide a route to change dates.

**Acceptance criteria:** users can compare rooms without opening each one; room/rate selections persist; images do not jump as they load; room descriptions remain readable on narrow screens.

## 8. Booking journey — Belmond / Four Seasons-inspired

**Priority: critical.** Optimize for clarity and trust rather than visual novelty.

### 8.1 Steps

1. **Search:** select check-in, check-out, room count, adults, and children where supported.
2. **Choose accommodation:** display available rooms, relevant rate plans, and transparent pricing.
3. **Guest details:** collect only information required for the reservation.
4. **Review and pay:** show a complete summary and payment method only if a real, secure integration exists.
5. **Confirmation:** show a confirmed booking reference only after the server verifies the reservation.

If the existing backend uses a different step order, retain its valid contract and improve the UI around it.

### 8.2 Booking summary / checkout slip

Implement a compact, elegant, easily scannable reservation summary:

- Property and selected room/rate name.
- Check-in and check-out dates, number of nights, guests, and room count.
- Nightly rate breakdown when provided.
- Taxes, service fees, mandatory charges, deposits, and discounts, explicitly labeled.
- **Total payable now** and **amount due at property** when applicable.
- Currency, cancellation terms, and modification links.
- A single clear final action: **Confirm booking** or **Pay securely**, as appropriate.

On desktop, keep the summary visible in a side column if space allows; on mobile, use an accessible collapsible summary near the top and again before final confirmation. Do not let a sticky summary overlap form fields.

### 8.3 Price integrity and checkout safety

- All price totals and availability must come from the server or trusted booking provider; never compute authoritative totals from UI-only mock values.
- Revalidate inventory and totals before payment/confirmation.
- Show any changed price clearly and require acknowledgment before proceeding.
- Never claim a payment or booking succeeded without confirmed backend response.
- Use provider-hosted payment fields or established PCI-compliant integration; never store raw card details.
- Prevent accidental duplicate submissions; use idempotency where supported.
- Handle sold-out inventory, expired holds, payment declines, network errors, and session expiry with recovery paths.
- Do not fabricate trust badges, ratings, testimonials, availability urgency, or discount claims.

## 9. Loading states — Four Seasons-inspired

**Priority: high.**

- Replace blank screens and generic full-page spinners with layout-matched skeletons for room cards, image galleries, and booking summaries.
- Use restrained shimmer or static skeletons; disable shimmer under reduced-motion preferences.
- Keep existing content visible while refreshing data where safe; communicate that the update is in progress.
- Use small inline progress feedback for date searches, rate refreshes, and submit buttons.
- Reserve dimensions for images and cards to prevent cumulative layout shift.
- Announce asynchronous status updates through appropriate accessible live regions without repetitive announcements.
- Provide empty, error, retry, and no-availability states distinct from loading.
- Do not use artificial loading delays just to showcase animation.

**Acceptance criteria:** loading feedback appears quickly, does not flicker excessively, and never misrepresents pending or failed reservations as successful.

## 10. House rules and policies — Little Donkey Bay-inspired

**Priority: high.** Include a dedicated **House rules** section on property/stay information and make relevant rules available before final booking confirmation.

Recommended structured fields (populate only from verified property information):

- Check-in and check-out times, including late-arrival procedures.
- Maximum occupancy and visitor policy.
- Children and extra-bed rules.
- Pet policy.
- Smoking and vaping restrictions.
- Quiet hours and parties/events policy.
- Damage, security deposit, and cleaning requirements.
- Parking, access, and accessibility notes.
- Cancellation, no-show, and refund policies (link to full terms).
- Any property-specific restrictions and contact details.

Use a concise summary with expandable details or grouped headings. Do not bury critical restrictions inside a collapsed panel alone. If policy data is missing, flag it as **content needed** in development rather than inventing terms. Ensure the checkout flow explicitly presents and links to applicable terms before consent.

## 11. Performance — design without unnecessary weight

**Priority: critical.** Apply performance practices inspired by the UP Hotel Agency article and modern web standards:

- Target **LCP ≤ 2.5s**, **INP ≤ 200ms**, and **CLS ≤ 0.1** at the 75th percentile on mobile, where measured in field data.
- Deliver responsive `srcset`/`sizes` imagery in modern formats such as AVIF/WebP when supported, with sensible fallbacks.
- Prioritize the actual LCP hero asset; do not lazy-load it. Lazy-load below-the-fold images.
- Use image dimensions/aspect-ratio placeholders to avoid layout shifts.
- Compress photos intelligently; avoid heavy autoplay background videos unless explicitly required and justified.
- Self-host/subset fonts where licensing permits; preload only critical assets; use appropriate `font-display` behavior.
- Reduce third-party scripts, unused JavaScript, oversized dependencies, and unnecessary hydration.
- Code-split noncritical routes/components, cache static assets, and use server rendering or static generation where supported.
- Avoid scroll handlers that cause layout thrashing and large animation libraries for simple effects.
- Measure with Lighthouse, WebPageTest, or browser performance tooling; compare before and after.

## 12. Responsive design and accessibility

- Design and test at 320, 375, 768, 1024, 1440, and 1920px widths, plus landscape mobile.
- Ensure tap targets are comfortably sized, forms work with mobile keyboards, and bottom CTAs respect safe-area insets.
- Use semantic landmarks, logical heading order, descriptive labels, alt text, keyboard-operable menus/carousels/dialogs, visible focus states, and properly managed dialog focus.
- Meet **WCAG 2.2 AA** where feasible, including contrast, reflow, error identification, and reduced-motion support.
- Date pickers must support keyboard entry/navigation and screen readers; include clear validation for invalid dates, minimum stays, and guest limits.
- Avoid using color alone to communicate price changes, errors, or availability.
- Respect locale-specific date formats, currency, language, and time zone; do not infer currency from browser locale alone.

## 13. SEO, analytics, and trust

- Use unique titles/meta descriptions, canonical URLs, structured data where appropriate, sitemap, and indexable accommodation descriptions.
- Make direct booking prominent without obstructive popups or deceptive scarcity messages.
- Track meaningful events only through the existing consent-aware analytics stack: booking CTA clicks, availability searches, room selections, checkout steps, and successful confirmed reservations.
- Do not send guest PII or payment data into analytics.
- Include genuine contact details, real policies, and verified testimonials only when supplied.

## 14. Component inventory

Build or refine these reusable components as appropriate for the existing stack:

`SiteHeader`, `HeroCarousel`, `BookingCTA`, `StickyBookingBar`, `BookingSearch`, `DateRangePicker`, `GuestSelector`, `RoomCard`, `RoomGallery`, `RoomDetails`, `RatePlanCard`, `BookingStepper`, `ReservationSummary`, `PriceBreakdown`, `CheckoutForm`, `LoadingSkeleton`, `EmptyAvailabilityState`, `HouseRules`, `PolicyAccordion`, `SiteFooter`.

Prefer existing design-system components and established dependencies. Do not add new libraries without a clear benefit.

## 15. Implementation instructions for the agent

### Phase A — Audit

1. Inspect repository structure, package manager, framework, design system, environment configuration, API contracts, and existing pages.
2. Identify reusable components and existing booking/payment integrations.
3. Record current UX problems, performance baseline, and accessibility issues.
4. Confirm which property assets, room data, pricing data, and house rules are real and available.
5. Produce a short implementation plan and identify blockers; ask for missing business-critical details before inventing them.

### Phase B — Build

1. Establish design tokens and responsive layout primitives.
2. Implement hero and header behavior.
3. Implement scroll-triggered booking CTA.
4. Refine room cards and room detail views.
5. Improve search, selection, booking summary, and checkout states.
6. Add skeleton/loading/error/empty states.
7. Add verified house rules and policy display.
8. Optimize assets, bundle loading, and accessibility.

### Phase C — Verify

1. Run the project's formatter, linter, type checker, and tests where available.
2. Test primary booking paths and failure/retry scenarios.
3. Test responsive layouts, touch interactions, keyboard navigation, and reduced motion.
4. Audit performance, especially hero LCP and image payloads.
5. Verify prices, totals, taxes, and booking confirmation against backend responses.
6. Check that no competitor assets, trademarks, or text were copied.

## 16. Definition of done

- [ ] Homepage has an immersive, original, responsive hero.
- [ ] Booking CTA becomes visible and usable after scrolling beyond the hero.
- [ ] Rooms display genuine photos, accurate details, and clear actions.
- [ ] Dates and guests persist through the booking flow.
- [ ] Checkout summary transparently explains all available charges and totals.
- [ ] Loading, empty, error, and success states are distinct and accessible.
- [ ] House rules are present and based on actual property policies.
- [ ] No fabricated rates, availability, testimonials, policies, or confirmations.
- [ ] Responsive and keyboard/screen-reader workflows are validated.
- [ ] Performance metrics are measured and regressions documented.
- [ ] Existing working functionality remains intact.

## 17. Agent response format

At the end of implementation, report:

1. **Audit findings:** current stack, relevant routes, and important constraints.
2. **Changes made:** pages/components and why.
3. **Files modified:** concise path list.
4. **Verification:** tests and commands run, results, responsive/accessibility/performance checks.
5. **Open items:** missing assets, backend connections, policy content, or unresolved issues.
6. **Next steps:** only actionable, prioritized follow-ups.

**Final directive:** Prioritize a real, working, fast booking experience over decorative effects. Preserve the property's unique identity. Implement inspiration, not imitation. When information is missing, use explicit placeholders and document what must be provided rather than inventing business data.
