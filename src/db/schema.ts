import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
// Relative, not "@/": drizzle-kit loads this file outside Next's path aliases.
import { CENTER_ADDRESS } from "../lib/center";

// The four tables below are shaped by @auth/drizzle-adapter, not by us.
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: text("role", { enum: ["admin", "editor"] })
    .notNull()
    .default("editor"),
});

export type UserRole = (typeof users.$inferSelect)["role"];

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

// Gates magic links: see the signIn callback in src/auth.ts.
export const allowedEmails = pgTable("allowed_email", {
  email: text("email").primaryKey(),
  addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
});

export const eventRepeats = ["none", "weekly", "biweekly", "monthly"] as const;

export const events = pgTable("event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  flyerUrl: text("flyer_url"), // image rendered on the site
  flyerDownloadUrl: text("flyer_download_url"), // original printable PDF/image
  signupUrl: text("signup_url"),
  startAt: timestamp("start_at", { mode: "date", withTimezone: true }),
  endAt: timestamp("end_at", { mode: "date", withTimezone: true }),
  // startAt is the first date of the series; monthly repeats keep its weekday
  // and its position in the month. See src/lib/recurrence.ts.
  repeat: text("repeat", { enum: eventRepeats }).notNull().default("none"),
  repeatUntil: timestamp("repeat_until", { mode: "date", withTimezone: true }),
  location: text("location").default(CENTER_ADDRESS),
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

export type EventRepeat = (typeof events.$inferSelect)["repeat"];

export const weekDays = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

// Community organizations that use the center (judo, basketball, the gakuen).
export const groups = pgTable("group", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  description: text("description"),
  imageUrl: text("image_url"),
  imageIsLogo: boolean("image_is_logo").notNull().default(false),
  photoUrls: text("photo_urls").array().notNull().default([]),
  websiteUrl: text("website_url"),
  contactEmail: text("contact_email"),
  meetingSchedule: text("meeting_schedule"),
  meetingDays: text("meeting_days", { enum: weekDays }).array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  status: text("status", { enum: ["meeting", "paused", "cancelled"] })
    .notNull()
    .default("meeting"),
});

export type GroupStatus = (typeof groups.$inferSelect)["status"];
export type WeekDay = (typeof weekDays)[number];

export const SITE_SETTINGS_ID = "site";

export const siteSettings = pgTable("site_setting", {
  id: text("id").primaryKey().default(SITE_SETTINGS_ID),
  accessRequestEmail: text("access_request_email"),
  aboutVideoUrls: text("about_video_urls").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const VOLUNTEER_SECTION_ID = "home";

export const volunteerSection = pgTable("volunteer_section", {
  id: text("id").primaryKey().default(VOLUNTEER_SECTION_ID),
  title: text("title").notNull(),
  titleJa: text("title_ja"),
  intro: text("intro").notNull(),
  introJa: text("intro_ja"),
  photoUrl: text("photo_url"),
  photoAlt: text("photo_alt").notNull(),
  photoAltJa: text("photo_alt_ja"),
  volunteersNote: text("volunteers_note").notNull(),
  volunteersNoteJa: text("volunteers_note_ja"),
  contactNote: text("contact_note").notNull(),
  contactNoteJa: text("contact_note_ja"),
  contactLinkLabel: text("contact_link_label").notNull(),
  contactLinkLabelJa: text("contact_link_label_ja"),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type VolunteerSectionRow = typeof volunteerSection.$inferSelect;

export const boardMembers = pgTable("board_member", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  role: text("role"),
  roleJa: text("role_ja"),
  photoUrl: text("photo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BoardMember = typeof boardMembers.$inferSelect;
