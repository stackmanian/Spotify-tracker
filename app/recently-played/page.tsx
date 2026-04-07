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

function formatReleaseDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export default function RecentlyPlayedPage() {
  const [recentItems, setRecentItems] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [newReleases, setNewReleases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const recentRes = await fetch("/api/spotify/recently-played?limit=50", { credentials: "include" })
      const recentData = await recentRes.json()
      const items = recentData.items || []
      setRecentItems(items)

      if (items.length === 0) {
        setLoading(false)
        return
      }

      // Seed recommendations from first 5 unique track IDs
      const seedIds = [...new Map(items.map((i: any) => [i.track.id, i.track.id])).values()]
        .slice(0, 5)
        .join(",")

      const [recRes, releasesRes] = await Promise.all([
        fetch(`/api/spotify/recommendations?seed_tracks=${seedIds}&limit=20`, { credentials: "include" }),
        fetch("/api/spotify/new-releases?limit=12", { credentials: "include" }),
      ])

      const recData = recRes.ok ? await recRes.json().catch(() => ({})) : {}
      const releasesData = releasesRes.ok ? await releasesRes.json().catch(() => ({})) : {}

      setRecommendations(recData.tracks || [])
      setNewReleases(releasesData.albums?.items || [])
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

          {/* Right panel — recommendations + new releases */}
          <div className="flex-1 min-w-0">

            {recommendations.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-green-400 mb-4">Recommended for You</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {recommendations.map((track: any) => (
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
                <h2 className="text-lg font-semibold text-green-400 mb-4">New Releases</h2>
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
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatReleaseDate(album.release_date)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      )}
    </main>
  )
}
