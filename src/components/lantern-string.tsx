type LanternStringProps = {
  /** Unique per page — namespaces the SVG glow filter. */
  id: string;
  tone: keyof typeof TONES;
  className?: string;
};

const HEIGHT = 112;
const POST_Y = 4;
const SAG = 80;
const SPANS = 3;

const TONES = {
  dark: {
    cord: "stroke-sand/50",
    colors: [
      { body: "fill-magenta", glow: "fill-magenta/40" },
      { body: "fill-sand", glow: "fill-sand/30" },
      { body: "fill-sky", glow: "fill-sky/35" },
    ],
  },
  light: {
    cord: "stroke-ink-soft/40",
    colors: [
      { body: "fill-magenta", glow: "fill-magenta/20" },
      { body: "fill-blossom", glow: "fill-blossom/30" },
      { body: "fill-sky", glow: "fill-sky/30" },
    ],
  },
};

type LanternColor = (typeof TONES)[keyof typeof TONES]["colors"][number];

// `wide` lanterns only hang from sm up, so a phone gets every other one.
const LANTERNS = [
  { x: 5, size: 1 },
  { x: 13, size: 0.8, wide: true },
  { x: 22, size: 1.1 },
  { x: 30, size: 0.85, wide: true },
  { x: 39, size: 1 },
  { x: 47, size: 0.8, wide: true },
  { x: 55, size: 1.1 },
  { x: 64, size: 0.85, wide: true },
  { x: 72, size: 1 },
  { x: 81, size: 0.8, wide: true },
  { x: 89, size: 1.1 },
  { x: 97, size: 0.85, wide: true },
];

/** `x` is a percentage of the width. */
function cordY(x: number) {
  const span = 100 / SPANS;
  const t = (x % span) / span;
  return POST_Y + SAG * t * (1 - t);
}

function cordPath() {
  const span = 1000 / SPANS;
  const control = POST_Y + SAG / 2;
  let d = `M0,${POST_Y}`;
  for (let i = 0; i < SPANS; i++) {
    d += ` Q${span * i + span / 2},${control} ${span * (i + 1)},${POST_Y}`;
  }
  return d;
}

function Lantern({
  size,
  cord,
  color,
  glowFilter,
}: {
  size: number;
  cord: string;
  color: LanternColor;
  glowFilter: string;
}) {
  const rx = 18 * size;
  const ry = 23 * size;
  const top = 10;
  const cy = top + ry;
  const bottom = top + ry * 2;

  return (
    <g className="lantern-sway">
      <line y2={top} className={cord} strokeWidth="1" />
      <circle cy={cy} r={rx * 2} className={color.glow} filter={glowFilter} />
      <ellipse cy={cy} rx={rx} ry={ry} className={color.body} />
      <ellipse
        cy={cy}
        rx={rx * 0.5}
        ry={ry}
        fill="none"
        className="stroke-ink-deep/25"
        strokeWidth="1"
      />
      <line
        y1={top}
        y2={bottom}
        className="stroke-ink-deep/25"
        strokeWidth="1"
      />
      <ellipse
        cx={-rx * 0.4}
        cy={cy - ry * 0.3}
        rx={rx * 0.22}
        ry={ry * 0.45}
        className="fill-white/30"
      />
      <rect
        x={-rx * 0.5}
        y={top - 3}
        width={rx}
        height="5"
        rx="1"
        className="fill-ink-deep stroke-gold/70"
        strokeWidth="0.75"
      />
      <rect
        x={-rx * 0.45}
        y={bottom - 2}
        width={rx * 0.9}
        height="5"
        rx="1"
        className="fill-ink-deep stroke-gold/70"
        strokeWidth="0.75"
      />
      <line
        y1={bottom + 3}
        y2={bottom + 12}
        className="stroke-gold"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function LanternString({
  id,
  tone,
  className = "",
}: LanternStringProps) {
  const glowId = `lantern-glow-${id}`;
  const { cord, colors } = TONES[tone];

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <svg width="100%" height={HEIGHT} className="block overflow-visible">
        <defs>
          <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        {/* Only the cord stretches with the width; the lanterns below are
            drawn in pixels so they stay round. */}
        <svg
          width="100%"
          height={POST_Y + SAG}
          viewBox={`0 0 1000 ${POST_Y + SAG}`}
          preserveAspectRatio="none"
          overflow="visible"
        >
          <path
            d={cordPath()}
            fill="none"
            className={cord}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {LANTERNS.map((lantern, i) => (
          <svg
            key={lantern.x}
            x={`${lantern.x}%`}
            y={cordY(lantern.x)}
            overflow="visible"
            className={lantern.wide ? "hidden sm:inline" : undefined}
          >
            <Lantern
              size={lantern.size}
              cord={cord}
              color={colors[i % colors.length]}
              glowFilter={`url(#${glowId})`}
            />
          </svg>
        ))}
      </svg>
    </div>
  );
}
