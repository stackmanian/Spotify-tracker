import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Spotify Tracker</h1>
        <p className="text-gray-400 mb-8">Your personal listening dashboard</p>
        
          href="/api/auth/signin"
          className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-full"
        >
          Login with Spotify
        </a>
      </div>
    </main>
  )
}