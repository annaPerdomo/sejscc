import { useEffect, useRef, useState } from "react";
import { composeFlyer, NO_FLYER_STYLE, type FlyerLettering, type FlyerStyle } from "@/lib/flyer-compose";

export type LetteringJob = { key: string; artUrl: string; style?: FlyerStyle };

export function useLetteredPreviews(
  jobs: LetteringJob[],
  lettering: FlyerLettering
): Record<string, string> {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const urlsRef = useRef<Record<string, string>>({});

  const signature = JSON.stringify({ jobs, lettering });

  useEffect(() => {
    let current = true;
    const timer = setTimeout(async () => {
      const input: { jobs: LetteringJob[]; lettering: FlyerLettering } = JSON.parse(signature);
      for (const job of input.jobs) {
        if (!current) return;
        try {
          const blob = await composeFlyer(job.artUrl, input.lettering, job.style ?? NO_FLYER_STYLE);
          if (!current) return;
          const url = URL.createObjectURL(blob);
          const old = urlsRef.current[job.key];
          urlsRef.current[job.key] = url;
          setPreviews((prev) => ({ ...prev, [job.key]: url }));
          if (old) URL.revokeObjectURL(old);
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
      for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url);
    },
    []
  );

  return previews;
}
