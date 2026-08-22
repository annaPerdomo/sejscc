import Link from "next/link";

export function VolunteerSignInLink({
  label,
  className,
  labelClassName,
}: {
  label: string;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <Link
      href="/admin"
      className={`inline-flex items-center gap-1.5 rounded-md p-2 font-display text-sm font-semibold text-indigo hover:text-indigo-deep ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 19.5a7 7 0 0 1 14 0" />
      </svg>
      <span className={labelClassName}>{label}</span>
    </Link>
  );
}
