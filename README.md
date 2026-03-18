# NeedOne

A mobile-first Progressive Web App for a pickleball community. The core concept is a **map-first social app** where the hero feature is real-time profile picture avatars on a Mapbox map showing who is currently checked in at each park — think Bump/Zenly for pickleball.

---

## Features

- **Real-time map** — Avatar heads appear on a Mapbox GL map when friends check in
- **Check-in system** — One-tap to check in at a park; check-in expires after 2 hours
- **Friend discovery** — Search users, send/accept friend requests
- **Push notifications** — Browser Web Push when friends check in or respond to requests
- **In-app notification feed** — Friend requests, accepted requests, check-in alerts
- **Profile management** — Name, avatar upload, username auto-generated
- **PWA installable** — Add to Home Screen on iOS/Android

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 14, Pages Router |
| Styling | Tailwind CSS |
| Map | Mapbox GL JS via `react-map-gl` v7 |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Auth | Supabase Auth — OTP via email |
| State | Zustand (map markers, active check-ins) |
| Data Fetching | SWR (friend lists, profiles, notifications) |
| Date/Time | date-fns |
| Icons | Lucide React |
| Push Notifications | Web Push API + Service Worker |
| PWA | next-pwa (Workbox) |
| Email | Resend |

---

## Architecture Overview

```mermaid
graph TD
    Browser["Browser / PWA"]

    subgraph "Next.js App"
        Pages["Pages\n/map · /friends · /profile\n/auth · /profile-setup · /onboarding"]
        APIRoutes["API Routes\n/api/checkin/notify\n/api/push/subscribe\n/api/push/send\n/api/friends/request-notify"]
        SW["Service Worker\n(next-pwa / Workbox)"]
    end

    subgraph "State Layer"
        Zustand["Zustand Store\nmapStore\nparks · activeCheckIns\nselectedPark · pendingToast"]
        SWR["SWR Cache\nfriendships · notifications\nprofiles"]
    end

    subgraph "Supabase"
        Auth["Auth\n(OTP)"]
        DB["Postgres\n+ RLS"]
        Realtime["Realtime\ncheck_ins channel"]
        Storage["Storage\navatars bucket"]
    end

    Mapbox["Mapbox GL JS"]

    Browser --> Pages
    Pages --> Zustand
    Pages --> SWR
    Pages --> APIRoutes
    Pages --> Mapbox
    Zustand --> Mapbox
    APIRoutes --> DB
    APIRoutes --> SW
    SW --> Browser
    Realtime -->|"INSERT / DELETE events"| Zustand
    DB --> Realtime
    Pages --> Auth
    Pages --> Storage
    SWR --> DB
```

---

## Data Flow: Check-in

When a user taps a park and checks in, several things happen in parallel.

```mermaid
sequenceDiagram
    participant User
    participant MapView
    participant useCheckIn
    participant Zustand
    participant Supabase DB
    participant API as /api/checkin/notify
    participant Friends as Friend Browsers

    User->>MapView: Tap park → "Check In"
    MapView->>useCheckIn: checkIn(parkId)
    useCheckIn->>Supabase DB: DELETE old check-in (if any)
    useCheckIn->>Supabase DB: INSERT check_in (expires_at = now + 2h)
    useCheckIn->>Supabase DB: SELECT check_in with profile + park joins
    useCheckIn->>Zustand: upsertCheckIn() — avatar appears on map instantly

    useCheckIn-->>API: POST /api/checkin/notify (fire & forget)
    API->>Supabase DB: Fetch accepted friends
    API->>Supabase DB: INSERT notifications (friend_checkin)
    API->>Supabase DB: Check push_cooldowns (rate limit)
    API->>Friends: Web Push notification

    Supabase DB->>Supabase DB: Realtime broadcasts INSERT
    Supabase DB-->>Friends: Realtime event → upsertCheckIn()
    Friends->>Friends: Avatar appears on their map
```

---

## Data Flow: Authentication

```mermaid
sequenceDiagram
    participant User
    participant Auth Page
    participant useAuth
    participant Supabase Auth
    participant DB

    User->>Auth Page: Enter email
    Auth Page->>Supabase Auth: signInWithOtp({ email })
    Supabase Auth-->>User: OTP email sent

    User->>Auth Page: Enter 6-digit code
    Auth Page->>Supabase Auth: verifyOtp({ email, token })
    Supabase Auth-->>Auth Page: session

    Supabase Auth->>DB: Trigger: handle_new_user() → INSERT profile
    useAuth->>DB: Load profile row

    alt No first_name
        useAuth->>User: Redirect → /profile-setup
    else onboarding not completed
        useAuth->>User: Redirect → /onboarding
    else
        useAuth->>User: Redirect → /map
    end
```

---

## Real-time Map Updates

```mermaid
flowchart LR
    subgraph "Any Client"
        CI[Check-in inserted\nto Supabase]
    end

    subgraph "Supabase"
        RT[Realtime\ncheck_ins channel]
    end

    subgraph "All Connected Clients"
        Hook[useRealtimeCheckIns]
        Store[Zustand mapStore]
        Map[MapView\nAvatar markers]
        Sweep[Client-side\nexpiry sweep\nevery 60s]
    end

    CI --> RT
    RT -->|INSERT event| Hook
    RT -->|DELETE event| Hook
    Hook -->|upsertCheckIn| Store
    Hook -->|removeCheckIn| Store
    Store --> Map
    Sweep -->|removeExpired| Store
```

---

## Database Schema

```mermaid
erDiagram
    profiles {
        uuid id PK
        text username
        text first_name
        text last_name
        text avatar_url
        bool onboarding_completed
        timestamptz created_at
    }

    parks {
        uuid id PK
        text name
        float lat
        float lng
        text description
        timestamptz created_at
    }

    check_ins {
        uuid id PK
        uuid user_id FK
        uuid park_id FK
        timestamptz checked_in_at
        timestamptz expires_at
    }

    friendships {
        uuid id PK
        uuid requester_id FK
        uuid addressee_id FK
        text status
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text type
        uuid actor_id FK
        uuid park_id FK
        bool read
        timestamptz created_at
    }

    push_subscriptions {
        uuid id PK
        uuid user_id FK
        text endpoint
        text p256dh
        text auth
        timestamptz created_at
    }

    push_cooldowns {
        uuid notifier_id FK
        uuid recipient_id FK
        timestamptz sent_at
    }

    profiles ||--o{ check_ins : "has"
    parks ||--o{ check_ins : "hosts"
    profiles ||--o{ friendships : "requests"
    profiles ||--o{ notifications : "receives"
    profiles ||--o{ push_subscriptions : "registers"
    profiles ||--o{ push_cooldowns : "rate-limited by"
```

---

## Project Structure

```
needonev2/
├── pages/
│   ├── index.tsx              # Landing page (public, SEO, install CTA)
│   ├── auth.tsx               # OTP sign-in
│   ├── profile-setup.tsx      # First-time name + avatar
│   ├── onboarding.tsx         # Discover friends post-signup
│   ├── map.tsx                # Alias → /
│   ├── friends.tsx            # Friend list, requests, discovery
│   ├── notifications.tsx      # In-app notification feed
│   ├── profile.tsx            # User settings + permissions
│   └── api/
│       ├── checkin/notify.ts          # Fan out check-in notifications
│       ├── push/subscribe.ts          # Save browser push subscription
│       ├── push/send.ts               # Send Web Push (internal)
│       └── friends/request-notify.ts  # Notify on friend request
│
├── components/
│   ├── Map/
│   │   ├── MapView.tsx        # Interactive Mapbox GL map
│   │   ├── AvatarHead.tsx     # Avatar marker (custom Mapbox overlay)
│   │   ├── ParkPin.tsx        # Park location pin
│   │   ├── ParkCard.tsx       # Park bottom sheet (check-in button)
│   │   └── UserBottomSheet.tsx # Tapped user profile card
│   ├── BottomNav.tsx          # 3-tab nav: Map · Friends · Profile
│   ├── BottomSheet.tsx        # Reusable bottom sheet
│   ├── InitialsAvatar.tsx     # Color-coded fallback avatar
│   └── NotificationBell.tsx   # Unread badge on Profile tab
│
├── hooks/
│   ├── useAuth.tsx            # Auth context + profile loading + redirects
│   ├── useCheckIn.ts          # Check-in / check-out logic
│   ├── useRealtimeCheckIns.ts # Supabase Realtime → Zustand
│   ├── useFriendships.ts      # SWR + Realtime for friend graph
│   ├── useDiscoverPeople.ts   # Search unconnected profiles
│   └── useNotifications.ts    # Notification feed + mark-read
│
├── store/
│   └── mapStore.ts            # Zustand: parks, activeCheckIns, selectedPark
│
├── lib/
│   ├── supabase.ts            # Browser Supabase client (anon key)
│   ├── supabaseServer.ts      # Server-only client (service role)
│   └── types.ts               # Shared TypeScript interfaces
│
├── constants/
│   └── parks.ts               # Default camera position only (parks from DB)
│
├── supabase/migrations/       # Ordered SQL migrations
└── public/
    ├── sw.js                  # Service worker (Workbox, built by next-pwa)
    └── manifest.json          # PWA manifest
```

---

## State Management

Zustand is used for the live map state that needs to update instantly across components. SWR handles everything else.

```mermaid
flowchart TD
    subgraph Zustand["Zustand — mapStore"]
        Parks[parks]
        CheckIns[activeCheckIns]
        SelectedPark[selectedPark]
        Toast[pendingToast]
    end

    subgraph SWR["SWR Cache"]
        Friendships[friendships]
        Notifications[notifications]
        Profile[profile]
    end

    RT[useRealtimeCheckIns] -->|INSERT/DELETE| CheckIns
    CI[useCheckIn] -->|optimistic upsert| CheckIns
    MapView --> Parks
    MapView --> CheckIns
    MapView --> SelectedPark
    ParkCard --> SelectedPark
    CheckInToast --> Toast

    FriendsPage --> Friendships
    NotifPage --> Notifications
    ProfilePage --> Profile
```

---

## API Route Security

Every API route enforces the following:

| Check | Mechanism |
|---|---|
| Authentication | Bearer JWT via `supabaseServer.auth.getUser(token)` |
| Internal routes | `x-service-key` header match |
| UUID validation | Regex `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i` on all ID params |
| URL validation | Relative paths only — `startsWith('/')` && `!startsWith('//')` |
| String length | `title` ≤ 100 chars, `body` ≤ 200 chars for push payloads |
| Method guard | 405 returned for unexpected HTTP methods |
| Rate limiting | `push_cooldowns` table — 1 min cooldown per notifier→recipient pair |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Mapbox account ([access token](https://account.mapbox.com/access-tokens/))

### Setup

```bash
# Install dependencies
npm install

# Copy env template
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_MAPBOX_TOKEN

# Start local Supabase (requires Docker)
npx supabase start

# Copy the printed anon key + service role key into .env.local

# Apply migrations (creates tables, RLS, seed parks)
npx supabase db reset

# Start dev server
npm run dev
```

App runs at `http://localhost:3000`. Local emails (OTP codes) are captured by Inbucket at `http://localhost:54324`.

### Optional: Cloudflare Tunnel (HTTPS / OAuth / Push)

OAuth, push notifications, and PWA install require a public HTTPS URL. A named Cloudflare tunnel is configured to route `dev.needonepickleball.com` to your local server:

```bash
# Make sure cloudflared is installed, then:
cloudflared tunnel run needone-dev
```

This runs alongside `npm run dev` and exposes your local app at `https://dev.needonepickleball.com`.

### Optional: Push Notifications

```bash
npm install web-push
npm install -D @types/web-push
npx web-push generate-vapid-keys
# Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT to .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=           # from: npx supabase start
SUPABASE_SERVICE_ROLE_KEY=               # from: npx supabase start
NEXT_PUBLIC_MAPBOX_TOKEN=                # from: mapbox.com

# Push notifications (optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com

# Email / contact form (optional)
RESEND_API_KEY=
```

---

## Key Implementation Notes

- **Parks are loaded from DB**, not the static `constants/parks.ts` file. The constants file only provides the default camera position (Hollenbeck Park).
- **One active check-in per user** is enforced in app code by deleting any existing check-in before inserting a new one.
- **Check-in expiry** uses a combined approach: a Supabase cron job deletes expired rows server-side, and `useRealtimeCheckIns` runs a client-side sweep every 60 seconds as a safety net.
- **Profiles are world-readable by design** (RLS `USING (true)`) to enable friend discovery. No sensitive fields should be added to the `profiles` table.
- **`onAuthStateChange` callbacks must be synchronous.** Async callbacks block the Supabase SDK's internal promise chain and prevent `verifyOtp` from resolving.
- **Avatar positions around parks** are deterministic — seeded from the check-in's UUID bytes — so the same check-in always renders at the same position on every client.
