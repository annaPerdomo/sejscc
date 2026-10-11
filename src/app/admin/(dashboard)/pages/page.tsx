import { AdminCardLink } from "@/components/admin/admin-card";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { EDITABLE_PAGES } from "@/lib/editable-pages";

export default function WebsitePagesIndex() {
  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Your website</h1>
      <p className="mt-1 max-w-2xl text-lg text-ink-soft">
        Which page would you like to change?
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {EDITABLE_PAGES.map((page) => (
          <li key={page.id}>
            <AdminCardLink href={`/admin/pages/${page.id}`}>
              <span className="block font-display text-xl text-ink">{page.label}</span>
              <span className="mt-1 block text-base text-ink-soft">
                {page.sections.map((section) => section.label).join(" · ")}
              </span>
            </AdminCardLink>
          </li>
        ))}
      </ul>
    </AdminPageWidth>
  );
}
