"use client"
import { useState, useEffect } from "react"

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export default function RecentlyPlayedPage() {
  const [recentItems, setRecentItems] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [newReleases, setNewReleases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)

      // Fetch all three in parallel — all use working endpoints
      const [recentRes, topTracksRes, topArtistsRes] = await Promise.all([
        fetch("/api/spotify/recently-played?limit=50", { credentials: "include" }),
        fetch("/api/spotify/top-tracks?time_range=medium_term", { credentials: "include" }),
        fetch("/api/spotify/top-artists?time_range=medium_term", { credentials: "include" }),
      ])

      const recentData = recentRes.ok ? await recentRes.json().catch(() => ({})) : {}
      const topTracksData = topTracksRes.ok ? await topTracksRes.json().catch(() => ({})) : {}
      const topArtistsData = topArtistsRes.ok ? await topArtistsRes.json().catch(() => ({})) : {}

      const items = recentData.items || []
      setRecentItems(items)

      // "Recommended for You" = top tracks over last 6 months
      // that aren't in the last 10 recently played (show things they love but haven't heard recently)
      const last10Ids = new Set(items.slice(0, 10).map((i: any) => i.track.id))
      const favTracks = (topTracksData.items || []).filter((t: any) => !last10Ids.has(t.id))
      setFavorites(favTracks.slice(0, 20))

      // "New Releases" = fetch albums from top 3 artists using /v1/artists/{id}/albums
      const topArtists = (topArtistsData.items || []).slice(0, 3)
      const albumResponses = await Promise.all(
        topArtists.map((a: any) =>
          fetch(`/api/spotify/artist-albums?artist_id=${a.id}`, { credentials: "include" })
        )
      )

      const allAlbums: any[] = []
      const seenAlbumIds = new Set<string>()
      for (const res of albumResponses) {
        if (!res.ok) continue
        const data = await res.json().catch(() => ({}))
        for (const album of (data.items || [])) {
          if (!seenAlbumIds.has(album.id)) {
            seenAlbumIds.add(album.id)
            allAlbums.push(album)
          }
        }
      }
      // Sort by release date descending
      allAlbums.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
      setNewReleases(allAlbums.slice(0, 12))

      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Recently Played</h1>
      <p className="text-gray-400 mb-8">Your listening history and what to play next</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="flex gap-6">

          {/* Left panel — scrollable history */}
          <aside className="w-64 shrink-0">
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-3">History</h2>
            <div className="overflow-y-auto max-h-[calc(100vh-160px)] pr-1 space-y-1">
              {recentItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent history available.</p>
              ) : recentItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-800">
                  <img
                    src={item.track.album.images[2]?.url}
                    className="w-8 h-8 rounded shrink-0 object-cover"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs text-white truncate">{item.track.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.track.artists[0]?.name}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{timeAgo(item.played_at)}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Right panel */}
          <div className="flex-1 min-w-0">

            {favorites.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-green-400 mb-1">Your Favorites</h2>
                <p className="text-gray-500 text-xs mb-4">Top tracks from the last 6 months you might want to revisit</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {favorites.map((track: any) => (
                    <a
                      key={track.id}
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group"
                    >
                      <img
                        src={track.album?.images?.[1]?.url || track.album?.images?.[0]?.url}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2">
                        <p className="text-sm font-medium truncate group-hover:text-green-400 transition-colors">
                          {track.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {track.artists?.map((a: any) => a.name).join(", ")}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {newReleases.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-green-400 mb-1">From Your Top Artists</h2>
                <p className="text-gray-500 text-xs mb-4">Latest releases from artists you listen to most</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {newReleases.map((album: any) => (
                    <a
                      key={album.id}
                      href={album.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group"
                    >
                      <img
                        src={album.images?.[1]?.url || album.images?.[0]?.url}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2">
                        <p className="text-sm font-medium truncate group-hover:text-green-400 transition-colors">
                          {album.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {album.artists?.map((a: any) => a.name).join(", ")}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{album.album_type}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {favorites.length === 0 && newReleases.length === 0 && (
              <p className="text-gray-500">Nothing to show yet — listen to more music and check back.</p>
            )}

          </div>
        </div>
      )}
    </main>
  )
}
