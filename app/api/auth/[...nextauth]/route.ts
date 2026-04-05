import NextAuth, { NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-top-read user-read-recently-played user-library-read playlist-read-private playlist-modify-public playlist-modify-private"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
