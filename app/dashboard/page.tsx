"use client"
import { useState, useEffect } from "react"

const TIME_RANGES = [
  { label: "Last Month",    value: "short_term"  },
  { label: "Last 3 Months", value: "short_term"  },
  { label: "Last 6 Months", value: "medium_term" },
  { label: "Last Year",     value: "long_term"   },
  { label: "All Time",      value: "long_term"   },
]

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

function formatTotalTime(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  if (totalMin < 60) return `${totalMin}m`
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours < 24) return `${hours}h ${mins}m`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return `${days}d ${remHours}h`
}

export default function Dashboard() {
  const [rangeIndex, setRangeIndex] = useState(0)
  const [artists, setArtists] = useState<any[]>([])
  const [tracks, setTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // DB stats
  const [stats, setStats] = useState<any>(null)
  const [collecting, setCollecting] = useState(false)

  const timeRange = TIME_RANGES[rangeIndex].value

  // Collect plays on mount, then fetch stats
  useEffect(() => {
    setCollecting(true)
    fetch("/api/cron/collect-plays", { credentials: "include" })
      .then(r => r.json())
      .then(() => fetch("/api/spotify/stats", { credentials: "include" }))
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setCollecting(false)
      })
      .catch(() => setCollecting(false))
  }, [])

  // Fetch top artists and tracks when time range changes
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/spotify/top-artists?time_range=${timeRange}&limit=5`, { credentials: "include" }).then(r => r.json()),
      fetch(`/api/spotify/top-tracks?time_range=${timeRange}&limit=5`, { credentials: "include" }).then(r => r.json()),
    ]).then(([artistsData, tracksData]) => {
      setArtists(artistsData.items || [])
      setTracks(tracksData.items || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [timeRange])

  // Build lookup maps from DB stats
  const trackPlayCounts = new Map<string, number>()
  const artistListenTime = new Map<string, number>()
  if (stats) {
    for (const t of stats.top_tracks || []) trackPlayCounts.set(t.track_id, t.play_count)
    for (const a of stats.top_artists || []) artistListenTime.set(a.artist_id, a.total_ms)
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Spotify Tracker</h1>
      <p className="text-gray-400 mb-6">Your listening at a glance</p>

      {/* Time range */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TIME_RANGES.map((range, i) => (
          <button
            key={i}
            onClick={() => setRangeIndex(i)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${rangeIndex === i ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"}`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">This Month</p>
          <p className="text-white text-3xl font-bold">
            {stats ? formatTotalTime(stats.month.total_ms) : "—"}
          </p>
          <p className="text-gray-500 text-sm mt-1">total listening time</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">This Month</p>
          <p className="text-white text-3xl font-bold">
            {stats ? stats.month.play_count.toLocaleString() : "—"}
          </p>
          <p className="text-gray-500 text-sm mt-1">tracks played</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-white text-3xl font-bold">
            {stats ? stats.total_plays_collected.toLocaleString() : "—"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            plays tracked{collecting ? " · collecting..." : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Top 5 Artists */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">
              Top Artists · {TIME_RANGES[rangeIndex].label}
            </h2>
            <div className="space-y-2">
              {artists.map((artist: any, i: number) => {
                const listenMs = artistListenTime.get(artist.id)
                return (
                  <div key={artist.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg">
                    <span className="text-gray-500 text-sm w-5 shrink-0">{i + 1}</span>
                    {artist.images?.[2]?.url ? (
                      <img src={artist.images[2].url} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{artist.name}</p>
                      <p className="text-gray-400 text-sm">
                        {listenMs ? formatTotalTime(listenMs) + " listened" : artist.followers?.total?.toLocaleString() + " followers"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top 5 Tracks */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">
              Top Tracks · {TIME_RANGES[rangeIndex].label}
            </h2>
            <div className="space-y-2">
              {tracks.map((track: any, i: number) => {
                const playCount = trackPlayCounts.get(track.id)
                return (
                  <div key={track.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg">
                    <span className="text-gray-500 text-sm w-5 shrink-0">{i + 1}</span>
                    {track.album?.images?.[2]?.url && (
                      <img src={track.album.images[2].url} className="w-10 h-10 rounded shrink-0" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-gray-400 text-sm truncate">{track.artists?.map((a: any) => a.name).join(", ")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {playCount ? (
                        <p className="text-green-400 text-sm font-medium">{playCount}x</p>
                      ) : (
                        <p className="text-gray-500 text-sm">{formatDuration(track.duration_ms)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

      {/* Explore */}
      <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Explore</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        <a href="/filter" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 flex flex-col gap-2 group">
          <span className="text-green-500 text-2xl">📊</span>
          <span className="text-white font-bold text-lg">Stats & Filter</span>
          <span className="text-gray-400 text-sm">Explore your top tracks and artists by time range</span>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors mt-auto text-right">→</span>
        </a>

        <a href="/recently-played" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 flex flex-col gap-2 group">
          <span className="text-green-500 text-2xl">🎵</span>
          <span className="text-white font-bold text-lg">Recently Played</span>
          <span className="text-gray-400 text-sm">Your listening history with new releases</span>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors mt-auto text-right">→</span>
        </a>

        <a href="/discover" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 flex flex-col gap-2 group">
          <span className="text-green-500 text-2xl">🔍</span>
          <span className="text-white font-bold text-lg">Discover</span>
          <span className="text-gray-400 text-sm">Find new music based on your taste</span>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors mt-auto text-right">→</span>
        </a>

        <a href="/playlists" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 flex flex-col gap-2 group">
          <span className="text-green-500 text-2xl">🎧</span>
          <span className="text-white font-bold text-lg">Playlists</span>
          <span className="text-gray-400 text-sm">Browse your playlists and create new ones by mood</span>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors mt-auto text-right">→</span>
        </a>

      </div>
    </main>
  )
}
