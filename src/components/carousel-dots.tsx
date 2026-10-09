"use client";

import type { Rotation } from "@/components/carousel-hooks";
import { RotationProgress } from "@/components/rotation-progress";

const TONES = {
  white: { track: "bg-white/35 group-hover:bg-white/60", fill: "bg-white" },
  sky: { track: "bg-sky/35 group-hover:bg-sky/60", fill: "bg-sky" },
} as const;

export function CarouselDots({
  count,
  active,
  rotation,
  intervalClassName,
  tone = "white",
  onShow,
  ariaLabel,
  itemAriaLabel,
  className = "",
}: {
  count: number;
  active: number;
  rotation: Rotation;
  intervalClassName: string;
  tone?: keyof typeof TONES;
  onShow: (index: number) => void;
  ariaLabel?: string;
  itemAriaLabel: (index: number) => string;
  className?: string;
}) {
  const palette = TONES[tone];

  return (
    <div role="group" aria-label={ariaLabel} className={`flex gap-1.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-current={i === active}
          aria-label={itemAriaLabel(i)}
          onClick={() => onShow(i)}
          className="group flex-1 rounded-xs py-3 focus-visible:outline-2 focus-visible:outline-sky"
        >
          <span className={`block h-1 overflow-clip rounded-xs transition-colors ${palette.track}`}>
            {i < active && <span className={`block h-full ${palette.fill}`} />}
            {i === active && (
              <RotationProgress
                rotation={rotation}
                intervalClassName={intervalClassName}
                className={`block h-full ${palette.fill}`}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
