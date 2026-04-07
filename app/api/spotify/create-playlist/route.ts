export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 })
  
  const body = await req.json()
  console.log("SCOPE:", (session as any).scope)
  console.log("FIRST URI:", body.uris?.[0])
  
  const pl = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "POST",
    headers: { Authorization: "Bearer " + session.accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ name: body.name, public: false })
  })
  const playlist = await pl.json()
  if (!playlist.id) return NextResponse.json({ error: JSON.stringify(playlist) })

  const validUris = (body.uris || []).filter(Boolean).slice(0, 100)
  console.log("URI COUNT:", validUris.length, "FIRST:", validUris[0])
  // Try URIs as query parameter (alternative to request body)
  const addRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
    {
      method: "POST",
      headers: { Authorization: "Bearer " + session.accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: validUris }),
    }
  )
  const addData = await addRes.json()
  console.log("ADD RESULT:", JSON.stringify(addData))
  if (addData.error) {
    return NextResponse.json({ error: "Track add failed: " + addData.error.message })
  }
  return NextResponse.json({ url: playlist.external_urls.spotify })
}