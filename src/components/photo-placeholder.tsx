export function PhotoPlaceholder({
  label,
  dark = false,
  shape = "rect",
  frame = true,
  className = "",
}: {
  label: string;
  dark?: boolean;
  shape?: "rect" | "circle";
  frame?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-1.5 overflow-hidden ${
        frame ? `border ${shape === "circle" ? "rounded-full" : "rounded-2xl"}` : ""
      } ${dark ? "border-white/10 bg-white/5" : "border-line bg-mist"} ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className={`h-7 w-7 ${dark ? "text-white/60" : "text-stone"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="6.5" width="33" height="27" rx="3" />
        <circle cx="13.5" cy="15.5" r="3" />
        <path d="M4.5 27l8.5-8.5 6.5 6.5 5-5 10.5 10.5" />
      </svg>
      <span
        className={`text-center text-[11px] font-medium tracking-[0.12em] uppercase ${
          shape === "circle" ? "px-5" : ""
        } ${dark ? "text-white/70" : "text-stone"}`}
      >
        {label}
      </span>
    </div>
  );
}
