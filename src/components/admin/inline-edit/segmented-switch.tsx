"use client";

import { useId } from "react";

export function SegmentedSwitch<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const labelId = useId();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <p id={labelId} className="font-display text-base font-semibold tracking-wide text-ink-soft">
        {label}
      </p>
      <div role="group" aria-labelledby={labelId} className="inline-flex rounded-full bg-mist p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={`min-h-11 rounded-full px-4 font-display text-base font-semibold ${
              value === option.id ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
