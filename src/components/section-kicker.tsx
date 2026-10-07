const TONES = {
  indigo: { accent: "text-indigo", rule: "h-px bg-indigo", caption: "text-stone" },
  sky: { accent: "text-sky", rule: "h-px bg-sky", caption: "text-sky" },
  magenta: { accent: "text-indigo", rule: "h-0.5 bg-magenta", caption: "text-indigo" },
  // `stone` drops under 4.5:1 on the tinted surfaces, so the caption darkens.
  tinted: { accent: "text-indigo", rule: "h-px bg-indigo", caption: "text-ink-soft" },
  // Over a photo the caption goes white: `sky` only clears 4.5:1 on a
  // near-solid navy scrim.
  photo: { accent: "text-sky", rule: "h-px bg-sky", caption: "text-white" },
};

const SIZES = {
  base: { accent: "text-sm font-bold", caption: "text-xs font-semibold" },
  lg: { accent: "text-base font-medium", caption: "text-sm font-medium" },
};

export function SectionKicker({
  accent,
  caption,
  tone = "indigo",
  size = "base",
  order = "accent-first",
  entrance = "scroll",
  className = "",
}: {
  accent: string;
  caption: string;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  order?: "accent-first" | "caption-first";
  entrance?: "scroll" | "load";
  className?: string;
}) {
  const styles = TONES[tone];
  const sizes = SIZES[size];
  const ruleEntrance = entrance === "load" ? "enter-rule" : "reveal-rule";

  const accentText = (
    <span
      key="accent"
      className={`shrink-0 font-accent tracking-[0.2em] ${sizes.accent} ${styles.accent}`}
    >
      {accent}
    </span>
  );
  const rule = <span key="rule" className={`${ruleEntrance} w-9 shrink-0 ${styles.rule}`} />;
  const captionText = (
    <span
      key="caption"
      className={`font-display tracking-[0.2em] text-balance uppercase ${sizes.caption} ${styles.caption}`}
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
