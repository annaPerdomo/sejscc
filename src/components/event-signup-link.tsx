import { ExternalLink } from "@/components/external-link";

// The z-10 lifts this above a card's stretched link, which would swallow the click.
export function EventSignupLink({
  href,
  label,
  title,
  ariaTemplate,
}: {
  href: string;
  label: string;
  title: string;
  ariaTemplate: string;
}) {
  return (
    <ExternalLink
      href={href}
      aria-label={ariaTemplate.replace("{title}", title)}
      className="button-primary relative z-10 w-fit rounded-lg px-4 py-2.5 font-display text-xs font-semibold tracking-[0.08em] text-white uppercase"
    >
      {label}
    </ExternalLink>
  );
}
