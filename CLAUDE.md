# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

NeedOne is a mobile-first PWA for a pickleball community. The core concept is a **map-first social app** (inspired by Bump/Zenly) where the hero feature is real-time profile picture heads on a map showing who is currently checked in at each park.

## Commands

```bash
npm run dev            # Start Next.js dev server
npm run build          # Production build
npm run start          # Run production server

# Supabase local (requires Docker)
npx supabase start     # Start local Supabase stack
npx supabase stop      # Stop local stack
npx supabase status    # View local URLs and keys
npx supabase db reset  # Reset DB and re-run migrations
```

No test runner or linter is configured.

## Tech Stack

- **Framework**: Next.js 14, Pages Router (not App Router)
- **Styling**: Tailwind CSS
- **Map**: Mapbox GL JS via `react-map-gl`
- **Backend**: Supabase (Postgres, Auth, Realtime)
- **Auth**: Supabase Auth with Google OAuth (avatar auto-populated)
- **State**: Zustand (real-time check-in state, map markers)
- **Data fetching**: SWR (client-side, pairs with Supabase and Pages Router)
- **Date/time**: date-fns (check-in expiry, "20 min ago" labels)
- **Icons**: Lucide React
- **Push notifications**: Web Push API + service worker
- **PWA**: next-pwa

## Architecture

### Routing (Pages Router)

- `pages/index.tsx` — Map view (default, hero screen)
- `pages/friends.tsx` — Friend list, activity, add friends
- `pages/profile.tsx` — User profile, settings, notifications
- `pages/api/` — Server-side API routes (push notifications, etc.)

### State & Data

- **Auth**: React Context via `hooks/useAuth.tsx`, wraps the whole app in `_app.tsx`
- **Map state**: Zustand store — active check-ins, marker positions
- **Realtime**: Supabase Realtime subscriptions on `check_ins` table → update Zustand
- **Fetching**: SWR for non-realtime data (friend lists, profiles)
- **Push**: Web Push API + service worker at `public/sw.js`

### Key Files

- `lib/supabase.ts` — Browser Supabase client
- `lib/types.ts` — Shared TypeScript interfaces
- `constants/parks.ts` — Park definitions (lat/lng, IDs). Hollenbeck is index 0 (default).
- `components/BottomNav.tsx` — 3-tab navigation (Parks, Friends, Profile)
- `supabase/migrations/` — DB migrations (run via `supabase db reset`)

### Database (Supabase PostgreSQL)

Tables: `profiles`, `parks`, `check_ins`, `friendships`, `push_subscriptions`

- `profiles`: id, username, avatar_url, created_at
- `parks`: id, name, lat, lng, created_at
- `check_ins`: id, user_id, park_id, checked_in_at, expires_at (2hr default)
- `friendships`: id, user_id, friend_id, status (pending/accepted), created_at
- All tables use Row-Level Security.
- A trigger auto-creates a profile on signup.
- Only one active check-in per user (unique partial index on non-expired rows).

### Supabase Local Development

Local stack runs via Docker. Default ports:
- API: `http://localhost:54321`
- Postgres: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio: `http://localhost:54323`
- Inbucket (email): `http://localhost:54324`

The MCP server in `.claude/settings.json` connects directly to local Postgres for Claude to query/inspect the DB during development.

### Map

- Default camera: Hollenbeck Park, East LA (`34.0435, -118.2087`), zoom ~15
- User location: blue dot via react-map-gl `GeolocateControl`
- Check-in markers: circular cropped avatars as custom Mapbox markers
- Overflow: 5 visible heads + "+N more" badge when 6+ at same park
- Tap a head → bottom sheet with name + add friend button

### Styling

Tailwind CSS. Dark theme. Mobile-first, max-width ~480px. Fonts TBD.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # from: npx supabase start
SUPABASE_SERVICE_ROLE_KEY=             # from: npx supabase start
NEXT_PUBLIC_MAPBOX_TOKEN=              # from: mapbox.com/account/access-tokens
```

## Key Patterns

- Park data lives in `constants/parks.ts` — never hardcoded in components
- Check-in triggers real-time map update via Supabase Realtime → Zustand
- Check-in also triggers push notifications to friends (API route fans out to subscribers)
- Friend discovery is proximity-based (both users checked in at the same park)
- Design reference: Figma MCP is connected — share Figma URLs when providing design specs
