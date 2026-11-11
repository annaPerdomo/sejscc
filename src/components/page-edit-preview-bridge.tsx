"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PREVIEW_REFRESH_EVENT, PREVIEW_SHOWN_EVENT, PREVIEW_SHOW_EVENT } from "@/lib/page-edit-preview";

const SAME_SITE_PATH = /^\/(?![/\\])/;

// Must render after ScrollReset: its jump to the top on a new path has to run
// before the editor is told the page is showing and puts the reader back.
export function PageEditPreviewBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (window.parent === window) return;

    function refresh(event: Event) {
      event.preventDefault();
      router.refresh();
    }

    function show(event: Event) {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "string") return;
      if (!SAME_SITE_PATH.test(event.detail)) return;
      event.preventDefault();
      router.replace(event.detail, { scroll: false });
    }

    document.addEventListener(PREVIEW_REFRESH_EVENT, refresh);
    document.addEventListener(PREVIEW_SHOW_EVENT, show);
    return () => {
      document.removeEventListener(PREVIEW_REFRESH_EVENT, refresh);
      document.removeEventListener(PREVIEW_SHOW_EVENT, show);
    };
  }, [router]);

  useEffect(() => {
    if (window.parent === window) return;
    document.dispatchEvent(new CustomEvent(PREVIEW_SHOWN_EVENT));
  }, [pathname]);

  return null;
}
