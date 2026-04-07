"use client"
import { useState } from "react"

// Spotify deprecated /v1/recommendations for new apps — mood playlists use
// the user's own top tracks (short_term for energy, long_term for nostalgic, etc.)
const MOOD_PRESETS = [
  { label: "Happy",     emoji: "😊", timeRange: "short_term"  },
  { label: "Focus",     emoji: "🎯", timeRange: "medium_term" },
  { label: "Chill",     emoji: "😌", timeRange: "medium_term" },
  { label: "Hype",      emoji: "🔥", timeRange: "short_term"  },
  { label: "Nostalgic", emoji: "🌙", timeRange: "long_term"   },
]

export default function MoodSection() {
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function createMoodPlaylist(mood: typeof MOOD_PRESETS[0]) {
    setCreating(mood.label)
    setError("")
    try {
      const tracksRes = await fetch(
        `/api/spotify/top-tracks?time_range=${mood.timeRange}`,
        { credentials: "include" }
      )
      const tracksData = tracksRes.ok ? await tracksRes.json().catch(() => ({})) : {}
      const uris = (tracksData.items || []).map((t: any) => t.uri)

      if (uris.length === 0) {
        setError(`Couldn't load tracks for ${mood.label}. Try again.`)
        setCreating(null)
        return
      }

      const res = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Spotify Tracker — ${mood.label} Vibes`, uris }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.reload()
      } else {
        setError("Failed to create playlist: " + JSON.stringify(data))
      }
    } catch (e) {
      setError("Error: " + String(e))
    }
    setCreating(null)
  }

  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">Create by Mood</h2>
      <div className="flex flex-wrap gap-3 mb-2">
        {MOOD_PRESETS.map(mood => (
          <button
            key={mood.label}
            onClick={() => createMoodPlaylist(mood)}
            disabled={creating !== null}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl px-5 py-3 text-sm font-medium"
          >
            <span>{mood.emoji}</span>
            <span>{creating === mood.label ? "Creating..." : mood.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
