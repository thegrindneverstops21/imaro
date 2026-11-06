# Agent coding guidelines

## Write less, keep it simple

- Write the fewest lines needed for a clear, correct solution. When two approaches do the same job equally well, choose the shorter one.
- Use simple, focused functions. Prefer direct expressions, early returns, and standard JavaScript methods over complicated branching or custom algorithms.
- Avoid unnecessary abstractions, wrapper functions, classes, configuration, and dependencies. Build only what the current task needs.
- Reuse existing code. Extract repeated logic when doing so actually reduces duplication and makes the code easier to follow.
- Keep state minimal. Calculate values from existing state instead of storing duplicate state or synchronizing it with effects.
- Use descriptive names and straightforward control flow. Avoid nested ternaries, clever one-liners, and deeply nested functions.
- Do not put several statements or a whole page of JSX on one line to reduce the line count. Remove unnecessary code, not useful formatting.
- Keep validation, error handling, accessibility, and API behavior intact when shortening code.
- Comments should explain a non-obvious reason; avoid comments that repeat the code.

## File organization

- Keep app setup in `client/src/app/`, shared UI in `components/`, and pages with their related code in `features/<feature>/`.
- Keep API transport in `lib/api.ts`, display helpers in `lib/format.ts`, and shared API types in `types/api.ts`.
- Prefer one page component per file. Keep small helpers beside their consumer until multiple features need them.
- Import directly from the relevant file. Do not add barrel exports, empty folders, or extra layers just to make the structure look bigger.
- Keep shared utilities independent of React pages. Pages must not import helpers from `App.tsx`.
- Keep files and changes focused. Preserve the current behavior during structural refactors.

Before finishing, remove unused code, check the affected imports and build, and update `docs/application-state.md` when the application structure or behavior changes.
