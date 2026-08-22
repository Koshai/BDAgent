import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const apiBase = () => process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "dev-auth-secret-change-me-please-32ch",
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        name: {},
        mode: {},
      },
      authorize: async (credentials) => {
        const mode = String(credentials.mode ?? "login");
        const path = mode === "register" ? "/v1/auth/register" : "/v1/auth/login";
        const body: Record<string, string> = {
          email: String(credentials.email ?? ""),
          password: String(credentials.password ?? ""),
        };
        if (mode === "register") body.name = String(credentials.name ?? "Merchant");
        const res = await fetch(`${apiBase()}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          token: string;
          user: { id: string; email: string; name: string };
        };
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          accessToken: data.token,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
