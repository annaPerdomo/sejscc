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

export function CalendarPlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="6" width="24" height="22" rx="3" />
      <path d="M4 13h24M10 3v6M22 3v6M16 17v7M12.5 20.5h7" />
    </Icon>
  );
}

export function BallIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="16" cy="16" r="12" />
      <path d="M7.5 7.5c5 3 5 14 0 17M24.5 7.5c-5 3-5 14 0 17M4.5 14c7-2 16-2 23 0M4.5 18c7 2 16 2 23 0" />
    </Icon>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 13v6a2 2 0 0 0 2 2h4l10 6V5L11 11H7a2 2 0 0 0-2 2Z" />
      <path d="M11 21v6M25 12a5 5 0 0 1 0 8" />
    </Icon>
  );
}

export function PaperPlaneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M28 4 4 14l10 4 4 10L28 4Z" />
      <path d="m14 18 6-6" />
    </Icon>
  );
}
