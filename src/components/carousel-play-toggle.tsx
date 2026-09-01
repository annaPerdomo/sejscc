"use client";

export function CarouselPlayToggle({
  stopped,
  onToggle,
  pauseLabel,
  playLabel,
  className = "",
}: {
  stopped: boolean;
  onToggle: () => void;
  pauseLabel: string;
  playLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={stopped ? playLabel : pauseLabel}
      onClick={onToggle}
      className={`carousel-button ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        {stopped ? (
          <path d="M8 5l11 7-11 7z" />
        ) : (
          <path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" />
        )}
      </svg>
    </button>
  );
}
