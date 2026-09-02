"use client";

import { useEffect, useState } from "react";

const ZEFFY_ORIGIN = "https://www.zeffy.com";

const MAX_REPORTED_HEIGHT = 4000;

function reportedHeight(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

// Zeffy's form grows past the amount step and posts its content height to the
// parent; without applying it the later steps scroll inside the iframe.
export function ZeffyEmbed({
  src,
  title,
  className = "",
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== ZEFFY_ORIGIN) return;
      if (typeof event.data !== "object" || event.data === null) return;
      const reported = reportedHeight(
        (event.data as { height?: unknown }).height,
      );
      if (reported === null) return;
      setHeight(Math.min(reported, MAX_REPORTED_HEIGHT));
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      title={title}
      src={src}
      allow="payment"
      className={className}
      style={height ? { height } : undefined}
    />
  );
}
