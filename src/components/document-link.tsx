import { ExternalLink } from "@/components/external-link";

// The sheet's folded corner is a clip-path, which would clip a box-shadow and
// the focus ring too, so both live on the unclipped wrapper.
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
    <article className="reveal-bloom surface-card-link relative drop-shadow-lg">
      <div className="paper-sheet flex h-full flex-col gap-3 p-6 pr-12 sm:p-7 sm:pr-14">
        <span className="w-fit rounded-xs bg-magenta px-2.5 py-1 font-display text-sm font-semibold tracking-[0.14em] text-white uppercase">
          {format}
        </span>
        <h3 className="font-display text-xl leading-snug font-semibold text-ink">
          <ExternalLink
            href={href}
            className="card-stretch link-arrow transition-colors hover:text-indigo"
          >
            {label}
          </ExternalLink>
        </h3>
        <p className="text-base leading-relaxed text-ink-soft">{description}</p>
      </div>
    </article>
  );
}
