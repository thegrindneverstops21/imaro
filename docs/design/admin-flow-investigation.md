# Admin workflow investigation - 6 November 2026

Scope: source inspection plus targeted API/auth verification. No browser usability session was run.

## Current status

The primary discovery defect is fixed. `/branches` now retains published properties when no room type, rate, or available room exists, while dated, room-type, and price-filtered searches still require a matching bookable room. The browse UI shows a published property as "not yet bookable" instead of presenting it as missing.

The admin can now sign in without Google:

- URL: `http://localhost:5173/login`
- Email: `admin@imaro.local`
- Password: `ImaroAdmin2026!`

These are local/submission credentials seeded by `backend/src/db/seed.sql`; they are not read from `.env`. The seeded password must be changed or removed before shared deployment.

Evidence: `test/api/admin.test.ts` verifies a newly created branch appears in public discovery; `test/api/auth.test.ts` verifies the documented password issues an admin session; targeted API tests, typecheck, and lint passed.

## Workflow friction

- Creation ends at "Branch created." No guest preview, readiness checklist, or guided add-room/set-rate action.
- Reload preserves the previous selected branch. Switching to Rooms or Rates can therefore target the old property after creating a new one.
- Room types are selected from names in the shared room-type catalogue, but the underlying admin controls still expose an ID-oriented workflow and provide no explanation when a new branch has no inventory.
- All 12 branch inputs are required. URL slug is first; coordinates and star rating block creation without useful assistance.
- The editor exposes only name and description despite the API supporting updates to the other branch fields.
- The create form retains the previous property's coordinates, phone and star rating, increasing copy-over errors.
- Guest lists do not automatically refresh when an admin changes a branch in another tab.
- The admin landing page opens on Reservations rather than explaining the branch setup sequence for a new property.
- The seeded demo credentials are documented, but the login page does not identify that they are intended for staff/submission access.

## User-friendliness assessment

### Admin: usable for review, not yet friendly for onboarding

What works:

- Password login is direct and does not depend on Google configuration.
- Staff access has distinct signed-out, access-checking, and non-admin states.
- Branch, room, rate, and reservation sections have visible busy, error, refresh, and success feedback.
- Published and bookable are now separate guest-facing states.
- The selected branch now shows a booking-readiness summary with direct Fix actions for publishing, rooms, and rates.

What still makes the flow difficult:

- A new admin must infer the order: create branch, add rooms, set rates, then verify availability.
- There is no readiness indicator showing which prerequisite is missing.
- Branch creation is a long all-required form with no sensible defaults or staged sections.
- Switching branches does not explain that Rooms and Rates operate on the selected property.
- Editing branch contact/location/stay fields is unavailable even though the API supports them.

### Guest: clear for normal booking, incomplete for edge cases

What works:

- Guests can browse without an account.
- Published properties remain discoverable without inventory.
- A property with no room types gets an honest not-yet-bookable message.
- A property with rooms but no availability gets a date-specific message, and room details remain accessible.
- Password and Google sign-in both exist, and sign-in intent is preserved.

Remaining friction:

- The login page does not explain the difference between guest accounts and the staff demo account.
- Empty properties do not expose a direct "contact hotel" or "notify me" action.
- A guest can see a published property before it is ready, but the admin has no corresponding readiness checklist.
- Password reset is not available.

## Required behavior

A created, published branch should appear in public property discovery immediately on the next fetch, including when it has no bookable rooms. Show an honest no-rooms/not-yet-bookable state and disable booking. Keep date/occupancy availability filtering for booking results, without hiding the property from hotel/contact navigation.

## Recommended next steps

1. Add a branch readiness summary: Published, room inventory, rates, and bookable status.
2. After creation select the returned branch and show guest preview plus Add rooms / Set rates actions.
3. Split branch creation into basics, contact/location, and stay details; provide slug and coordinate help.
4. Support all editable branch fields and reset unrelated fields between new branches.
5. Add a staff-only hint on the login page when the `/admin` intent is present.
6. Add explicit refresh-on-focus or a refresh action to guest property selectors.

This investigation supersedes earlier statements implying the admin workflow was complete merely because its screens and tab smoke checks passed. End-to-end branch onboarding remains incomplete.
