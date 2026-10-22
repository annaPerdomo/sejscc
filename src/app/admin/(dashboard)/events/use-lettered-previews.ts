import { useEffect, useRef, useState } from "react";
import { composeFlyer, NO_FLYER_STYLE, type FlyerLettering, type FlyerStyle } from "@/lib/flyer-compose";

export type LetteringJob = { key: string; artUrl: string; style?: FlyerStyle };

export function useLetteredPreviews(
  jobs: LetteringJob[],
  lettering: FlyerLettering
): Record<string, string> {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const composedRef = useRef<Record<string, { url: string; signature: string }>>({});

  const signature = JSON.stringify({ jobs, lettering });

  useEffect(() => {
    let current = true;
    const timer = setTimeout(async () => {
      const input: { jobs: LetteringJob[]; lettering: FlyerLettering } = JSON.parse(signature);
      for (const job of input.jobs) {
        if (!current) return;
        const jobSignature = JSON.stringify({ job, lettering: input.lettering });
        if (composedRef.current[job.key]?.signature === jobSignature) continue;
        try {
          const blob = await composeFlyer(job.artUrl, input.lettering, job.style ?? NO_FLYER_STYLE);
          if (!current) return;
          const url = URL.createObjectURL(blob);
          const old = composedRef.current[job.key];
          composedRef.current[job.key] = { url, signature: jobSignature };
          setPreviews((prev) => ({ ...prev, [job.key]: url }));
          if (old) URL.revokeObjectURL(old.url);
        } catch {}
      }
    }, 800);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [signature]);

  useEffect(
    () => () => {
      for (const { url } of Object.values(composedRef.current)) URL.revokeObjectURL(url);
    },
    []
  );

  return previews;
}
