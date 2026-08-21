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
  type UserRole,
} from "@/db/schema";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM || "SEJSCC Admin <onboarding@resend.dev>",
    }),
  ],
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login/check-email",
    // Without this, Auth.js falls back to its own bare "Server error" page.
    error: "/admin/login",
  },
  callbacks: {
    async signIn({ user, email }) {
      // Runs before the magic link is sent, so a non-allowlisted address
      // never receives an email at all.
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "editor";
      }
      if (trigger === "update") {
        // Set by updateProfileName() in the profile form's server action.
        const updatedName = (session as { user?: { name?: string } } | undefined)
          ?.user?.name;
        if (typeof updatedName === "string" && updatedName.trim()) {
          token.name = updatedName.trim();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
