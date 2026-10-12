export const REQUEST_KINDS = [
  {
    value: "bug",
    title: "Something isn’t working",
    description: "A button that does nothing, a page that won’t load, an error message.",
    subject: "Problem",
  },
  {
    value: "update",
    title: "Change something on the site",
    description: "Wording, a photo or a layout you can’t change yourself here.",
    subject: "Update",
  },
  {
    value: "feature",
    title: "An idea for something new",
    description: "A new page, a new section, or a new way to do something in here.",
    subject: "Idea",
  },
] as const;

export type RequestKind = (typeof REQUEST_KINDS)[number]["value"];

export const SUMMARY_MAX = 120;
export const DETAILS_MAX = 4000;
export const PAGE_MAX = 300;
