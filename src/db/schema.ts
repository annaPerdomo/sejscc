import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js tables (users, accounts, sessions, verification tokens)
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // "admin" can manage users and site settings; "editor" can manage events.
  role: text("role", { enum: ["admin", "editor"] })
    .notNull()
    .default("editor"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// Board members must be on this list before a magic link will be sent.
// Admins manage it from the admin UI so onboarding never requires a deploy.
export const allowedEmails = pgTable("allowed_email", {
  email: text("email").primaryKey(),
  addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const events = pgTable("event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  // Flyer image shown on the site (uploaded to Vercel Blob).
  flyerUrl: text("flyer_url"),
  // Original printable file (PDF or full-res image) for download.
  flyerDownloadUrl: text("flyer_download_url"),
  startAt: timestamp("start_at", { mode: "date", withTimezone: true }),
  endAt: timestamp("end_at", { mode: "date", withTimezone: true }),
  location: text("location").default(
    "14615 S. Gridley Rd., Norwalk, CA 90650"
  ),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Groups that use the center: judo, basketball, Japanese school, etc.
export const groups = pgTable("group", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  contactEmail: text("contact_email"),
  meetingSchedule: text("meeting_schedule"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});
