import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import MoodSection from "./MoodSection"

async function getUserPlaylists(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  return res.json()
}

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const data = await getUserPlaylists(session.accessToken as string)
  const playlists = data.items || []

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">Playlists</h1>
      <p className="text-gray-400 mb-8">Your Spotify playlists and mood-based creation</p>

      {/* Mood-based playlist creation */}
      <MoodSection />

      {/* Playlist grid */}
      <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4 mt-10">Your Playlists</h2>
      {playlists.length === 0 ? (
        <p className="text-gray-500">No playlists found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((playlist: any) => (
            <a
              key={playlist.id}
              href={playlist.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-lg overflow-hidden group"
            >
              {playlist.images?.[0]?.url ? (
                <img
                  src={playlist.images[0].url}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-800 flex items-center justify-center text-4xl text-gray-600">
                  ♪
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium truncate group-hover:text-green-400 transition-colors">
                  {playlist.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{playlist.tracks?.total} tracks</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
