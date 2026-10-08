// Uploads go straight to Vercel Blob from the browser, so a URL on any other
// host reached us through a tampered request rather than the upload flow.
export function checkedBlobImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  let hostname = "";
  try {
    hostname = new URL(raw).hostname;
  } catch {
    hostname = "";
  }
  if (!hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new Error("That photo couldn’t be saved. Please upload it again.");
  }
  return raw;
}
