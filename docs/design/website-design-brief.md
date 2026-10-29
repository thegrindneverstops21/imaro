# Stillmere Hotel — Website Design Brief

## Overall direction

The website should feel like a polished luxury hotel experience: calm, welcoming, spacious, and led by beautiful photography. It should help guests imagine their stay while making rooms, prices, policies, and booking easy to understand.

Keep Stillmere’s warm, understated identity, with soft neutral backgrounds, dark readable text, elegant headings, simple body typography, and generous spacing. Use consistent colours, buttons, and layouts throughout the guest website and staff CMS.

This brief records the agreed design direction. The references provide inspiration; the finished site should feel like one coherent Stillmere experience.

## Homepage and first impression

**Reference: [Rosewood Hong Kong](https://www.rosewoodhotels.com/en/hong-kong)**

- Replace the current split hero with a large, immersive photograph that gives an immediate sense of the property.
- Keep the opening headline short, with limited supporting text and a clear booking action.
- Make text readable over imagery through careful positioning and a subtle overlay where needed.
- Keep navigation simple: Rooms, Dining, Our Hotel, Contact, and Book Your Stay.
- Place check-in, check-out, and guest selection close to the opening section.
- Follow the hero with room highlights, hotel experiences, direct-booking benefits, and useful guest information.
- Use authentic property photography and confirmed information when available. Clearly label illustrative content in the prototype.

## Booking access while scrolling

- When the main booking area scrolls out of view, show a persistent Book Now button.
- On desktop, this can sit in a compact sticky header; on mobile, use an accessible bottom booking bar.
- Keep it visible without covering content, form fields, or other controls.
- Preserve the guest’s selected dates and guest count when they continue booking.
- During checkout, prioritise the current booking step instead of showing a competing Book Now action.

## Room browsing and room details

**Reference: [Aman Nai Lert Bangkok booking](https://www.aman.com/book/aman-nai-lert-bangkok)**

- Give room photography more space and visual prominence.
- Show the room name, short description, size, bed type, occupancy, key amenities, and price together.
- Make the difference between room categories easy to compare.
- Clearly distinguish the nightly rate from the total for the selected stay.
- State what is included and make cancellation information easy to find.
- Provide a room gallery and a clear action to select or book the room.
- Retain useful guest-capacity filtering and sorting.
- Include a helpful no-results state with options to change the search.

## Loading and feedback

**Reference direction: Four Seasons loading experience — [Four Seasons](https://www.fourseasons.com/)**

- Use a subtle, branded loading treatment when checking availability or processing a booking step.
- Explain what is happening with short messages such as “Checking rooms for your stay.”
- Avoid blank screens, sudden layout shifts, and repeated submissions.
- Show clear success, validation, and error states, with a way to retry when needed.
- Do not add artificial waiting time for the sake of an animation.
- Respect reduced-motion preferences.

## Checkout and booking confirmation

**Reference directions: Four Seasons checkout slip and [Belmond booking](https://www.belmond.com/en/booking/select-accommodation?rooms=1&adults=2&startDate=2026-10-20&endDate=2026-10-21&productId=COP&fromBookingModal=1)**

- Keep the journey clear: choose a room → guest and payment details → review → confirmation.
- Show progress and allow guests to go back without losing their information.
- Keep a readable stay summary alongside the form on desktop and readily accessible on mobile.
- Include the room, dates, guest count, number of nights, nightly rate, taxes, fees, total, and cancellation terms.
- Make the amount payable and any payment timing clear before confirmation.
- Ask only for information needed to complete the booking.
- Present the final confirmation as a polished receipt-style layout with a booking reference and stay details.
- Offer a printable or downloadable confirmation that matches the website’s visual style.
- Keep prototype bookings and payments clearly identified as demonstrations.

## House Rules

**Reference: [Little Donkey Bay House Rules](https://www.littledonkeybay.co.nz/house-rules)**

- Add a dedicated, clearly labelled House Rules section or page.
- Link to it from room details, the footer, and relevant booking steps.
- Organise policies into short, readable groups rather than one dense block of text.
- Cover confirmed arrival and departure times, smoking, pets, visitors, occupancy, quiet hours, and other relevant property rules.
- Keep cancellation and payment terms easy to reach alongside the house rules.
- Use illustrative labels for unconfirmed prototype policies; do not invent final hotel rules.

## Staff CMS prototype

The prototype should include a separate staff-facing content management area that demonstrates how the hotel maintains its website.

### Screens to include

| Area | What staff should be able to demonstrate |
| --- | --- |
| Pages | Edit homepage text, hero content, dining information, and hotel information. |
| Rooms | Edit room names, descriptions, amenities, occupancy, photos, and illustrative prices. |
| Media | Browse images, replace them, and edit descriptive alternative text. |
| House Rules | Update property rules and arrival information in one place. |
| Preview and Publish | Save a draft, preview the change, and publish it to the guest-facing prototype. |

### How the CMS should look and behave

- Use a clean sidebar, clear page titles, readable forms, and obvious Save, Preview, and Publish actions.
- Carry through Stillmere’s typography and colours while keeping staff tasks easy to complete.
- Show draft and published states, save feedback, and validation messages.
- Make the CMS connected to the guest website rather than a set of unrelated dashboard screens.
- Demonstrate this complete flow: edit a room → save a draft → preview → publish → see the updated room on the guest website.
- Clearly identify demo access and demo data. A prototype staff screen does not establish production authentication or security.

Live reservations, availability, and operational rate management are separate hotel-management capabilities. A sample reservations view is optional; it is not required to demonstrate content editing.

## Guidance from the hotel website articles

### Cvent: what a good hotel website should communicate

Source: [Best Hotel Website Design: 7 Impressive Examples](https://www.cvent.com/en/blog/hospitality/best-hotel-website-design)

Cvent highlights strong imagery and messaging, clear navigation, purposeful whitespace, accessible contact information, accessibility, responsive layouts, technical SEO, and a streamlined checkout.

For Stillmere, this means:

- Show the property’s character and guest benefits through relevant photographs and concise copy.
- Make rooms, amenities, contact details, and booking easy to find.
- Use space to establish a clear visual hierarchy and avoid clutter.
- Make help available when guests have questions.
- Design for phones as carefully as desktop screens.
- Keep content readable and controls usable with a keyboard and assistive technology.
- Minimise unnecessary booking steps and form fields.
- Make visual choices that support the guest’s task and the hotel’s identity.

### UP Hotel Agency: preserve visual quality while keeping the site fast

Source: [How We Reduce Load Times Without Sacrificing Design](https://uphotel.agency/how-we-reduce-load-times-without-sacrificing-design/)

The article treats performance as part of the design process. It discusses suitable hosting, caching and content delivery, focused custom themes, modern image formats, appropriately sized images, lazy loading, and avoiding unnecessary plugin weight.

For Stillmere, this means:

- Preserve large, attractive imagery while compressing files and serving sizes appropriate to the device.
- Use modern image formats where supported.
- Prioritise the main opening image; defer off-screen images until needed.
- Reserve image space so content does not jump while loading.
- Keep animations and added features lightweight and purposeful.
- Avoid unnecessary dependencies and plugins.
- For production, choose hosting and caching appropriate to the final platform.
- Check loading performance on mobile connections as well as desktop.

The article’s WordPress examples do not require Stillmere to use WordPress. The relevant principle is to plan performance alongside appearance.

## Prototype completion checklist

- [ ] Immersive homepage hero with a clear booking action.
- [ ] Book Now appears after the main booking area scrolls away.
- [ ] Improved room photography, comparison information, and pricing clarity.
- [ ] Useful loading, empty, error, and success states.
- [ ] Consistent checkout with an accessible stay summary.
- [ ] Styled booking confirmation with print or download support.
- [ ] Dedicated House Rules content.
- [ ] Connected CMS editing, preview, and publishing demonstration.
- [ ] Usable mobile layouts and keyboard navigation.
- [ ] Optimised imagery and no unnecessary loading delays.

## Reference verification notes

The public reference pages and both articles were reviewed. Four Seasons’ exact loading and checkout interaction and Aman’s embedded room-selection screen were not fully verified. The supplied Belmond booking link was inaccessible and includes fixed dates. Their sections above capture the agreed inspiration and intended Stillmere behaviour, rather than claiming to reproduce verified interactions exactly.
