import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"

// Extend the built-in session and JWT types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      name?: string;
      email?: string;
      image?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}

// Configure NextAuth
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Save the access token and refresh token to the JWT on the initial login
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      return {
        ...session,
        accessToken: token.accessToken
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
});

// Export the handler for the GET and POST methods
export { handler as GET, handler as POST };