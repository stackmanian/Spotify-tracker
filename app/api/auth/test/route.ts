export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
    clientIdLength: process.env.SPOTIFY_CLIENT_ID?.length,
    clientIdStart: process.env.SPOTIFY_CLIENT_ID?.slice(0, 4),
    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    secretLength: process.env.SPOTIFY_CLIENT_SECRET?.length,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    vercelUrl: process.env.VERCEL_URL,
  })
}
