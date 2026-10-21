import { useId } from "react";
import { CrestMark } from "@/components/crest-mark";

export type DividerOrnament = "crest" | "seigaiha" | "blossom" | "asanoha";

const CENTER = 24;

function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    x: round(CENTER + radius * Math.cos(radians)),
    y: round(CENTER + radius * Math.sin(radians)),
  };
}

const SEIGAIHA_FANS = [
  { cx: 10, cy: 33 },
  { cx: 38, cy: 33 },
  { cx: 24, cy: 41 },
];

const SEIGAIHA_RINGS = [13, 9, 5];

const BLOSSOM_PETALS = [0, 1, 2, 3, 4].map((i) => polar(7.5, i * 72 - 90));

const ASANOHA_LEAVES = [0, 1, 2, 3, 4, 5].map((i) => {
  const angle = i * 60 - 90;
  const tip = polar(15, angle);
  const left = polar(6, angle - 30);
  const right = polar(6, angle + 30);
  return `${CENTER},${CENTER} ${left.x},${left.y} ${tip.x},${tip.y} ${right.x},${right.y}`;
});

function Seigaiha() {
  const clipId = useId();
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle cx={CENTER} cy={CENTER} r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} strokeWidth="1.5" fill="none">
        {SEIGAIHA_FANS.map((fan) => (
          <g key={`${fan.cx}-${fan.cy}`}>
            <circle cx={fan.cx} cy={fan.cy} r={SEIGAIHA_RINGS[0] + 1} className="fill-navy" />
            {SEIGAIHA_RINGS.map((r, i) => (
              <circle
                key={r}
                cx={fan.cx}
                cy={fan.cy}
                r={r}
                className={i === 1 ? "stroke-sky" : "stroke-gold"}
              />
            ))}
          </g>
        ))}
      </g>
    </>
  );
}

function Blossom() {
  return (
    <g>
      {BLOSSOM_PETALS.map((petal) => (
        <circle
          key={`${petal.x}-${petal.y}`}
          cx={petal.x}
          cy={petal.y}
          r="6.5"
          strokeWidth="1"
          className="fill-blossom stroke-navy"
        />
      ))}
      <circle cx={CENTER} cy={CENTER} r="3.2" className="fill-gold" />
    </g>
  );
}

function Asanoha() {
  return (
    <g fill="none" strokeWidth="1.2" strokeLinejoin="round" className="stroke-gold">
      {ASANOHA_LEAVES.map((points) => (
        <polygon key={points} points={points} />
      ))}
      <circle cx={CENTER} cy={CENTER} r="1.6" className="fill-sky stroke-none" />
    </g>
  );
}

function Crest() {
  return (
    <g transform="translate(9.5 9.5) scale(0.506)" className="text-white">
      <CrestMark />
    </g>
  );
}

const ORNAMENTS = {
  crest: Crest,
  seigaiha: Seigaiha,
  blossom: Blossom,
  asanoha: Asanoha,
};

const LEADING_RIBBON = {
  start: "w-10 flex-none sm:w-20 lg:w-36",
  center: "flex-1",
  end: "flex-1",
};

const TRAILING_RIBBON = {
  start: "flex-1",
  center: "flex-1",
  end: "w-10 flex-none sm:w-20 lg:w-36",
};

/** Place as a sibling between two sections: it takes no height and straddles the join, so neither may clip it. */
export function SectionDivider({
  ornament,
  align = "center",
}: {
  ornament: DividerOrnament;
  align?: "start" | "center" | "end";
}) {
  const Ornament = ORNAMENTS[ornament];

  return (
    <div aria-hidden="true" className="pointer-events-none relative z-20 h-0">
      <div className="absolute inset-x-0 top-0 flex -translate-y-1/2 items-center">
        <span className={`h-2 border-y border-gold bg-navy ${LEADING_RIBBON[align]}`} />
        <svg viewBox="0 0 48 48" className="-mx-px h-11 w-11 shrink-0 sm:h-13 sm:w-13">
          <circle cx={CENTER} cy={CENTER} r="23" strokeWidth="1.5" className="fill-navy stroke-gold" />
          <Ornament />
          <circle cx={CENTER} cy={CENTER} r="20" fill="none" strokeWidth="1" className="stroke-gold" />
        </svg>
        <span className={`h-2 border-y border-gold bg-navy ${TRAILING_RIBBON[align]}`} />
      </div>
    </div>
  );
}
