import { getEventBySlug } from "@/lib/events";
import { wallClockNow } from "@/lib/format";
import { buildEventIcs } from "@/lib/ics";
import { upcomingOccurrences, occurrenceEnd } from "@/lib/recurrence";

// A slug reaches a Content-Disposition header, so only slugify's own alphabet
// is allowed through — a newline in it would be header injection.
function safeFileName(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, "") || "event";
}

// For Apple Calendar and the phone apps; Google and Outlook users get
// template links on the page instead, which add the event without a download.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return new Response(null, { status: 404 });
  }

  const start = upcomingOccurrences(event, wallClockNow(), 1)[0] ?? event.startAt;
  if (!start) {
    return new Response(null, { status: 404 });
  }

  const ics = buildEventIcs({
    uid: `${event.id}-${start.toISOString().slice(0, 10)}@sejscc.org`,
    title: event.title,
    start,
    end: occurrenceEnd(event, start),
    stamp: new Date(),
    description: event.description,
    location: event.location,
    url: new URL(`/events/${event.slug}`, request.url).href,
  });

  // `inline`, not `attachment`: iOS Safari opens an inline .ics straight into
  // the Calendar sheet, where an attachment detours through Files.
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeFileName(event.slug)}.ics"`,
    },
  });
}
