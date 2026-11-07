import { AdminError } from "@/lib/action-result";
import { ADULT_REGISTRATION_URL, YOUTH_REGISTRATION_URL } from "@/lib/school";
import { tooLongMessage } from "@/lib/volunteer-fields";

export type SiteLinkPageId = "school";

export type SiteLink = {
  id: SiteLinkId;
  page: SiteLinkPageId;
  section: string;
  label: string;
  help: string;
  column: "youthRegistrationUrl" | "adultRegistrationUrl";
  defaultUrl: string;
};

export const SITE_LINK_IDS = ["school.youth-registration", "school.adult-registration"] as const;

export type SiteLinkId = (typeof SITE_LINK_IDS)[number];

export const SITE_LINKS: SiteLink[] = [
  {
    id: "school.youth-registration",
    page: "school",
    section: "school-top",
    label: "Registration form for students (kindergarten to high school)",
    help:
      "Where the Online registration buttons at the top and bottom of the page, and the first plan under Tuition & dues, send visitors.",
    column: "youthRegistrationUrl",
    defaultUrl: YOUTH_REGISTRATION_URL,
  },
  {
    id: "school.adult-registration",
    page: "school",
    section: "school-top",
    label: "Registration form for adult classes",
    help: "Where the Adult Classes plan under Tuition & dues sends visitors.",
    column: "adultRegistrationUrl",
    defaultUrl: ADULT_REGISTRATION_URL,
  },
];

const LINKS_BY_ID = new Map<string, SiteLink>(SITE_LINKS.map((link) => [link.id, link]));

export function siteLink(id: string): SiteLink | undefined {
  return LINKS_BY_ID.get(id);
}

export const SITE_LINK_URL_MAX = 500;

export const SITE_LINK_URL_MESSAGE =
  "Please paste the form's full web address, starting with https://.";

export function normalizeSiteLinkUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > SITE_LINK_URL_MAX) {
    throw new AdminError(tooLongMessage("link address", SITE_LINK_URL_MAX));
  }
  const withScheme = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new AdminError(SITE_LINK_URL_MESSAGE);
  }
  if (url.protocol !== "https:") throw new AdminError(SITE_LINK_URL_MESSAGE);
  return url.href;
}
