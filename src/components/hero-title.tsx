export function HeroTitle({
  line1,
  line2,
  compact = false,
}: {
  line1: string;
  line2?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <h1 className="mt-4 font-display text-4xl leading-tight font-light tracking-[0.01em] text-balance xl:text-5xl">
        <span className="text-white">{line1}</span>{" "}
        {line2 && <span className="font-normal text-sky">{line2}</span>}
      </h1>
    );
  }

  return (
    <h1 className="mt-5 font-display text-4xl leading-none font-light tracking-[0.01em] text-balance sm:text-6xl xl:text-7xl">
      <span className="block text-white">{line1}</span>
      {line2 && <span className="mt-2 block font-normal text-sky">{line2}</span>}
    </h1>
  );
}
