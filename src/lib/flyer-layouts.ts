export const FLYER_LAYOUTS = ["band", "badge", "mat", "card", "blossom"] as const;
export type FlyerLayout = (typeof FLYER_LAYOUTS)[number];

export function isFlyerLayout(value: unknown): value is FlyerLayout {
  return FLYER_LAYOUTS.some((layout) => layout === value);
}
