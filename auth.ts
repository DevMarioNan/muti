import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Instagram",
      credentials: {
        instagramToken: { label: "Instagram Token", type: "text" },
        instagramUserId: { label: "Instagram User ID", type: "text" },
        instagramUsername: { label: "Instagram Username", type: "text" },
        profilePictureUrl: { label: "Profile Picture URL", type: "text" },
      },
      async authorize(credentials) {
        const { instagramToken, instagramUserId, instagramUsername, profilePictureUrl } = credentials as {
          instagramToken: string
          instagramUserId: string
          instagramUsername?: string
          profilePictureUrl?: string
        }

        if (!instagramToken || !instagramUserId) {
          return null
        }

        // Find or create user by Instagram business account ID
        let metaAccount = await db.metaAccount.findUnique({
          where: { instagramBusinessId: instagramUserId },
          include: { user: true },
        })

        if (!metaAccount) {
          // Create new user with Instagram account
          const user = await db.user.create({
            data: {
              email: `instagram_${instagramUserId}@placeholder`, // Placeholder until user adds email
              name: instagramUsername || "Instagram User",
              avatarUrl: profilePictureUrl,
            },
          })

          metaAccount = await db.metaAccount.create({
            data: {
              userId: user.id,
              instagramBusinessId: instagramUserId,
              instagramUsername: instagramUsername || null,
              accessToken: instagramToken,
            },
            include: { user: true },
          })
        } else {
          // Update existing account token
          metaAccount = await db.metaAccount.update({
            where: { instagramBusinessId: instagramUserId },
            data: { accessToken: instagramToken },
            include: { user: true },
          })
        }

        return {
          id: metaAccount.user.id,
          email: metaAccount.user.email,
          name: metaAccount.user.name,
          image: metaAccount.user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      // Pass through the expiry time for client-side checks
      if (token.exp) {
        // Set session expiry to match JWT expiry
        session.expires = new Date(token.exp * 1000) as typeof session.expires
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    /*
     * WARNING: This implementation has a stateless limitation.
     * Since we use JWT strategy without a database session store,
     * token refresh/rotation cannot persist across multiple server instances.
     * If deploying to a multi-instance environment, consider:
     * 1. Using a shared session store (like Redis) with JWT session strategy
     * 2. Implementing token refresh via a dedicated refresh token endpoint
     * 3. Using NextAuth's database session strategy with adapter
     */
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
})