const TONES = {
  indigo: { accent: "text-indigo", rule: "h-px bg-indigo", caption: "text-stone" },
  sky: { accent: "text-sky", rule: "h-px bg-sky", caption: "text-sky" },
  magenta: { accent: "text-indigo", rule: "h-0.5 bg-magenta", caption: "text-indigo" },
};

export function SectionKicker({
  accent,
  caption,
  tone = "indigo",
  order = "accent-first",
  className = "",
}: {
  accent: string;
  caption: string;
  tone?: keyof typeof TONES;
  order?: "accent-first" | "caption-first";
  className?: string;
}) {
  const styles = TONES[tone];

  const accentText = (
    <span
      key="accent"
      className={`shrink-0 font-accent text-sm font-bold tracking-[0.2em] ${styles.accent}`}
    >
      {accent}
    </span>
  );
  const rule = <span key="rule" className={`w-9 shrink-0 ${styles.rule}`} />;
  const captionText = (
    <span
      key="caption"
      className={`font-display text-xs font-semibold tracking-[0.2em] uppercase ${styles.caption}`}
    >
      {caption}
    </span>
  );

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {order === "accent-first"
        ? [accentText, rule, captionText]
        : [captionText, rule, accentText]}
    </div>
  );
}
