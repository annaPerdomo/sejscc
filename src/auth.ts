import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  allowedEmails,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // JWT sessions so the middleware can check auth without a database round-trip.
  session: { strategy: "jwt" },
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "SEJSCC Admin <admin@sejscc.org>",
    }),
  ],
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login/check-email",
  },
  callbacks: {
    async signIn({ user, email }) {
      // Runs before the magic link is sent: only allowlisted board members
      // (or already-registered users) get an email at all.
      if (email?.verificationRequest) {
        const address = user.email?.toLowerCase();
        if (!address) return false;
        const [allowed] = await db
          .select()
          .from(allowedEmails)
          .where(eq(allowedEmails.email, address));
        if (allowed) return true;
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, address));
        return Boolean(existing);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "editor";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "editor";
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "editor";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
