type BrushEdgeProps = {
  /** Unique per page — namespaces the SVG brush filter. */
  id: string;
  /**
   * "ink" ends a navy section with mist arriving below its painted edge;
   * "paper" ends a pale section with white arriving below its painted edge.
   */
  variant: "ink" | "paper";
  /** Position the edge (e.g. "absolute inset-x-0 bottom-0") — it never affects flow. */
  className?: string;
};

const EDGES = {
  ink: "M-30,20 C180,13 360,27 560,21 C740,15 860,9 1030,16 C1180,22 1330,27 1470,19",
  paper: "M-30,23 C200,29 380,14 590,18 C800,22 950,30 1130,23 C1280,17 1390,15 1470,18",
};

export function BrushEdge({ id, variant, className = "" }: BrushEdgeProps) {
  const filterId = `brush-edge-${id}`;
  const filterUrl = `url(#${filterId})`;
  const edge = EDGES[variant];

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="block h-7 w-full overflow-visible sm:h-10"
      >
        <defs>
          <filter id={filterId} x="-4%" y="-150%" width="108%" height="400%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.07"
              numOctaves="3"
              seed={variant === "ink" ? 5 : 23}
              result="n"
            />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
          </filter>
        </defs>
        <path
          d={`${edge} L1470,80 L-30,80 Z`}
          className={variant === "ink" ? "fill-mist" : "fill-white"}
          filter={filterUrl}
        />
        {variant === "ink" ? (
          <>
            <path
              d={edge}
              fill="none"
              className="stroke-ink-deep"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="460 22 320 16 540 28 400"
              opacity="0.9"
              filter={filterUrl}
            />
            <path
              d={edge}
              transform="translate(0 7)"
              fill="none"
              className="stroke-indigo/70"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="110 45 170 60 230 80 150 70"
              filter={filterUrl}
            />
            <path
              d={edge}
              transform="translate(0 12)"
              fill="none"
              className="stroke-gold/60"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="45 110 80 170 60 220"
              filter={filterUrl}
            />
          </>
        ) : (
          <>
            <path
              d={edge}
              fill="none"
              className="stroke-sand"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="380 24 300 18 460 30 350"
              opacity="0.85"
              filter={filterUrl}
            />
            <path
              d={edge}
              transform="translate(0 5)"
              fill="none"
              className="stroke-gold/70"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="60 90 110 140 80 180"
              filter={filterUrl}
            />
            <path
              d={edge}
              transform="translate(0 -5)"
              fill="none"
              className="stroke-blossom/40"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="70 120 130 180 90 200"
              filter={filterUrl}
            />
          </>
        )}
      </svg>
    </div>
  );
}
