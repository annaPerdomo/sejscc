const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
];

const VIDEO_ID = /^[\w-]{11}$/;

const PATH_PREFIXES = ["/embed/", "/shorts/", "/live/", "/v/"];

export function youtubeVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return VIDEO_ID.test(trimmed) ? trimmed : null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
    const id = url.pathname.slice(1);
    return VIDEO_ID.test(id) ? id : null;
  }

  if (!YOUTUBE_HOSTS.includes(url.hostname)) return null;

  const watchId = url.searchParams.get("v");
  if (watchId && VIDEO_ID.test(watchId)) return watchId;

  const prefix = PATH_PREFIXES.find((p) => url.pathname.startsWith(p));
  if (!prefix) return null;
  const id = url.pathname.slice(prefix.length).split("/")[0];
  return VIDEO_ID.test(id) ? id : null;
}

// youtube-nocookie defers YouTube's tracking cookies until someone presses play.
export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
