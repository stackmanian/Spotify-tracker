import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"

async function getTopTracks(accessToken: string) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )
  return res.json()
}

async function getTopArtists(accessToken: string) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )
  return res.json()
}

async function getRecentlyPlayed(accessToken: string) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )
  return res.json()
}

function formatListeningTime(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

function getTopGenre(artists: any[]): string {
  if (!artists?.length) return "—"
  const genreCount = new Map<string, number>()
  for (const artist of artists) {
    for (const genre of (artist.genres || [])) {
      genreCount.set(genre, (genreCount.get(genre) ?? 0) + 1)
    }
  }
  if (genreCount.size === 0) return "—"
  let top = ""
  let max = 0
  genreCount.forEach((count, genre) => {
    if (count > max) { max = count; top = genre }
  })
  return top.replace(/\b\w/g, c => c.toUpperCase())
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const [tracks, artists, recent] = await Promise.all([
    getTopTracks(session.accessToken as string),
    getTopArtists(session.accessToken as string),
    getRecentlyPlayed(session.accessToken as string),
  ])

  // Estimated listening time this month from recently played
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const msThisMonth = (recent.items || [])
    .filter((item: any) => new Date(item.played_at) >= startOfMonth)
    .reduce((sum: number, item: any) => sum + (item.track.duration_ms ?? 0), 0)

  const topGenre = getTopGenre(artists.items || [])
  const topArtist = artists.items?.[0]
  const topTrack = tracks.items?.[0]

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Spotify Tracker</h1>
      <p className="text-gray-400 mb-8">Your listening at a glance</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

        <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-1">
          <span className="text-gray-400 text-xs uppercase tracking-wider">This Month</span>
          <span className="text-white text-2xl font-bold">~{formatListeningTime(msThisMonth)}</span>
          <span className="text-gray-400 text-sm">estimated listening</span>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-1">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Top Genre</span>
          <span className="text-white text-2xl font-bold truncate">{topGenre}</span>
          <span className="text-gray-400 text-sm">most played style</span>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Top Artist</span>
          <div className="flex items-center gap-2">
            {topArtist?.images?.[1]?.url && (
              <img src={topArtist.images[1].url} className="w-10 h-10 rounded-full object-cover" />
            )}
            <span className="text-white font-bold truncate">{topArtist?.name ?? "—"}</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Top Track</span>
          <div className="flex items-center gap-2">
            {topTrack?.album?.images?.[2]?.url && (
              <img src={topTrack.album.images[2].url} className="w-10 h-10 rounded object-cover" />
            )}
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm truncate">{topTrack?.name ?? "—"}</p>
              <p className="text-gray-400 text-xs truncate">{topTrack?.artists?.[0]?.name}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Cards */}
      <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Explore</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <a href="/filter" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 flex flex-col gap-2 group">
          <span className="text-green-500 text-2xl">📊</span>
          <span className="text-white font-bold text-lg">Stats & Filter</span>
          <span className="text-gray-400 text-sm">Explore your top tracks and artists by time range</span>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors mt-auto text-right">→</span>
        </a>

        <a href="/recently-played" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 flex flex-col gap-2 group">
          <span className="text-green-500 text-2xl">🎵</span>
          <span className="text-white font-bold text-lg">Recently Played</span>
          <span className="text-gray-400 text-sm">Your listening history with recommendations and new releases</span>
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
