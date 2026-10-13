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
      className={`watermark-drift pointer-events-none absolute font-accent text-watermark font-bold select-none ${className}`}
    >
      {char}
    </span>
  );
}
