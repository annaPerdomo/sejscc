type WaveDividerProps = {
  /** Unique per page — namespaces the SVG brush filter. */
  id: string;
  /** "bottom" caps a section's end; "top" caps its start with the previous section's color. */
  position?: "top" | "bottom";
  /** Tint family for the translucent wave layers behind the solid cap. */
  accent?: "sky" | "magenta";
  /** Turbulence seed, so each divider's brush stroke frays differently. */
  seed?: number;
  /** Set the text color to the adjacent section's background. */
  className?: string;
};

export function WaveDivider({
  id,
  position = "bottom",
  accent = "sky",
  seed = 7,
  className = "",
}: WaveDividerProps) {
  const filterId = `wave-brush-${id}`;
  const brushFilter = (
    <filter id={filterId} x="-2%" y="-120%" width="104%" height="340%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.011 0.09"
        numOctaves="3"
        seed={seed}
        result="n"
      />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
    </filter>
  );
  const [tintA, tintB] =
    accent === "magenta"
      ? ["fill-magenta/15", "fill-sky/25"]
      : position === "bottom"
        ? ["fill-sky/30", "fill-mist/60"]
        : ["fill-sky/20", "fill-mist/40"];

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      {position === "bottom" ? (
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-12 w-full overflow-visible sm:h-20 lg:h-30"
        >
          <defs>{brushFilter}</defs>
          <path
            d="M0,66 C240,42 520,38 780,58 C1040,78 1250,86 1440,54 L1440,120 L0,120 Z"
            className={tintA}
          />
          <path
            d="M0,80 C250,52 530,48 780,68 C1030,88 1250,96 1440,68 L1440,120 L0,120 Z"
            className={tintB}
          />
          <path
            d="M0,96 C250,64 540,60 790,80 C1040,100 1260,108 1440,82 L1440,120 L0,120 Z"
            fill="currentColor"
          />
          <path
            d="M0,96 C250,64 540,60 790,80 C1040,100 1260,108 1440,82"
            fill="none"
            className="stroke-gold"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
            filter={`url(#${filterId})`}
          />
          <path
            d="M0,88 C250,56 540,52 790,72 C1040,92 1260,100 1440,74"
            fill="none"
            className="stroke-sand/70"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="52 30 96 44 120 60"
            filter={`url(#${filterId})`}
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 1440 110"
          preserveAspectRatio="none"
          className="block h-10 w-full overflow-visible sm:h-16 lg:h-28"
        >
          <defs>{brushFilter}</defs>
          <path
            d="M0,0 L1440,0 L1440,60 C1200,92 950,44 710,64 C470,84 220,40 0,74 Z"
            className={tintA}
          />
          <path
            d="M0,0 L1440,0 L1440,44 C1200,76 950,28 710,46 C470,64 220,24 0,56 Z"
            className={tintB}
          />
          <path
            d="M0,0 L1440,0 L1440,26 C1200,58 950,10 710,28 C470,46 220,6 0,38 Z"
            fill="currentColor"
          />
          <path
            d="M0,38 C220,6 470,46 710,28 C950,10 1200,58 1440,26"
            fill="none"
            className="stroke-gold"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
            filter={`url(#${filterId})`}
          />
          <path
            d="M0,52 C220,20 470,60 710,42 C950,24 1200,72 1440,40"
            fill="none"
            className="stroke-sand/70"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="64 34 100 48 130 70"
            filter={`url(#${filterId})`}
          />
        </svg>
      )}
    </div>
  );
}
