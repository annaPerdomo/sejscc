import Link from "next/link";
import type { ComponentProps } from "react";

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

type ExternalLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function ExternalLink({ href, ...props }: ExternalLinkProps) {
  if (!isExternalHref(href)) {
    return <Link href={href} {...props} />;
  }
  return <Link href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}
