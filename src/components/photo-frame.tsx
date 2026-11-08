import type { ReactNode } from "react";
import { framingStyle, type PhotoFraming } from "@/lib/photo-framing";

// The parent must be positioned and `overflow-clip`: the frame is an absolute
// box that grows past the parent's edges as the zoom rises.
export function PhotoFrame({
  framing,
  children,
}: {
  framing?: PhotoFraming;
  children: ReactNode;
}) {
  if (!framing) return children;
  return (
    <div className="photo-frame" style={framingStyle(framing)}>
      {children}
    </div>
  );
}
