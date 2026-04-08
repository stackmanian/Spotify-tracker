export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getPlayedTrackIds, initDb } from "../../../../lib/db"

async function safeFetch(url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers })
  if (!res.ok) return null
  const text = await res.text()
  try { return JSON.parse(text) } catch { return null }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const token = session.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }

  // 1. Get user's top artists + top tracks
  const [topArtistsData, topTracksData] = await Promise.all([
    safeFetch("https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term", headers),
    safeFetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term", headers),
  ])

  const topArtists: any[] = topArtistsData?.items || []
  const topTracks: any[] = topTracksData?.items || []
  if (topArtists.length === 0) return NextResponse.json({ tracks: [] })

  const topArtistIds = new Set(topArtists.map((a: any) => a.id))
  const topTrackIds = new Set(topTracks.map((t: any) => t.id))

  // 2. Search strategy: use top track names + "NOT artist" to find songs by OTHER artists
  //    Spotify search supports the NOT operator to exclude terms
  const discoveredTracks: any[] = []
  const seenIds = new Set<string>()

  for (const track of topTracks.slice(0, 8)) {
    const artistName = track.artists?.[0]?.name || ""
    // Search for the track name while excluding the original artist
    const query = `${track.name} NOT ${artistName}`
    const searchData = await safeFetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      headers
    )
    for (const result of searchData?.tracks?.items || []) {
      if (topArtistIds.has(result.artists?.[0]?.id)) continue
      if (topTrackIds.has(result.id)) continue
      if (seenIds.has(result.id)) continue
      seenIds.add(result.id)
      discoveredTracks.push({ ...result, _source: artistName })
    }
  }

  // 3. Also search for "tag:new" + each top artist name to find fresh releases by similar names
  for (const artist of topArtists.slice(0, 3)) {
    const searchData = await safeFetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent("tag:new " + artist.name)}&type=track&limit=10`,
      headers
    )
    for (const result of searchData?.tracks?.items || []) {
      if (topArtistIds.has(result.artists?.[0]?.id)) continue
      if (seenIds.has(result.id)) continue
      seenIds.add(result.id)
      discoveredTracks.push({ ...result, _source: artist.name })
    }
  }

  // 4. Search for "hip hop" / "rap" (inferred from top artists) for broader discovery
  const broadQueries = ["hip hop 2026", "rap new", "r&b 2026"]
  for (const q of broadQueries) {
    const searchData = await safeFetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`,
      headers
    )
    for (const result of searchData?.tracks?.items || []) {
      if (topArtistIds.has(result.artists?.[0]?.id)) continue
      if (seenIds.has(result.id)) continue
      seenIds.add(result.id)
      discoveredTracks.push({ ...result, _source: "discover" })
    }
  }

  // 5. Filter out already-played tracks
  await initDb()
  const playedIds = await getPlayedTrackIds()

  const results = discoveredTracks
    .filter(t => !playedIds.has(t.id))
    .map(t => ({
      id: t.id,
      name: t.name,
      uri: t.uri,
      duration_ms: t.duration_ms,
      artists: t.artists,
      album: {
        id: t.album?.id,
        name: t.album?.name,
        images: t.album?.images,
        release_date: t.album?.release_date,
      },
      popularity: t.popularity ?? 0,
      discovered_from: [t._source],
      relevance: t._source === "discover" ? 0 : 1,
    }))

  return NextResponse.json({
    tracks: results.slice(0, 40),
    source_artists: topArtists.map((a: any) => ({ id: a.id, name: a.name })),
  })
}
