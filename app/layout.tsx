import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Spotify Tracker",
  description: "Your personal listening dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <nav className="bg-gray-950 border-b border-gray-800 px-8 py-4 flex gap-6 items-center">
          <a href="/dashboard" className="text-green-500 font-bold text-lg mr-2">Spotify Tracker</a>
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">Dashboard</a>
          <a href="/filter" className="text-gray-400 hover:text-white text-sm">Stats</a>
          <a href="/recently-played" className="text-gray-400 hover:text-white text-sm">Recently Played</a>
          <a href="/playlists" className="text-gray-400 hover:text-white text-sm">Playlists</a>
          <a href="/api/auth/signout" className="text-gray-400 hover:text-white text-sm ml-auto">Sign Out</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
