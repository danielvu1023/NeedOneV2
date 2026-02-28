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

---

## Security Checklist — Run Before Every Push

Before committing or pushing any code change, verify each item below. These checks were established after a security audit of the MVP (2026-02-27).

### API Routes (`pages/api/`)
- [ ] **Auth on every route** — all routes either check `x-service-key` (internal) or verify a Bearer JWT via `supabaseServer.auth.getUser(token)` (user-facing). No unauthenticated endpoints.
- [ ] **UUID validation** — any `userId`, `notifierId`, or similar ID param from a request body must be validated against `/^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i` before use.
- [ ] **URL whitelist** — any `url` field passed from a request body to a push payload or redirect must start with `/` and not `//`. Use `isRelativePath()` from `push/send.ts` as the pattern.
- [ ] **String length caps** — `title` ≤ 100 chars, `body` ≤ 200 chars before putting into push payloads or notification records.
- [ ] **HTTP method guard** — every handler returns 405 for unexpected methods.

### Supabase Queries (client-side hooks)
- [ ] **Minimal column select** — never use `.select('*')` on `profiles` in a discovery or search context. Select only the fields the UI actually renders: `id, first_name, last_name, avatar_url`.
- [ ] **Row limits** — any query that fetches a list without a user-supplied filter must have `.limit(N)` to prevent full-table scans.
- [ ] **RLS coverage** — every new table must have `enable row level security` and at least one policy. Verify via `mcp__supabase__get_advisors({ type: 'security' })` after any migration.
- [ ] **No service role client on the browser** — `supabaseServer` (service role) must only be imported inside `pages/api/`. Never imported in components, hooks, or lib files loaded client-side.

### Service Worker (`public/sw.js`)
- [ ] **URL validation before openWindow** — any URL used in `self.clients.openWindow()` must be validated as a relative path (`startsWith('/') && !startsWith('//')`) before use.

### Auth & Redirects
- [ ] **EXEMPT_PATHS is exhaustive** — whenever a new public/pre-auth page is added, add it to `EXEMPT_PATHS` in `hooks/useAuth.tsx` to prevent redirect loops.
- [ ] **No open redirects** — router.replace/push targets must be hardcoded strings or validated against an allowlist, never derived from URL query params or user input.

### Data Exposure
- [ ] **Profiles are world-readable by design** (RLS `using (true)`) — be careful not to add sensitive fields (phone, email, location history) to the `profiles` table. Keep sensitive user data in `auth.users` (managed by Supabase) or a separate access-controlled table.
- [ ] **localStorage is untrusted** — values from localStorage (permission states, dismissed timestamps) only affect the current user's own UI. Never use localStorage values to make security decisions server-side.

### New Migrations
- [ ] Add `not null` to columns that have defaults and should never be null (e.g. `sent_at`, `created_at`).
- [ ] Run `mcp__supabase__get_advisors({ type: 'security' })` after applying migrations to catch missing RLS or policy gaps.
- [ ] Run `mcp__supabase__get_advisors({ type: 'performance' })` to catch missing indexes on FK columns.
