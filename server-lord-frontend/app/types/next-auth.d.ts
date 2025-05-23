import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    accessToken?: string
    name?: string
  }

  interface Session {
    user: {
      id: string
      accessToken: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    accessToken: string
  }
}