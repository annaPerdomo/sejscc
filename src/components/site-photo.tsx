import Image from "next/image";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

export type SitePhotoSource = { src: string; alt: string };

export function SitePhoto({
  photo,
  sizes,
  placeholderLabel,
  dark = false,
  shape = "rect",
  preload = false,
  className = "",
}: {
  photo?: SitePhotoSource;
  sizes: string;
  placeholderLabel: string;
  dark?: boolean;
  shape?: "rect" | "circle";
  preload?: boolean;
  className?: string;
}) {
  if (!photo) {
    return (
      <PhotoPlaceholder
        label={placeholderLabel}
        dark={dark}
        shape={shape}
        frame={false}
        className={`${shape === "circle" ? "rounded-full" : ""} ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative overflow-clip ${shape === "circle" ? "rounded-full" : ""} ${
        dark ? "bg-white/5" : "bg-mist"
      } ${className}`}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        preload={preload}
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>
  );
}
