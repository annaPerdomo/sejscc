export function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative z-10 -mt-8 sm:-mt-14 ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-8 w-full sm:h-14"
      >
        <path
          d="M0,32 C240,8 480,4 720,24 C960,44 1200,52 1440,20 L1440,80 L0,80 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
