const SIZES = {
  sm: { stamp: "-mt-3 size-18 sm:size-20", year: "text-lg sm:text-xl" },
  lg: { stamp: "-mt-4 size-22", year: "text-2xl" },
};

export function SchoolSeal({
  accent,
  year,
  size,
  className = "",
}: {
  accent: string;
  year: string;
  size: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-full left-1/2 -translate-x-1/2 -rotate-6 rounded-xs bg-magenta p-1 text-cream shadow-md ${SIZES[size].stamp} ${className}`}
    >
      <span className="flex h-full flex-col items-center justify-center border-2 border-cream/90 outline outline-1 -outline-offset-4 outline-cream/60">
        <span className="font-accent text-xs leading-none font-bold tracking-[0.2em] uppercase">
          {accent}
        </span>
        <span className={`mt-1 font-accent leading-none font-bold ${SIZES[size].year}`}>{year}</span>
      </span>
    </span>
  );
}
