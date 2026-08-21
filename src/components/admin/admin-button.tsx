import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const VARIANT_STYLES = {
  primary: "bg-indigo font-semibold text-white hover:bg-indigo-deep",
  secondary: "border border-line bg-white font-medium text-ink hover:bg-mist",
};

export type AdminButtonVariant = keyof typeof VARIANT_STYLES;

function buttonClass(variant: AdminButtonVariant) {
  return `inline-block rounded-lg px-5 py-3 disabled:opacity-50 ${VARIANT_STYLES[variant]}`;
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
