import type { EditablePageId } from "@/lib/editable-pages";

export type AdminPage = {
  id: EditablePageId;
  menuLabel: string;
  surface: string;
  hub: string;
  action: string;
  alsoActiveFor: string[];
  summary: string;
};

const ADMIN_PAGE_ORDER = ["events", "groups", "home", "donate", "school"] as const satisfies readonly EditablePageId[];

const ADMIN_PAGE_DETAILS: Record<EditablePageId, Omit<AdminPage, "id">> = {
  events: {
    menuLabel: "Events",
    surface: "bg-peach",
    hub: "/admin/events",
    action: "Add or change events",
    alsoActiveFor: ["/admin/pages/events"],
    summary: "The Events page: what's coming up, each event's flyer, and the words and photos around them.",
  },
  groups: {
    menuLabel: "Sports & Classes",
    surface: "bg-lilac",
    hub: "/admin/groups",
    action: "Add or change groups",
    alsoActiveFor: ["/admin/pages/groups"],
    summary: "The Sports & Classes page: every sport, club and class, with its photos and description.",
  },
  home: {
    menuLabel: "Home",
    surface: "bg-azure",
    hub: "/admin/pages/home",
    action: "Change this page",
    alsoActiveFor: ["/admin/board", "/admin/videos"],
    summary: "The welcome a visitor sees first, the board of directors, and our history.",
  },
  donate: {
    menuLabel: "Donations",
    surface: "bg-butter",
    hub: "/admin/pages/donate",
    action: "Change this page",
    alsoActiveFor: ["/admin/donations"],
    summary: "Why we ask for support, and how to give: the online form, Zelle and checks.",
  },
  school: {
    menuLabel: "Japanese School",
    surface: "bg-celadon",
    hub: "/admin/pages/school",
    action: "Change this page",
    alsoActiveFor: ["/admin/levels", "/admin/school-year"],
    summary: "The classes, the school year, tuition and the story of the school.",
  },
};

export const ADMIN_PAGES: AdminPage[] = ADMIN_PAGE_ORDER.map((id) => ({
  id,
  ...ADMIN_PAGE_DETAILS[id],
}));
