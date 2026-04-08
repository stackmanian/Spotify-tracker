export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"
import { initDb, insertPlay } from "../../../../lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 })

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  )
  const data = await response.json()
  if (!data.items?.length) return NextResponse.json({ collected: 0 })

  await initDb()

  let added = 0
  for (const item of data.items) {
    const track = item.track
    const inserted = await insertPlay(
      track.id,
      track.name,
      track.artists?.[0]?.name ?? "Unknown",
      track.artists?.[0]?.id ?? "",
      track.duration_ms ?? 0,
      item.played_at
    )
    if (inserted) added++
  }

  return NextResponse.json({ collected: added, total: data.items.length })
}
