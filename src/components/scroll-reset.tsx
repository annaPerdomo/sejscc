"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Next measures the incoming route and on these long pages can conclude the top
// is already in view, leaving the reader partway down the new page.
export function ScrollReset() {
  const pathname = usePathname();
  const restoringPath = useRef<string | null>(null);

  useEffect(() => {
    const markRestoring = () => {
      restoringPath.current = window.location.pathname;
    };
    window.addEventListener("popstate", markRestoring);
    return () => window.removeEventListener("popstate", markRestoring);
  }, []);

  useEffect(() => {
    // Matched by path, not cleared on the next run: a hash-only back never
    // reaches this effect and would leave the flag to eat a real navigation.
    const restoring = restoringPath.current === window.location.pathname;
    restoringPath.current = null;
    if (restoring) return;
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
