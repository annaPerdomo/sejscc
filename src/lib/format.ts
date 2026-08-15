// Event times are stored as Los Angeles wall-clock values with a fake UTC
// marker (e.g. "4:00 PM in Norwalk" is stored as 16:00Z). Every formatter
// must therefore read them back in UTC — never in server-local time.

export function formatEventDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatEventTime(start: Date | null, end: Date | null) {
  if (!start) return null;
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
