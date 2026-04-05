import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"

async function getTopTracks(accessToken: string) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )
  return res.json()
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const tracks = await getTopTracks(session.accessToken as string)

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-6">Spotify Tracker</h1>
      <h2 className="text-xl font-semibold mb-4">Your Top Tracks (Last 4 Weeks)</h2>
      <div className="space-y-3">
        {tracks.items?.map((track: any, i: number) => (
          <div key={track.id} className="flex items-center gap-4 bg-gray-900 p-3 rounded-lg">
            <span className="text-gray-500 w-6">{i + 1}</span>
            <img src={track.album.images[2]?.url} className="w-10 h-10 rounded" />
            <div>
              <p className="font-medium">{track.name}</p>
              <p className="text-gray-400 text-sm">{track.artists[0].name}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
