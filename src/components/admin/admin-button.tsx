import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const VARIANT_STYLES = {
  primary: "bg-indigo font-semibold text-white hover:bg-indigo-deep",
  secondary: "border border-line bg-white font-medium text-ink hover:bg-mist",
  "on-dark": "border border-white/30 font-medium text-white hover:bg-white/10",
};

export type AdminButtonVariant = keyof typeof VARIANT_STYLES;

// The color/weight classes alone, for a caller (a label standing in for a
// button) that needs its own display and padding instead of buttonClass's.
export function buttonVariantClass(variant: AdminButtonVariant) {
  return VARIANT_STYLES[variant];
}

export function buttonClass(variant: AdminButtonVariant) {
  return `inline-block rounded-lg px-5 py-3 disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${VARIANT_STYLES[variant]}`;
}

export function AdminButton({
  variant = "secondary",
  ...props
}: ComponentProps<"button"> & { variant?: AdminButtonVariant }) {
  return <button type="button" {...props} className={buttonClass(variant)} />;
}

export function AdminButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: AdminButtonVariant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant)}>
      {children}
    </Link>
  );
}

export function AdminFormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
      {children}
    </div>
  );
}
