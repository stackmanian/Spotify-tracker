# Features Documentation

## Authentication
- **Provider**: Spotify OAuth via NextAuth.js 4.x
- **Flow**: User lands on `/` → clicks "Login with Spotify" → NextAuth handles OAuth → redirected to `/dashboard`
- **Token refresh**: Automatic via JWT callback in `/app/api/auth/[...nextauth]/route.ts` when token expires
- **Scopes**: `user-top-read`, `user-read-recently-played`, `user-library-read`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`

## Dashboard (`/dashboard`)
- Server component — fetches directly from Spotify API using bearer token from session
- Displays: top tracks, top artists, recently played songs (10 items each)
- Uses `cache: "no-store"` for always-fresh data

## Filter & Playlist Creation (`/filter`)
- Client component (`"use client"`) with local state for filtering
- Fetches up to 50 top tracks via internal API route (`/api/spotify/top-tracks`)
- Time range selector: `short_term` (4 weeks), `medium_term` (6 months), `long_term` (all time)
- Multi-select track list → POST to `/api/spotify/create-playlist` to create a named playlist

## Internal Spotify API Routes
All routes under `/app/api/spotify/` check session via `getServerSession` and return 401 if unauthenticated.

| Route | Method | Purpose |
|---|---|---|
| `/api/spotify/top-tracks` | GET | Proxies Spotify top tracks, accepts `time_range` query param |
| `/api/spotify/top-artists` | GET | Proxies Spotify top artists |
| `/api/spotify/create-playlist` | POST | Creates a playlist from selected track URIs |

## Navigation
- Persistent nav bar rendered in root layout (`/app/layout.tsx`)
- Links: Dashboard, Filter
