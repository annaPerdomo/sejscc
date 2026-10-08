// Swallowing is deliberate: static generation must succeed before the database
// is provisioned, and an outage should degrade the site rather than crash it.
export async function failSoft<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error("Database query failed:", error);
    return fallback;
  }
}
