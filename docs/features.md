# Features Documentation

## Authentication
- **Provider**: Spotify OAuth via NextAuth.js 4.x
- **Flow**: User lands on `/` → clicks "Login with Spotify" → NextAuth handles OAuth → redirected to `/dashboard`
- **Token refresh**: Automatic via JWT callback in `/app/api/auth/[...nextauth]/route.ts` when token expires
- **Scopes**: `user-top-read`, `user-read-recently-played`, `user-library-read`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`

## Dashboard (`/dashboard`)
- Server component — stat cards hub page
- **Stat cards**: estimated listening time this month (calculated from recently-played `played_at` + `duration_ms`), top genre (from top artist genres), top artist, top track
- Navigation cards linking to Stats, Recently Played, and Playlists pages

## Stats & Filter (`/filter`)
- Client component with local state
- **Tracks view**: top 50 tracks with `mm:ss` duration per track, total listening time estimate, artist filter
- **Artists view**: top 50 artists with genre pill and follower count
- **Time ranges**: 5 labels (Last Month, Last 3 Months, Last 6 Months, Last Year, All Time) mapped to 3 Spotify API ranges (`short_term`, `medium_term`, `long_term`)
- **Playlist creation**: fills up to 40 tracks — user's filtered tracks first, remainder padded with Spotify recommendations. Redirects to `/playlists` on success.

## Recently Played (`/recently-played`)
- Client component
- **Left panel**: scrollable listening history with relative timestamps (`Xm ago`, `Xh ago`, `Xd ago`)
- **Right panel**: "Recommended for You" grid (seeded from recent tracks) + "New Releases" grid
- Newspaper-style card grid layout for both sections

## Playlists (`/playlists`)
- Server component (playlist grid) + client `MoodSection` component
- **Grid**: user's Spotify playlists with cover art, name, track count. Each links to Spotify.
- **Mood creation**: 5 mood presets (Happy, Focus, Chill, Hype, Sleep) — creates playlists via genre-seeded recommendations

## Internal Spotify API Routes
All routes under `/app/api/spotify/` check session via `getServerSession` and return 401 if unauthenticated.

| Route | Method | Purpose |
|---|---|---|
| `/api/spotify/top-tracks` | GET | Top tracks, accepts `time_range` |
| `/api/spotify/top-artists` | GET | Top artists, accepts `time_range` |
| `/api/spotify/recently-played` | GET | Recently played, accepts `limit` |
| `/api/spotify/recommendations` | GET | Recommendations via `seed_tracks` or `seed_genres` + `limit` (max 5 seeds) |
| `/api/spotify/new-releases` | GET | New album releases, accepts `limit` |
| `/api/spotify/playlists` | GET | User's playlists |
| `/api/spotify/create-playlist` | POST | Creates a playlist from `{ name, uris[] }` |

## Navigation
- Persistent nav bar in root layout (`/app/layout.tsx`)
- Links: Dashboard, Stats, Recently Played, Playlists, Sign Out
