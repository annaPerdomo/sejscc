export function BrushRule({
  id,
  className = "",
}: {
  /** Unique per page — namespaces the SVG brush filter. */
  id: string;
  className?: string;
}) {
  const filterId = `title-brush-${id}`;
  const filterUrl = `url(#${filterId})`;

  return (
    <svg
      viewBox="0 0 320 14"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-3.5 w-56 overflow-visible sm:w-80 ${className}`}
    >
      <defs>
        <filter id={filterId} x="-4%" y="-300%" width="108%" height="700%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.3"
            numOctaves="3"
            seed="9"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
      </defs>
      <path
        d="M2,8 C70,4 180,10 318,6"
        fill="none"
        className="stroke-gold"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
        filter={filterUrl}
      />
      <path
        d="M6,11 C90,7 200,12 300,8"
        fill="none"
        className="stroke-gold/40"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="34 22 60 30"
        filter={filterUrl}
      />
    </svg>
  );
}
