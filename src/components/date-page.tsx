const SIZES = {
  sm: {
    page: "w-16",
    month: "pt-2.5 pb-1 text-xs",
    day: "pt-1 text-3xl",
    weekday: "pb-2 text-xs",
  },
  lg: {
    page: "w-24 sm:w-28",
    month: "pt-3.5 pb-1.5 text-sm",
    day: "pt-1.5 text-5xl sm:text-6xl",
    weekday: "pb-3 text-sm",
  },
};

/** Decorative: pair it with the date in words, on screen or in `sr-only` text. */
export function DatePage({
  month,
  day,
  weekday,
  size = "sm",
  className = "",
}: {
  month: string;
  day: string;
  weekday?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const styles = SIZES[size];
  return (
    <span aria-hidden="true" className={`date-page shrink-0 ${styles.page} ${className}`}>
      <span
        className={`date-page-month font-display font-bold tracking-[0.18em] uppercase ${styles.month}`}
      >
        {month}
      </span>
      <span className={`font-display leading-none font-medium ${styles.day}`}>
        {day}
      </span>
      {weekday && (
        <span className={`mt-1 font-display font-semibold text-ink-soft ${styles.weekday}`}>
          {weekday}
        </span>
      )}
    </span>
  );
}
