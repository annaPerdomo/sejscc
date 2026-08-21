import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { allowedEmails, users } from "@/db/schema";
import { AdminCard, AdminEmptyState } from "@/components/admin/admin-card";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { getCurrentUser } from "@/lib/admin";
import { ROLE_LABELS } from "@/lib/format";
import { AddVolunteerForm } from "./add-volunteer-form";
import { removeAllowedEmail } from "./actions";

export const dynamic = "force-dynamic";

export default async function VolunteersPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");
  const currentEmail = user.email?.trim().toLowerCase();

  const [allowed, accounts] = await Promise.all([
    db.select().from(allowedEmails).orderBy(asc(allowedEmails.addedAt)),
    db
      .select({ email: users.email, name: users.name, role: users.role })
      .from(users),
  ]);
  const accountsByEmail = new Map(
    accounts.map((account) => [account.email, account])
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Volunteers</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        People on this list can sign in to this dashboard with a link sent to
        their email. Removing someone ends their access right away, including
        anyone already signed in. Adding them back restores it.
      </p>

      <div className="max-w-2xl space-y-6">
        <AddVolunteerForm />

        {allowed.length === 0 ? (
          <AdminEmptyState title="Nobody can sign in yet">
            Add an email address above to give a board member or volunteer
            access to this dashboard.
          </AdminEmptyState>
        ) : (
          <ul className="space-y-3">
            {allowed.map((row) => {
              const account = accountsByEmail.get(row.email);
              const isSelf = row.email.trim().toLowerCase() === currentEmail;
              return (
                <li key={row.email}>
                  <AdminCard>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">
                          {row.email}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-stone">
                          {account
                            ? `${account.name ?? "No name set yet"} · ${ROLE_LABELS[account.role]}`
                            : "Hasn’t signed in yet"}
                        </p>
                      </div>
                      {isSelf ? (
                        <span className="text-sm font-medium text-stone">
                          That’s you
                        </span>
                      ) : (
                        <ConfirmDeleteButton
                          action={removeAllowedEmail.bind(null, row.email)}
                          label="Remove"
                          prompt={
                            account?.role === "admin"
                              ? "Remove this administrator’s access?"
                              : "Remove this person’s access?"
                          }
                          redirectTo="/admin/volunteers"
                        />
                      )}
                    </div>
                  </AdminCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
