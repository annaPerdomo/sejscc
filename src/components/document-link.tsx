import { ExternalLink } from "@/components/external-link";

export function DocumentLink({
  href,
  format,
  label,
  description,
}: {
  href: string;
  format: string;
  label: string;
  description: string;
}) {
  return (
    <article className="reveal-bloom surface-card surface-card-link relative flex flex-col gap-2 p-5">
      <span className="w-fit rounded-md border border-line px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.14em] text-stone uppercase">
        {format}
      </span>
      <h3 className="font-display text-lg font-semibold text-ink">
        <ExternalLink href={href} className="card-stretch transition-colors hover:text-indigo">
          {label}
        </ExternalLink>
      </h3>
      <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
    </article>
  );
}
