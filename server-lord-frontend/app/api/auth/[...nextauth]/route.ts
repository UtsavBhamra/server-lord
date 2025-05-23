// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        try {
          // Using fetch instead of axios to simplify
          const response = await fetch(`http://localhost:3000/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || 'Authentication failed')
          }
          // Map the Go backend response to NextAuth user object
          return {
            id: data.user.id.toString(),
            name: data.user.username,
            email: data.user.email,
            accessToken: data.token
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.accessToken = token.accessToken as string
        // Make sure username is available
        session.user.name = token.name
      }
      return session
    },
    // Add logout callback to invalidate the token on the server side if needed
    async signOut({ token, session }) {
      // You can add logic here to call your backend to invalidate the token
      try {
        // Optional: If you need to notify your backend about logout
        await fetch(`http://localhost:3000/api/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.accessToken}`
          },
        });
      } catch (error) {
        console.error("Logout error:", error);
        // Continue with local logout even if server logout fails
      }
      return true;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: 'server-lord-secret',
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }