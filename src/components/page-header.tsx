import { SectionKicker } from "@/components/section-kicker";

export function PageHeader({
  accent,
  caption,
  title,
  lede,
}: {
  accent: string;
  caption: string;
  title: string;
  lede: string;
}) {
  return (
    <header>
      <SectionKicker accent={accent} caption={caption} />
      <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">
        {title}
      </h1>
      <div className="section-rule mt-5" />
      <p className="mt-5 max-w-2xl text-stone">{lede}</p>
    </header>
  );
}
