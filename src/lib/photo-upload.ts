export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE_PX = 2560;
const JPEG_QUALITY = 0.85;

export const PHOTO_UNREADABLE_MESSAGE =
  "We couldn't open that photo. Please choose a JPG, PNG, or WebP photo, or try a different one.";

// Phone photos often exceed the upload limit, and Safari hands over HEIC on
// drag-and-drop, so re-encode them rather than reject them.
export async function asUploadablePhoto(file: File): Promise<File | null> {
  if (PHOTO_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size > MAX_UPLOAD_BYTES) return null;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}
