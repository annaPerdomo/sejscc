export const CENTER_ADDRESS = "14615 S. Gridley Rd., Norwalk, CA 90650";
export const CENTER_PHONE = "(562) 863-5996";
export const CENTER_PHONE_HREF = "tel:+15628635996";
export const CENTER_EMAIL = "info@sejscc.org";

export function isAtCenter(location: string | null): boolean {
  return location === CENTER_ADDRESS;
}

export function venueLabel(
  location: string | null,
  atCenterLabel: string
): string | null {
  if (!location) return null;
  return isAtCenter(location) ? atCenterLabel : location;
}

export function mapsUrl(location: string): string {
  const params = new URLSearchParams({ api: "1", query: location });
  return `https://www.google.com/maps/search/?${params}`;
}
