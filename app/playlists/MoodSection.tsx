"use client"
import { useState } from "react"

const MOOD_PRESETS = [
  { label: "Happy",  seeds: "pop,dance pop,happy",   emoji: "😊" },
  { label: "Focus",  seeds: "focus,study,ambient",   emoji: "🎯" },
  { label: "Chill",  seeds: "chill,lo-fi,indie",     emoji: "😌" },
  { label: "Hype",   seeds: "hip-hop,rap,trap",      emoji: "🔥" },
  { label: "Sleep",  seeds: "sleep,ambient,piano",   emoji: "🌙" },
]

export default function MoodSection() {
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function createMoodPlaylist(mood: typeof MOOD_PRESETS[0]) {
    setCreating(mood.label)
    setError("")
    try {
      const recRes = await fetch(
        `/api/spotify/recommendations?seed_genres=${encodeURIComponent(mood.seeds)}&limit=30`,
        { credentials: "include" }
      )
      const recData = recRes.ok ? await recRes.json().catch(() => ({})) : {}
      const uris = (recData.tracks || []).map((t: any) => t.uri)

      if (uris.length === 0) {
        setError(`Couldn't get recommendations for ${mood.label}. Try again.`)
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
