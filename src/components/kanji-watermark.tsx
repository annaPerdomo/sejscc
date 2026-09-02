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
      className={`watermark-drift pointer-events-none absolute font-accent text-watermark font-medium select-none ${className}`}
    >
      {char}
    </span>
  );
}
