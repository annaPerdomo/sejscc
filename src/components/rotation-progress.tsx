"use client";

import type { Rotation } from "@/components/carousel-hooks";

export function RotationProgress({
  rotation,
  intervalClassName,
  className = "",
}: {
  rotation: Rotation;
  /** Class setting `--tab-progress` to this carousel's rotation interval. */
  intervalClassName: string;
  className?: string;
}) {
  const { cycle, rotating, paused, advance } = rotation;

  return (
    <span
      key={cycle}
      aria-hidden="true"
      onAnimationEnd={advance}
      className={`${className} ${rotating ? `tab-progress ${intervalClassName}` : ""} ${
        rotating && paused ? "tab-progress-paused" : ""
      }`}
    />
  );
}
