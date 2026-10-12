import type { ComponentProps } from "react";

type IconProps = Omit<ComponentProps<"svg">, "children">;

function Icon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function CampusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 13 16 5l13 8M6 12v14M26 12v14M3 27h26M11 27v-7h10v7M16 10.5v2" />
    </Icon>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 5.5a7 7 0 0 0-7.6 9.4L4.6 22.2a2.8 2.8 0 0 0 4 4l7.3-7.3a7 7 0 0 0 9.4-7.6l-4.1 4.1-3.7-.9-.9-3.7z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="16" cy="16" r="5.5" />
      <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" />
    </Icon>
  );
}

export function RisingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 27h24M5 21l7-7 5 5 10-10M20 9h7v7" />
    </Icon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 27S4 19.5 4 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12 3.5C28 19.5 16 27 16 27z" />
    </Icon>
  );
}

// In the order of `payments.donateReasons`.
export const DONATE_REASON_ICONS = [CampusIcon, WrenchIcon, SunIcon, RisingIcon];
