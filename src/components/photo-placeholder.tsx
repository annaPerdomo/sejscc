import Image from "next/image";

export function PhotoPlaceholder({
  label,
  dark = false,
  className = "",
}: {
  label: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border ${
        dark ? "border-white/10 bg-white/5" : "border-line bg-mist"
      } ${className}`}
    >
      <Image
        src={dark ? "/logo-mark-white.png" : "/logo-mark.png"}
        alt=""
        width={104}
        height={104}
        className="opacity-10"
      />
      <span
        className={`absolute bottom-4 text-xs font-medium tracking-[0.14em] uppercase ${
          dark ? "text-white/70" : "text-stone"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
