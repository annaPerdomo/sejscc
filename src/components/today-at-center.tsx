import { DatePage } from "@/components/date-page";
import type { DayBooking } from "@/lib/calendar-spaces";

function BookingLines({ bookings, allDay }: { bookings: DayBooking[]; allDay: string }) {
  return (
    <ul className="mt-1.5 flex flex-col gap-1 sm:gap-0.5">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="flex flex-col leading-snug sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3"
        >
          <span className="font-display text-lg font-semibold text-white">{booking.title}</span>
          <span className="text-base text-white/90">
            {[booking.time ?? allDay, booking.location].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TodayAtCenter({
  month,
  day,
  weekday,
  dateInWords,
  bookings,
  next,
  labels,
}: {
  month: string;
  day: string;
  weekday: string;
  dateInWords: string;
  bookings: DayBooking[];
  next: { dateInWords: string; bookings: DayBooking[] } | null;
  labels: {
    heading: string;
    none: string;
    /** Template with a `{date}` placeholder. */
    next: string;
    allDay: string;
  };
}) {
  return (
    <div className="flex items-start gap-5 border-y border-gold/70 py-4 sm:gap-6">
      <DatePage month={month} day={day} weekday={weekday} size="md" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-sm font-semibold tracking-[0.16em] text-blossom uppercase">
          {labels.heading}
        </h2>
        <p className="sr-only">{dateInWords}</p>
        {bookings.length > 0 ? (
          <BookingLines bookings={bookings} allDay={labels.allDay} />
        ) : (
          <>
            <p className="mt-1 text-lg text-white">{labels.none}</p>
            {next && (
              <>
                <h3 className="mt-4 font-display text-sm font-semibold tracking-[0.16em] text-blossom uppercase">
                  {labels.next.replace("{date}", next.dateInWords)}
                </h3>
                <BookingLines bookings={next.bookings} allDay={labels.allDay} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
