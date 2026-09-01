import Image from "next/image";

// Three, not an even count: flyer-less cards often land on every other index,
// which would leave an even-length list alternating between two glyphs.
const KANJI = ["祭", "縁", "和"];

export function EventMedia({
  flyerUrl,
  flyerAlt,
  description,
  index = 0,
  sizes,
  className = "",
}: {
  flyerUrl: string | null;
  flyerAlt: string;
  description: string | null;
  index?: number;
  sizes: string;
  className?: string;
}) {
  if (flyerUrl) {
    return (
      <div
        className={`relative aspect-card w-full overflow-clip bg-white ${className}`}
      >
        <Image
          src={flyerUrl}
          alt={flyerAlt}
          fill
          sizes={sizes}
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`seigaiha-rings relative flex aspect-card w-full items-center justify-center bg-cream px-5 py-6 ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-1 -bottom-2 font-accent text-8xl text-indigo/10 select-none"
      >
        {KANJI[index % KANJI.length]}
      </span>
      {description && (
        <p className="relative line-clamp-4 text-center text-sm leading-relaxed text-ink-soft sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
