"use client"
import { useState, useEffect } from "react"

export default function FilterPage() {
  const [tracks, setTracks] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [artistFilter, setArtistFilter] = useState("")
  const [timeRange, setTimeRange] = useState("short_term")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const tracksRes = await fetch("/api/spotify/top-tracks?time_range=" + timeRange, { credentials: "include" })
      const tracksData = await tracksRes.json()
      setTracks(tracksData.items || [])
      setFiltered(tracksData.items || [])
      setLoading(false)
    }
    fetchData()
  }, [timeRange])

  useEffect(() => {
    if (!artistFilter) {
      setFiltered(tracks)
      return
    }
    setFiltered(tracks.filter((t: any) =>
      t.artists.some((a: any) => a.name.toLowerCase().includes(artistFilter.toLowerCase()))
    ))
  }, [artistFilter, tracks])

  async function createPlaylist() {
    setCreating(true)
    setMessage("")
    const uris = filtered.map((t: any) => t.uri)
    const label = timeRange === "short_term" ? "Last 4 Weeks" : timeRange === "medium_term" ? "Last 6 Months" : "All Time"
    const name = "Spotify Tracker - " + label + (artistFilter ? " - " + artistFilter : "")
    try {
      const res = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, uris: uris })
      })
      const data = await res.json()
      if (data.url) {
        setMessage("Playlist created! Open in Spotify: " + data.url)
      } else {
        setMessage("Something went wrong: " + JSON.stringify(data))
      }
    } catch(e) {
      setMessage("Error: " + String(e))
    }
    setCreating(false)
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Filter Your Music</h1>
      <p className="text-gray-400 mb-8">Slice your listening data and create playlists from the results</p>
      <div className="flex gap-4 mb-8 flex-wrap items-center">
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className="bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="short_term">Last 4 Weeks</option>
          <option value="medium_term">Last 6 Months</option>
          <option value="long_term">All Time</option>
        </select>
        <input
          type="text"
          placeholder="Filter by artist name..."
          value={artistFilter}
          onChange={e => setArtistFilter(e.target.value)}
          className="bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 w-64"
        />
        <span className="text-gray-400">{filtered.length} tracks</span>
        <button
          onClick={createPlaylist}
          disabled={creating || filtered.length === 0}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-bold py-2 px-6 rounded-full ml-auto"
        >
          {creating ? "Creating..." : "Create Playlist"}
        </button>
      </div>
      {message && <p className="text-green-400 mb-6">{message}</p>}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((track: any, i: number) => (
            <div key={track.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg">
              <span className="text-gray-500 w-6">{i + 1}</span>
              <img src={track.album.images[2]?.url} className="w-10 h-10 rounded" />
              <div>
                <p className="font-medium">{track.name}</p>
                <p className="text-gray-400 text-sm">{track.artists.map((a: any) => a.name).join(", ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}