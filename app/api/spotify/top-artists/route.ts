import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get("time_range") || "short_term"
  const limit = searchParams.get("limit") || "50"

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${timeRange}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  )
  const data = await response.json()
  return NextResponse.json(data)
}
