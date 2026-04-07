"use client"
import { useState, useEffect } from "react"

// Spotify API only exposes 3 time ranges. We display 5 labels but map pairs
// to the same underlying value (Last Month + Last 3 Months both → short_term,
// Last Year + All Time both → long_term).
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

function getGenreBreakdown(artists: any[]): { genre: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const artist of artists) {
    for (const genre of (artist.genres || [])) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({ genre, count }))
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

function formatTotalTime(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

export default function FilterPage() {
  const [view, setView] = useState<"tracks" | "artists" | "genres">("tracks")
  const [tracks, setTracks] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [filteredArtists, setFilteredArtists] = useState<any[]>([])
  const [nameFilter, setNameFilter] = useState("")
  const [rangeIndex, setRangeIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState("")

  const timeRange = TIME_RANGES[rangeIndex].value

  // Fetch tracks and artists whenever the time range changes
  useEffect(() => {
    setLoading(true)
    setMessage("")
    Promise.all([
      fetch("/api/spotify/top-tracks?time_range=" + timeRange, { credentials: "include" }).then(r => r.json()),
      fetch("/api/spotify/top-artists?time_range=" + timeRange, { credentials: "include" }).then(r => r.json()),
    ]).then(([tracksData, artistsData]) => {
      setTracks(tracksData.items || [])
      setFiltered(tracksData.items || [])
      setArtists(artistsData.items || [])
      setFilteredArtists(artistsData.items || [])
      setLoading(false)
    })
  }, [timeRange])

  // Apply name filter client-side
  useEffect(() => {
    if (!nameFilter) {
      setFiltered(tracks)
      setFilteredArtists(artists)
      return
    }
    const q = nameFilter.toLowerCase()
    setFiltered(tracks.filter((t: any) =>
      t.name.toLowerCase().includes(q) ||
      t.artists.some((a: any) => a.name.toLowerCase().includes(q))
    ))
    setFilteredArtists(artists.filter((a: any) => a.name.toLowerCase().includes(q)))
  }, [nameFilter, tracks, artists])

  async function createPlaylist() {
    setCreating(true)
    setMessage("")
    const userUris = filtered.map((t: any) => t.uri)
    const userIds  = filtered.map((t: any) => t.id)
    const name = "Spotify Tracker — " + TIME_RANGES[rangeIndex].label + (nameFilter ? " — " + nameFilter : "")

    const TARGET = 40
    let finalUris = [...userUris]

    // Fill up to 40 tracks with Spotify recommendations seeded from user's tracks
    if (userUris.length < TARGET && userIds.length > 0) {
      const needed = TARGET - userUris.length
      const seedIds = userIds.slice(0, 5).join(",")
      try {
        const recRes = await fetch(
          `/api/spotify/recommendations?seed_tracks=${seedIds}&limit=${Math.min(needed, 50)}`,
          { credentials: "include" }
        )
        const recData = recRes.ok ? await recRes.json().catch(() => ({})) : {}
        const recUris = (recData.tracks || [])
          .filter((t: any) => !userUris.includes(t.uri))
          .slice(0, needed)
          .map((t: any) => t.uri)
        finalUris = [...userUris, ...recUris]
      } catch {
        // If recommendations fail, proceed with user tracks only
      }
    }

    try {
      const res = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, uris: finalUris }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = "/playlists"
      } else {
        setMessage("Something went wrong: " + JSON.stringify(data))
      }
    } catch (e) {
      setMessage("Error: " + String(e))
    }
    setCreating(false)
  }

  const totalMs = filtered.reduce((sum: number, t: any) => sum + (t.duration_ms ?? 0), 0)

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Stats & Filter</h1>
      <p className="text-gray-400 mb-8">Explore your listening data and create playlists</p>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {(["tracks", "artists", "genres"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors capitalize ${view === v ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Time range button group */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* Filter bar — hidden in genres view */}
      <div className={`flex gap-4 mb-6 flex-wrap items-center ${view === "genres" ? "hidden" : ""}`}>
        <input
          type="text"
          placeholder={view === "tracks" ? "Filter by track or artist..." : "Filter by artist name..."}
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
          className="bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 w-72"
        />
        <span className="text-gray-400 text-sm">
          {view === "tracks" ? `${filtered.length} tracks` : `${filteredArtists.length} artists`}
        </span>
        {view === "tracks" && (
          <>
            {totalMs > 0 && (
              <span className="text-gray-500 text-sm">{formatTotalTime(totalMs)} total</span>
            )}
            <button
              onClick={createPlaylist}
              disabled={creating || filtered.length === 0}
              className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-bold py-2 px-6 rounded-full ml-auto"
            >
              {creating ? "Creating..." : "Create Playlist"}
            </button>
          </>
        )}
      </div>

      {message && <p className="text-red-400 mb-6 text-sm">{message}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : view === "tracks" ? (
        <div className="space-y-2">
          {filtered.map((track: any, i: number) => (
            <div key={track.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg">
              <span className="text-gray-500 w-6 text-sm">{i + 1}</span>
              <img src={track.album.images[2]?.url} className="w-10 h-10 rounded" />
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-gray-400 text-sm truncate">{track.artists.map((a: any) => a.name).join(", ")}</p>
              </div>
              <span className="text-gray-400 text-sm tabular-nums ml-auto shrink-0">
                {formatDuration(track.duration_ms)}
              </span>
            </div>
          ))}
        </div>
      ) : view === "genres" ? (
        <div>
          <p className="text-gray-500 text-sm mb-6">Based on your top artists · {TIME_RANGES[rangeIndex].label}</p>
          {(() => {
            const breakdown = getGenreBreakdown(artists)
            if (breakdown.length === 0) return <p className="text-gray-500">No genre data available.</p>
            const max = breakdown[0].count
            return (
              <div className="space-y-3 max-w-2xl">
                {breakdown.map(({ genre, count }, i) => (
                  <div key={genre} className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs w-5">{i + 1}</span>
                    <span className="text-white text-sm font-medium w-40 shrink-0">{capitalize(genre)}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.round((count / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArtists.map((artist: any, i: number) => (
            <div key={artist.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg">
              <span className="text-gray-500 w-6 text-sm">{i + 1}</span>
              <img src={artist.images[2]?.url} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{artist.name}</p>
                <p className="text-gray-400 text-sm truncate">{artist.followers?.total?.toLocaleString()} followers</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {(artist.genres || []).slice(0, 3).map((g: string) => (
                  <span key={g} className="text-xs bg-gray-800 text-green-400 rounded-full px-2 py-0.5 shrink-0">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
