import type { ReactNode } from "react";
import { AdminBadge } from "@/components/admin/admin-badge";
import {
  AdminCharacterCount,
  AdminOptional,
  AdminRequired,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-field";

type FieldProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function BilingualControl({
  multiline,
  label,
  field,
  maxLength,
  disabled,
}: {
  multiline?: boolean;
  label: ReactNode;
  field: FieldProps;
  maxLength?: number;
  disabled?: boolean;
}) {
  const errorId = field.error ? `${field.name}-error` : undefined;
  if (multiline) {
    return (
      <AdminTextArea
        id={field.name}
        label={label}
        value={field.value}
        onChange={(event) => field.onChange(event.target.value)}
        maxLength={maxLength}
        rows={4}
        disabled={disabled}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={errorId}
      />
    );
  }
  return (
    <AdminTextField
      id={field.name}
      label={label}
      value={field.value}
      onChange={(event) => field.onChange(event.target.value)}
      maxLength={maxLength}
      disabled={disabled}
      aria-invalid={field.error ? true : undefined}
      aria-describedby={errorId}
    />
  );
}

export function AdminBilingualField({
  label,
  hint,
  multiline,
  maxLength,
  en,
  ja,
  disabled,
}: {
  label: string;
  hint?: string;
  multiline?: boolean;
  maxLength?: number;
  en: FieldProps;
  ja: FieldProps;
  disabled?: boolean;
}) {
  return (
    <fieldset>
      <legend className="font-semibold text-ink">{label}</legend>
      {hint && <p className="mt-1 text-sm text-stone">{hint}</p>}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <BilingualControl
            multiline={multiline}
            maxLength={maxLength}
            field={en}
            disabled={disabled}
            label={
              <>
                English <AdminRequired />
              </>
            }
          />
          {maxLength && <AdminCharacterCount value={en.value} max={maxLength} />}
          {en.error && (
            <p
              id={`${en.name}-error`}
              role="alert"
              className="mt-1 text-sm font-medium text-magenta-deep"
            >
              {en.error}
            </p>
          )}
        </div>
        <div>
          <BilingualControl
            multiline={multiline}
            maxLength={maxLength}
            field={ja}
            disabled={disabled}
            label={
              <>
                日本語 (Japanese) <AdminOptional />
              </>
            }
          />
          {maxLength && <AdminCharacterCount value={ja.value} max={maxLength} />}
          {!ja.value.trim() && (
            <div className="mt-2">
              <AdminBadge tone="muted">Japanese visitors will see the English</AdminBadge>
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}
