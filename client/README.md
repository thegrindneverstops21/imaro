# React client

The client uses a small feature-based structure. Related page code belongs together; only code shared by multiple features goes in the shared directories.

```text
src/
  app/
    App.tsx                 # Routes, shared page shell, session setup
    store.ts                # Redux store and persistence
  components/
    Icon.tsx                # Shared Hugeicons component
  features/
    account/
      LoginFailurePage.tsx
      ProfilePage.tsx
    admin/
      AdminPage.tsx
    booking/
      BookingPage.tsx
      ManagePage.tsx
    browse/
      BrowsePage.tsx
  lib/
    api.ts                  # HTTP requests, headers, errors
    format.ts               # Display formatting and legacy brand mapping
  styles/
    global.css              # Shared theme and current page styles
  types/
    api.ts                  # API response and request types
  main.tsx                  # React root and providers
  vite-env.d.ts
```

Use named exports and direct relative imports. Add feature-local components or hooks only when a page needs them; do not create unused folder scaffolding. Shared libraries must not depend on pages or the app shell.

Run commands from the repository root: `npm run dev:client`, `npm run build:client`, and `npm run lint`. Backend code stays in the root `src/` directory.

Read [coding guidelines](../docs/coding-guidelines.md), [preferences](../docs/preferences.md), and [application state](../docs/application-state.md) before making changes.
