# Admin branch workflow investigation - 6 November 2026

Scope: source inspection only; no test suite, database writes or UI changes.

## Primary defect

New branches are created with isPublished=true, but the public /branches endpoint uses SEARCH_BRANCHES, whose inner join requires a branch room-type rate and sufficient active available rooms. Creating the branch alone cannot satisfy this query. Public hotel/contact selectors also use /branches, so property discovery incorrectly depends on room availability. Published and bookable are different states but the UI does not communicate them.

Sources: client/src/features/admin/branchForm.ts; backend/src/repositories/branchQueries.ts; client/src/features/browse/useBranchInfo.ts; client/src/features/browse/BrowsePage.tsx.

## Workflow friction

- Creation ends at “Branch created.” No guest preview, readiness checklist or guided add-room/set-rate action.
- Reload preserves the previous selected branch. Switching to Rooms or Rates can therefore target the old property after creating a new one.
- Room types require numeric IDs, with suggestions derived from that branch's existing inventory/rates. A new branch has no useful starting choices.
- All 12 branch inputs are required. URL slug is first; coordinates and star rating block creation without useful assistance.
- The editor exposes only name and description despite the API supporting updates to the other branch fields.
- The create form retains the previous property's coordinates, phone and star rating, increasing copy-over errors.
- Guest lists do not automatically refresh when an admin changes a branch in another tab.

## Required behavior

A created, published branch should appear in public property discovery immediately on the next fetch, including when it has no bookable rooms. Show an honest no-rooms/not-yet-bookable state and disable booking. Keep date/occupancy availability filtering for booking results, without hiding the property from hotel/contact navigation.

## Recommended implementation order

1. Separate the published-property catalogue from availability search; wire hotel/contact/location discovery to the catalogue.
2. After creation select the returned branch and show its guest preview plus Add rooms / Set rates next actions.
3. Offer room types by name from a global catalogue, not numeric IDs or branch-local suggestions.
4. Organize branch editing into basics, contact/location and stay details; auto-suggest an editable slug, support all editable fields, and avoid copying unrelated property values.
5. Surface Published versus Ready for bookings separately; refresh guest data on revisit/focus or explicit refresh.

This investigation supersedes earlier statements implying the admin workflow was complete merely because its screens and tab smoke checks passed. End-to-end branch onboarding remains incomplete.
