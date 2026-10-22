import type { ReactNode } from "react";

export function AdminOptionTile({
  inputName,
  name,
  blurb,
  checked,
  onSelect,
  children,
}: {
  inputName: string;
  name: string;
  blurb?: string;
  checked: boolean;
  onSelect: () => void;
  children?: ReactNode;
}) {
  return (
    <label className="cursor-pointer overflow-clip rounded-lg border-4 border-transparent bg-mist hover:border-line has-checked:border-indigo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo">
      <input
        type="radio"
        name={inputName}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
      <span
        className={`block font-semibold text-ink ${
          children ? "px-2 py-1.5 text-sm" : "px-4 py-3 text-base"
        }`}
      >
        {checked && <span aria-hidden="true">✓ </span>}
        {name}
        {blurb && (
          <span className="block text-xs font-normal text-ink-soft">{blurb}</span>
        )}
      </span>
    </label>
  );
}
