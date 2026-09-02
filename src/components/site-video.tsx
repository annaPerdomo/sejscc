import { youtubeEmbedUrl } from "@/lib/video";

export function SiteVideo({
  videoId,
  title,
  caption,
  dark = false,
  className = "mx-auto mt-12 max-w-3xl",
}: {
  videoId: string;
  title: string;
  caption?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <figure className={`reveal-rise ${className}`}>
      <div
        className={
          dark
            ? "overflow-clip rounded-xl border border-white/15 shadow-xl shadow-ink-deep/40"
            : "surface-card overflow-clip"
        }
      >
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full border-0 bg-ink-deep"
        />
      </div>
      {caption && (
        <figcaption
          className={`mt-3 text-center text-sm ${dark ? "text-white/70" : "text-ink-soft"}`}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
