// Backfills accounts from when an existing `user` row was enough to sign in.
// Additive and idempotent — safe to re-run, and safe to run before the deploy.
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const added = await sql`
  insert into allowed_email (email)
  select lower(email) from "user"
  on conflict do nothing
  returning email
`;

console.log(
  added.length
    ? `Added ${added.length} address(es):\n  ${added.map((row) => row.email).join("\n  ")}`
    : "Every account is already on the allowlist. Nothing to do."
);
