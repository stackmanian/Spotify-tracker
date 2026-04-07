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

## 2026-04-06 - POST /v1/playlists/{id}/tracks returns 403 — endpoint renamed to /items
**File**: `app/api/spotify/create-playlist/route.ts`
**What happened**: Spotify renamed `/playlists/{id}/tracks` to `/playlists/{id}/items` in their February 2026 API migration. New apps calling the old `/tracks` endpoint receive 403 Forbidden. Playlists were being created but tracks silently failed to add.
**Fix**: Changed endpoint from `/playlists/{id}/tracks` to `/playlists/{id}/items`.
**Source**: Spotify Feb 2026 Migration Guide — developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
**Avoid by**: Always check Spotify's migration guides before using playlist/track write endpoints. The full renamed set: `/items` replaces `/tracks` for add, get, update, and delete.

## 2026-04-06 - Multiple Spotify browse/artist endpoints return 403 for new apps
**Files**: `app/recently-played/page.tsx`, `app/api/spotify/artist-top-tracks/route.ts`, `app/api/spotify/new-releases/route.ts`
**What happened**: `/v1/artists/{id}/top-tracks`, `/v1/browse/new-releases`, and `/v1/recommendations` all return 403 Forbidden for apps created after Spotify's late-2024 API restrictions. Signing out and back in does NOT fix it — it is an app-level restriction.
**Fix**: Replaced with working endpoints only: top-tracks API for "Your Favorites" section, `/v1/artists/{id}/albums` for "From Your Top Artists" section.
**Avoid by**: Only use `/v1/me/top/*`, `/v1/me/player/*`, `/v1/artists/{id}/albums`, and playlist endpoints for new Spotify apps. Browse and recommendations endpoints are gated.

## 2026-04-06 - Spotify /v1/recommendations endpoint deprecated for new apps (404)
**Files**: `app/api/spotify/recommendations/route.ts`, `app/recently-played/page.tsx`, `app/playlists/MoodSection.tsx`
**What happened**: Spotify deprecated `/v1/recommendations` for apps created after late 2024. Returns 404 with empty body. Genre-seeded mood playlists and track-seeded recommendations both broken.
**Fix**: Replaced recommendations with `/v1/artists/{id}/top-tracks` (new `artist-top-tracks` route) on the recently-played page. Mood buttons now use user's own top tracks per time range instead of genre seeds.
**Avoid by**: Check Spotify API deprecation notices before building on any browse/recommendations endpoints. Use user data endpoints (`/me/top/*`, `/artists/{id}/top-tracks`) which are stable.

## 2026-04-06 - create-playlist returned 403 Forbidden on track-add after app credential change
**File**: `app/api/spotify/create-playlist/route.ts`
**What happened**: After changing Spotify app credentials (new client ID/secret), the session token was stale. Adding tracks to a newly created playlist returned 403 Forbidden.
**Fix**: User must sign out and sign back in after changing Spotify app credentials to get a fresh token.
**Avoid by**: Always re-authenticate after rotating Spotify app credentials.

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
