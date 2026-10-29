# Stillmere prototype update — 21 October 2026

Source brief: [`website-design-brief.md`](./website-design-brief.md).

The latest implementation is in the existing Figma Make file:
https://www.figma.com/make/UIemSGV1hESWfTwFzDPBon

Changes were made directly in Figma Make. The files in `prototype/` remain the earlier imported version and are not a synchronized copy of this update.

Implemented in the Figma preview: immersive photographic hero, persistent booking controls, room galleries and stay totals, no-results recovery, receipt-style confirmation with Print / Save PDF, House Rules, and a connected demo CMS for Pages, Rooms, Media, House Rules, and Preview & Publish.

Manually verified in the Figma preview:
- Room gallery advances to the next image.
- Guest details → review → demo confirmation works.
- Pay-at-hotel review and receipt show R0 due now and R2,500 on arrival for two Classic Room nights.
- CMS room name change → save draft → guest-layout draft preview → local publication → guest page reflects the change. Original room name restored afterward.
- Six guests produces a helpful no-results state with change-search, reset, and contact actions.
- Receipt has no horizontal overflow at viewport widths 360, 390, 768, and 1440 pixels.
- Mobile homepage and House Rules layouts visually inspected.

Limitations: Print output has not been visually inspected. These checks do not constitute a comprehensive accessibility or performance audit. Figma displayed an exhausted daily AI credit notice during its ongoing validation run; further prompts may require the allowance to reset. No public deployment or real booking/payment was performed.
