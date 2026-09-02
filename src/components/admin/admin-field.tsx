import type { ComponentProps, ReactNode } from "react";

type FieldSize = "sm" | "lg";

const LABEL_STYLES: Record<FieldSize, string> = {
  sm: "text-sm font-medium text-stone",
  lg: "font-semibold text-ink",
};

const CONTROL_STYLES: Record<FieldSize, string> = {
  sm: "mt-1 px-3 py-2.5",
  lg: "mt-4 px-4 py-3",
};

const controlBase =
  "w-full rounded-lg border border-line text-ink outline-none focus:border-indigo";

function FieldLabel({
  size,
  badge,
  children,
}: {
  size: FieldSize;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={`flex items-center gap-3 ${LABEL_STYLES[size]}`}>
      {badge}
      <span>{children}</span>
    </span>
  );
}

export function AdminTextField({
  label,
  badge,
  size = "sm",
  ...props
}: Omit<ComponentProps<"input">, "size"> & {
  label: ReactNode;
  badge?: ReactNode;
  size?: FieldSize;
}) {
  return (
    <label className="block">
      <FieldLabel size={size} badge={badge}>
        {label}
      </FieldLabel>
      <input {...props} className={`${controlBase} ${CONTROL_STYLES[size]}`} />
    </label>
  );
}

export function AdminTextArea({
  label,
  badge,
  size = "sm",
  ...props
}: ComponentProps<"textarea"> & {
  label: ReactNode;
  badge?: ReactNode;
  size?: FieldSize;
}) {
  return (
    <label className="block">
      <FieldLabel size={size} badge={badge}>
        {label}
      </FieldLabel>
      <textarea
        {...props}
        className={`${controlBase} ${CONTROL_STYLES[size]}`}
      />
    </label>
  );
}

export function AdminSelect({
  label,
  badge,
  size = "sm",
  ...props
}: Omit<ComponentProps<"select">, "size"> & {
  label: ReactNode;
  badge?: ReactNode;
  size?: FieldSize;
}) {
  return (
    <label className="block">
      <FieldLabel size={size} badge={badge}>
        {label}
      </FieldLabel>
      <select {...props} className={`${controlBase} ${CONTROL_STYLES[size]}`} />
    </label>
  );
}

export function AdminRequired() {
  return (
    <span className="text-sm font-semibold text-magenta-deep">Required</span>
  );
}

export function AdminOptional() {
  return <span className="text-sm font-normal text-stone">Optional</span>;
}

export function AdminCharacterCount({
  value,
  max,
}: {
  value: string;
  max: number;
}) {
  return (
    <p className="mt-1 text-right text-xs text-stone">
      {value.length} / {max} characters
    </p>
  );
}
