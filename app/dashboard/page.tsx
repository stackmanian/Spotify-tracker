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
    "https://api.spotify.com/v1/me/player/recently-played?limit=10",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )
  return res.json()
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const [tracks, artists, recent] = await Promise.all([
    getTopTracks(session.accessToken as string),
    getTopArtists(session.accessToken as string),
    getRecentlyPlayed(session.accessToken as string),
  ])

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-8">Spotify Tracker</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-400">Top Tracks</h2>
          <div className="space-y-3">
            {tracks.items?.map((track: any, i: number) => (
              <div key={track.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg">
                <span className="text-gray-500 w-5 text-sm">{i + 1}</span>
                <img src={track.album.images[2]?.url} className="w-9 h-9 rounded" />
                <div className="overflow-hidden">
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-gray-400 text-xs truncate">{track.artists[0].name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-400">Top Artists</h2>
          <div className="space-y-3">
            {artists.items?.map((artist: any, i: number) => (
              <div key={artist.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg">
                <span className="text-gray-500 w-5 text-sm">{i + 1}</span>
                <img src={artist.images[2]?.url} className="w-9 h-9 rounded-full" />
                <p className="font-medium text-sm truncate">{artist.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-400">Recently Played</h2>
          <div className="space-y-3">
            {recent.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg">
                <img src={item.track.album.images[2]?.url} className="w-9 h-9 rounded" />
                <div className="overflow-hidden">
                  <p className="font-medium text-sm truncate">{item.track.name}</p>
                  <p className="text-gray-400 text-xs truncate">{item.track.artists[0].name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
