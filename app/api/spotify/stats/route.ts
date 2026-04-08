export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getMonthStats, getTopTracksByPlays, getTopArtistsByTime, getTotalPlays, getUniqueArtistsThisMonth, initDb } from "../../../../lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  await initDb()

  const [month, topTracks, topArtists, totalPlays, uniqueArtists] = await Promise.all([
    getMonthStats(),
    getTopTracksByPlays(10),
    getTopArtistsByTime(10),
    getTotalPlays(),
    getUniqueArtistsThisMonth(),
  ])

  return NextResponse.json({
    month: {
      total_ms: Number(month.total_ms),
      play_count: Number(month.play_count),
    },
    top_tracks: topTracks,
    top_artists: topArtists,
    total_plays_collected: Number(totalPlays),
    unique_artists: uniqueArtists,
  })
}
