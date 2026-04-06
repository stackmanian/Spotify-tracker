# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Session Start Protocol

At the start of every session:
1. Read `docs/error.md` to avoid repeating past mistakes
2. Read relevant files in `docs/` for context on features and recent changes

When the user reports an error caused by Claude:
- Document it in `docs/error.md` using the format in that file

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

**Stack**: Next.js 16.2.2 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · NextAuth.js 4

**Routing & Rendering**:
- `/` — login landing (server component, redirects to `/dashboard` if authenticated)
- `/dashboard` — server component, fetches Spotify data directly with session bearer token
- `/filter` — client component (`"use client"`), uses internal API routes
- `/app/api/auth/[...nextauth]/route.ts` — NextAuth Spotify OAuth handler with automatic token refresh
- `/app/api/spotify/*` — proxy routes that add the session bearer token before calling Spotify API

**Auth pattern**: `getServerSession(authOptions)` used in both page server components and API routes. All `/api/spotify/*` routes return 401 if no session.

**Data fetching**:
- Server components call Spotify API directly
- Client components call internal `/api/spotify/` routes with `credentials: "include"`

## Environment Variables

```
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

## Known Issues

- `create-playlist` route has a hardcoded test track URI instead of using `body.uris` — this is a bug to fix before using in production
