export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getDb } from "../../../../lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  )
  const data = await response.json()
  if (!data.items?.length) return NextResponse.json({ collected: 0 })

  const db = getDb()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO plays (track_id, track_name, artist_name, artist_id, duration_ms, played_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  let added = 0
  const insertMany = db.transaction((items: any[]) => {
    for (const item of items) {
      const track = item.track
      const result = insert.run(
        track.id,
        track.name,
        track.artists?.[0]?.name ?? "Unknown",
        track.artists?.[0]?.id ?? "",
        track.duration_ms ?? 0,
        item.played_at
      )
      if (result.changes > 0) added++
    }
  })

  insertMany(data.items)

  return NextResponse.json({ collected: added, total: data.items.length })
}
