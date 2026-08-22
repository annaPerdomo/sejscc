import type { ReactNode } from "react";

export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-3xl font-normal tracking-[0.02em] text-ink sm:text-4xl ${className}`}
    >
      {children}
    </h2>
  );
}
