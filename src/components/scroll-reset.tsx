"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// The navigation entry still reads "reload" after later client-side
// navigations, so a remount on Back would otherwise reset again.
let reloadHandled = false;

function isReload(): boolean {
  const [entry] = performance.getEntriesByType("navigation");
  return entry instanceof PerformanceNavigationTiming && entry.type === "reload";
}

// Next measures the incoming route and on these long pages can conclude the top
// is already in view, leaving the reader partway down the new page.
export function ScrollReset({ resetOnReload = false }: { resetOnReload?: boolean }) {
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
    if (!resetOnReload || reloadHandled || !isReload() || window.location.hash) return;
    // The browser restores the old position before hydration and again as the
    // load event finishes, so restoration stays off until after load and then
    // comes back on for later back/forward.
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deferRestore = () => {
      timeout = setTimeout(() => {
        reloadHandled = true;
        history.scrollRestoration = "auto";
      });
    };
    if (document.readyState === "complete") {
      deferRestore();
    } else {
      window.addEventListener("load", deferRestore, { once: true });
    }
    return () => {
      window.removeEventListener("load", deferRestore);
      clearTimeout(timeout);
      history.scrollRestoration = "auto";
    };
  }, [resetOnReload]);

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
