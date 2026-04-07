# Error Log

This file tracks mistakes made during development sessions. Read this at the start of every session to avoid repeating errors.

---

<!-- Errors will be logged here as they occur. Format:
## [Date] - Short description
**What happened**: ...
**Root cause**: ...
**Fix**: ...
**Avoid by**: ...
-->

## 2026-04-05 - create-playlist uses hardcoded test track URI
**File**: `app/api/spotify/create-playlist/route.ts`
**What happened**: Route uses a hardcoded `spotify:track:4cOdK2wGLETKBW3PvgPWqT` instead of `body.uris` from the request body — playlists are always created with the same test track regardless of user selection.
**Fix**: Replace hardcoded URI with `body.uris` passed in the POST request.
**Status**: Fixed 2026-04-06 — replaced hardcoded URI with `body.uris`.

## 2026-04-06 - Recommendations API returned empty body causing JSON parse crash
**File**: `app/recently-played/page.tsx`, `app/api/spotify/recommendations/route.ts`
**What happened**: Spotify's recommendations endpoint returned an empty or non-JSON body (on error/rate limit), causing "Unexpected end of JSON input" crash on the page.
**Fix**: Route now reads `response.text()` before parsing; page guards both fetch results with `.ok` check and `.catch(() => ({}))`.
**Avoid by**: Always guard `.json()` calls on external API responses — read as text first or wrap in try/catch.

## 2026-04-06 - Trailing space in SPOTIFY_CLIENT_ID caused "client_id: Invalid"
**File**: `.env.local`
**What happened**: `SPOTIFY_CLIENT_ID` had a trailing space, causing Spotify OAuth to reject the client ID.
**Fix**: Removed the trailing space from the value in `.env.local`.
**Avoid by**: Check `.env.local` values for leading/trailing whitespace when debugging auth errors.
