import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession()
  
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const response = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  )

  const data = await response.json()
  return NextResponse.json(data)
}
