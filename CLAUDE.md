@AGENTS.md

# Pacer — CLAUDE.md

Guidance for anyone (human or Claude Code) working in this repo.

## What this is

A Strava-alternative mobile app: GPS activity tracking for run/ride/walk, built with Expo (React Native + TypeScript) and Supabase. "Pacer" is a placeholder name.

## Current status (MVP)

Done:
- Email/password auth (`src/screens/AuthScreen.tsx`, Supabase Auth)
- Background-capable GPS tracking (`src/hooks/useLocationTracking.ts`, uses `expo-task-manager` so recording continues with the screen locked)
- Live tracking screen with map + running stats (`src/screens/TrackActivityScreen.tsx`)
- Distance/pace/duration/elevation math (`src/utils/activityStats.ts`) — haversine distance with basic GPS-noise filtering (drops segments implying >12 m/s)
- Save/view activities against Supabase (`ActivitySummaryScreen`, `HomeScreen`, `ActivityDetailScreen`)
- DB schema + RLS policies (`supabase/schema.sql`)

Not built yet (roadmap, roughly in priority order):
1. Offline-first recording (queue activities locally if the save fails / no network)
2. Edit/delete an activity; manual title entry
3. Social: follows, feed, kudos/comments
4. Segments + leaderboards (would need `route` migrated from `jsonb` to PostGIS `geography(LineString)` — see comment in `schema.sql`)
5. Push notifications
6. Unit tests (none exist yet — `src/utils/activityStats.ts` is the highest-value place to start, it's pure functions)

## Architecture notes

- **Navigation**: single native-stack (`src/navigation/RootNavigator.tsx`). No tab bar yet — add one in `RootNavigator` if/when there's a second top-level surface (e.g. a social feed) worth a tab.
- **Auth gating**: `App.tsx` listens to `supabase.auth.onAuthStateChange` and swaps between `AuthScreen` and `RootNavigator`. There's no onboarding/profile-setup flow — a `profiles` row is created automatically via a Postgres trigger on sign-up (see `schema.sql`).
- **Location tracking**: `useLocationTracking` uses a module-level buffer (`pointBuffer`), not React state, because `TaskManager.defineTask` runs outside the React tree (including while backgrounded). The hook polls that buffer into state every second for UI updates. If you change the buffering approach, keep in mind the task callback can fire while no screen is mounted.
- **Stats are computed client-side** from the raw route and stored as a `jsonb` snapshot on the `activities` row (not recomputed from `route` on every read). If the calculation logic in `activityStats.ts` changes, old activities keep their originally-computed stats unless you write a migration to recompute them.
- **Env vars**: Supabase URL/key are read via `process.env.EXPO_PUBLIC_*` (Metro inlines `EXPO_PUBLIC_`-prefixed vars automatically — no `app.json` extra config needed). Copy `.env.example` to `.env`.

## Known limitations / gotchas

- **Expo Go can't test background location.** The foreground-service notification and locked-screen tracking only work in a dev/production build (`npx expo run:android`, `npx expo run:ios`, or EAS Build).
- **Android needs a Google Maps API key** in `app.json` (`expo.android.config.googleMaps.apiKey`) for `react-native-maps` to render. iOS uses Apple Maps by default and needs no key.
- **GPS noise filtering is basic** (a single implied-speed threshold). If you see distance drift on real runs, this is the first place to improve — consider a proper Kalman filter or accuracy-based point rejection before reaching for anything fancier.
- **No tests yet.** Don't let that stop you from adding them — `activityStats.ts` has no React/native dependencies and is the easiest place to start.

## Conventions

- TypeScript everywhere; keep `src/types/index.ts` as the single source of truth for shared shapes.
- Screens go in `src/screens/`, one file per screen, named `<Thing>Screen.tsx`.
- Keep Supabase queries close to the screen that uses them for now (no separate data layer yet) — introduce one (e.g. `src/api/`) once the same query is needed in 2+ places.
- Run `npx expo install <package>` instead of `npm install` when adding a native-facing dependency, so the version stays compatible with the installed Expo SDK. (Note: `npx expo install` failed to reach its version-check API in some environments during initial setup — if that happens, `npm install <package>@<expo-recommended-version>` works, just double check compatibility manually via https://docs.expo.dev/versions/v57.0.0/.)

## Commands

```bash
npm install              # install deps
npx expo start           # run in Expo Go (no background location)
npx expo run:ios         # dev build, simulator or device (macOS only)
npx expo run:android     # dev build, emulator or device
```
