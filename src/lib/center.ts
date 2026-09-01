export const CENTER_ADDRESS = "14615 S. Gridley Rd., Norwalk, CA 90650";

export function venueLabel(
  location: string | null,
  atCenterLabel: string
): string | null {
  if (!location) return null;
  return location === CENTER_ADDRESS ? atCenterLabel : location;
}
