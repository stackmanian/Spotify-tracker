"use client"
import { useState, useEffect } from "react"

type SortMode = "relevance" | "latest"

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

function sortTracks(tracks: any[], mode: SortMode): any[] {
  const sorted = [...tracks]
  switch (mode) {
    case "latest":
      return sorted.sort((a, b) => (b.album?.release_date ?? "").localeCompare(a.album?.release_date ?? ""))
    case "relevance":
      return sorted.sort((a, b) => b.relevance - a.relevance || b.popularity - a.popularity)
  }
}

export default function DiscoverPage() {
  const [allTracks, setAllTracks] = useState<any[]>([])
  const [sourceArtists, setSourceArtists] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>("relevance")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/spotify/discover", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setAllTracks(data.tracks || [])
        setSourceArtists(data.source_artists || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tracks = sortTracks(allTracks, sortMode)

  function toggleTrack(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(allTracks.map(t => t.id)))
  }

  function cancelSelect() {
    setSelected(new Set())
    setSelecting(false)
  }

  async function createPlaylist() {
    setCreating(true)
    setMessage("")
    const uris = tracks.filter(t => selected.has(t.id)).map(t => t.uri)
    if (uris.length === 0) {
      setMessage("Select at least one track")
      setCreating(false)
      return
    }

    try {
      const res = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Discover — " + new Date().toLocaleDateString(),
          uris,
        }),
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

  function shuffle() {
    setLoading(true)
    setMessage("")
    setSelecting(false)
    setSelected(new Set())
    fetch("/api/spotify/discover", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setAllTracks(data.tracks || [])
        setSourceArtists(data.source_artists || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Discover</h1>
      <p className="text-gray-400 mb-2">
        Music from artists who collaborate with your favorites
      </p>
      {sourceArtists.length > 0 && (
        <p className="text-gray-500 text-sm mb-6">
          Based on: {sourceArtists.map(a => a.name).join(", ")}
        </p>
      )}

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        {(["relevance", "latest"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors capitalize ${
              sortMode === mode ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <button
          onClick={shuffle}
          disabled={loading}
          className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-5 rounded-full text-sm font-medium transition-colors"
        >
          {loading ? "Loading..." : "Shuffle Recommendations"}
        </button>
        {!selecting ? (
          <button
            onClick={() => setSelecting(true)}
            className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white py-2 px-5 rounded-full text-sm transition-colors"
          >
            Select
          </button>
        ) : (
          <>
            <button
              onClick={selectAll}
              className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white py-2 px-4 rounded-full text-sm transition-colors"
            >
              Select All
            </button>
            <button
              onClick={cancelSelect}
              className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white py-2 px-4 rounded-full text-sm transition-colors"
            >
              Cancel
            </button>
            {selected.size > 0 && (
              <>
                <span className="text-gray-500 text-sm">{selected.size} selected</span>
                <button
                  onClick={createPlaylist}
                  disabled={creating}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-bold py-2 px-6 rounded-full ml-auto transition-colors"
                >
                  {creating ? "Creating..." : "Create Playlist"}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {message && <p className="text-red-400 mb-6 text-sm">{message}</p>}

      {loading ? (
        <p className="text-gray-400">Finding new music for you...</p>
      ) : tracks.length === 0 ? (
        <p className="text-gray-500">No new tracks found. Try shuffling.</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track: any) => (
            <div
              key={track.id}
              onClick={selecting ? () => toggleTrack(track.id) : undefined}
              className={`flex items-center gap-4 p-3 rounded-lg bg-gray-900 ${selecting ? "cursor-pointer" : ""}`}
            >
              {selecting && (
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  selected.has(track.id) ? "border-green-500 bg-green-500" : "border-gray-600"
                }`}>
                  {selected.has(track.id) && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
              {track.album?.images?.[2]?.url ? (
                <img src={track.album.images[2].url} className="w-10 h-10 rounded shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-800 shrink-0" />
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-gray-400 text-sm truncate">
                  {track.artists?.map((a: any) => a.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-gray-600 text-xs hidden sm:block">
                  via {track.discovered_from?.join(", ")}
                </span>
                <span className="text-gray-500 text-sm tabular-nums">
                  {formatDuration(track.duration_ms)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
