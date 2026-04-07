export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const artistId = searchParams.get("artist_id")
  if (!artistId) return NextResponse.json({ error: "artist_id required" }, { status: 400 })

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  )
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  return NextResponse.json(data)
}
