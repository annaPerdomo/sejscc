export function KanjiWatermark({
  char,
  className = "",
}: {
  char: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute font-accent text-watermark font-medium select-none ${className}`}
    >
      {char}
    </span>
  );
}
