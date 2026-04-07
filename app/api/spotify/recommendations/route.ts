export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") || "20"

  const params = new URLSearchParams({ limit })

  const seedTracks = searchParams.get("seed_tracks")
  if (seedTracks) {
    // Spotify allows max 5 seeds total
    const sliced = seedTracks.split(",").slice(0, 5).join(",")
    params.set("seed_tracks", sliced)
  }

  const seedGenres = searchParams.get("seed_genres")
  if (seedGenres) {
    const sliced = seedGenres.split(",").slice(0, 5).join(",")
    params.set("seed_genres", sliced)
  }

  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?${params.toString()}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  )
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  return NextResponse.json(data)
}
