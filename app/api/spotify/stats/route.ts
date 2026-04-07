export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getDb } from "../../../../lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const db = getDb()

  // Total time this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthRow = db.prepare(`
    SELECT COALESCE(SUM(duration_ms), 0) as total_ms, COUNT(*) as play_count
    FROM plays WHERE played_at >= ?
  `).get(startOfMonth) as any

  // Play count per track (top 10)
  const trackCounts = db.prepare(`
    SELECT track_id, track_name, artist_name, COUNT(*) as play_count, SUM(duration_ms) as total_ms
    FROM plays
    GROUP BY track_id
    ORDER BY play_count DESC
    LIMIT 10
  `).all()

  // Listening time per artist (top 10)
  const artistTime = db.prepare(`
    SELECT artist_id, artist_name, SUM(duration_ms) as total_ms, COUNT(*) as play_count
    FROM plays
    GROUP BY artist_id
    ORDER BY total_ms DESC
    LIMIT 10
  `).all()

  // Total plays collected
  const totalRow = db.prepare(`SELECT COUNT(*) as total FROM plays`).get() as any

  return NextResponse.json({
    month: {
      total_ms: monthRow.total_ms,
      play_count: monthRow.play_count,
    },
    top_tracks: trackCounts,
    top_artists: artistTime,
    total_plays_collected: totalRow.total,
  })
}
