import type { ReactNode } from "react";
import { AdminButton, AdminButtonLink } from "@/components/admin/admin-button";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import type { ManagedElsewhere, PageList } from "@/lib/editable-pages";

export type NotOnPageItem = {
  key: string;
  render: () => ReactNode;
};

export type OtherView = {
  id: string;
  label: string;
  onSelect: () => void;
};

export function AdditionalChangesDialog({
  open,
  onClose,
  dirty,
  list,
  notOnPage,
  managedElsewhere,
  otherViews,
}: {
  open: boolean;
  onClose: () => void;
  dirty: boolean;
  list?: PageList;
  notOnPage: NotOnPageItem[];
  managedElsewhere: { label: string; manage: ManagedElsewhere }[];
  otherViews: OtherView[];
}) {
  if (!open) return null;

  return (
    <EditDialog title="Additional changes" open dirty={dirty} onClose={onClose}>
      <div className="space-y-8">
        {otherViews.length > 0 && (
          <section>
            <h3 className="font-display text-lg text-ink">On another page</h3>
            <ul className="mt-4 space-y-4">
              {otherViews.map((view) => (
                <li key={view.id} className="rounded-lg bg-mist p-4">
                  <p className="text-base text-ink-soft">On the {view.label} page.</p>
                  <div className="mt-3">
                    <AdminButton onClick={view.onSelect}>Go to the {view.label} page</AdminButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {list && (
          <section>
            <h3 className="font-display text-lg text-ink">{list.recordsLabel}</h3>
            <p className="mt-1 text-base text-ink-soft">{list.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <AdminButtonLink href={list.addHref}>{list.addLabel}</AdminButtonLink>
              <AdminButtonLink href={list.listHref} variant="secondary">
                {list.listLabel}
              </AdminButtonLink>
            </div>
          </section>
        )}
        {notOnPage.length > 0 && (
          <section>
            <h3 className="font-display text-lg text-ink">Only shown at certain times</h3>
            <p className="mt-1 text-base text-ink-soft">
              These aren&rsquo;t on the page right now, so they can&rsquo;t be tapped there.
            </p>
            <div className="mt-4">
              {notOnPage.map((item) => (
                <div key={item.key}>{item.render()}</div>
              ))}
            </div>
          </section>
        )}
        {managedElsewhere.length > 0 && (
          <section>
            <h3 className="font-display text-lg text-ink">Changed on their own pages</h3>
            <ul className="mt-4 space-y-4">
              {managedElsewhere.map(({ label, manage }) => (
                <li key={label} className="rounded-lg bg-mist p-4">
                  <p className="font-display text-base text-ink">{label}</p>
                  <p className="mt-1 text-base text-ink-soft">{manage.description}</p>
                  <div className="mt-3">
                    <AdminButtonLink href={manage.href}>{manage.action}</AdminButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </EditDialog>
  );
}
