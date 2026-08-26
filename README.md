# Pacer

A Strava alternative: GPS activity tracking (run/ride/walk) for iOS and Android, built with Expo (React Native) and Supabase.

> "Pacer" is a placeholder name — rename freely (see `app.json` and `package.json`).

## Stack

- **App**: Expo (React Native + TypeScript), React Navigation
- **Maps & GPS**: `react-native-maps`, `expo-location`, `expo-task-manager` (background tracking)
- **Backend**: Supabase (Postgres, Auth, Row-Level Security)

## MVP scope

Core GPS activity tracking + stats:
- Email/password auth
- Record a run/ride/walk with live map + distance, duration, pace, elevation gain
- Background location so tracking survives a locked screen
- Save activities to Supabase; view history and a per-activity detail screen

Not in scope yet: social feed/follows/kudos, segments, leaderboards, offline sync, watch support. See `CLAUDE.md` for the fuller roadmap.

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL editor, run `supabase/schema.sql`.
   - Copy `.env.example` to `.env` and fill in your project URL + anon key (Project Settings → API).

3. **Google Maps API key (Android only)**
   - `react-native-maps` on Android needs a Google Maps SDK key. Add it to `app.json` under `expo.android.config.googleMaps.apiKey`. iOS uses Apple Maps by default, no key needed.

4. **Run it**
   ```bash
   npx expo start
   ```
   Scan the QR code with Expo Go, or press `a` / `i` for an emulator/simulator.

   > Background location and the foreground service notification only work in a development build or production build — not in Expo Go. Run `npx expo run:android` / `npx expo run:ios` (or use EAS Build) to test that fully.

## Project structure

```
src/
  screens/       Auth, Home, TrackActivity, ActivitySummary, ActivityDetail
  navigation/     RootNavigator (typed stack)
  hooks/          useLocationTracking — background-capable GPS recording
  utils/          activityStats — distance/pace/duration math
  lib/            supabase client
  types/          shared TypeScript types
supabase/
  schema.sql      tables + RLS policies
```

## Team workflow

See `CLAUDE.md` for conventions and context for anyone (or any Claude Code session) picking up this repo.
