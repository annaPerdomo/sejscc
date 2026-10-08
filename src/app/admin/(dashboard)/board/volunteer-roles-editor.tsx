"use client";

import { useId, useState } from "react";
import { AdminBilingualField } from "@/components/admin/admin-bilingual-field";
import { AdminCard, AdminCardHeading } from "@/components/admin/admin-card";
import { AdminTextField } from "@/components/admin/admin-field";
import { AdminInlineForm } from "@/components/admin/admin-inline-form";
import { AdminOrderedList } from "@/components/admin/admin-ordered-list";
import type { VolunteerRole } from "@/db/schema";
import {
  createVolunteerRole,
  deleteVolunteerRole,
  reorderVolunteerRoles,
  setVolunteerRoleVisible,
  updateVolunteerRole,
  type VolunteerRoleInput,
} from "./actions";

function itemLabel(role: VolunteerRole) {
  return role.title;
}

function VolunteerRoleSummary({ role }: { role: VolunteerRole }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-ink">{role.title}</p>
      {role.commitment && (
        <p className="truncate text-sm text-stone">{role.commitment}</p>
      )}
    </div>
  );
}

function VolunteerRoleForm({
  role,
  onCancel,
  onSaved,
}: {
  role?: VolunteerRole;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = useId();
  const [title, setTitle] = useState(role?.title ?? "");
  const [titleJa, setTitleJa] = useState(role?.titleJa ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [descriptionJa, setDescriptionJa] = useState(role?.descriptionJa ?? "");
  const [commitment, setCommitment] = useState(role?.commitment ?? "");
  const [commitmentJa, setCommitmentJa] = useState(role?.commitmentJa ?? "");
  const [signupUrl, setSignupUrl] = useState(role?.signupUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  async function handleSave() {
    if (busy) return;
    let hasError = false;
    if (!title.trim()) {
      setTitleError("Please fill in the English title.");
      hasError = true;
    } else {
      setTitleError(null);
    }
    if (!description.trim()) {
      setDescriptionError("Please fill in the English description.");
      hasError = true;
    } else {
      setDescriptionError(null);
    }
    if (hasError) return;

    setError(null);
    setBusy(true);
    try {
      const input: VolunteerRoleInput = {
        title,
        titleJa,
        description,
        descriptionJa,
        commitment,
        commitmentJa,
        signupUrl,
      };
      if (role) {
        await updateVolunteerRole(role.id, input);
        onSaved(`${title} saved.`);
      } else {
        await createVolunteerRole(input);
        onSaved("Way to help added.");
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this role. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminInlineForm onCancel={onCancel} onSubmit={() => void handleSave()} busy={busy} error={error}>
      <AdminBilingualField
        label="What the job is"
        hint="A short title, such as Festival Setup Crew."
        maxLength={80}
        disabled={busy}
        en={{
          name: `${uid}-title`,
          value: title,
          onChange: setTitle,
          error: titleError ?? undefined,
        }}
        ja={{ name: `${uid}-title-ja`, value: titleJa, onChange: setTitleJa }}
      />
      <AdminBilingualField
        label="What it involves"
        hint="A sentence or two explaining what a volunteer would do."
        multiline
        maxLength={400}
        disabled={busy}
        en={{
          name: `${uid}-description`,
          value: description,
          onChange: setDescription,
          error: descriptionError ?? undefined,
        }}
        ja={{ name: `${uid}-description-ja`, value: descriptionJa, onChange: setDescriptionJa }}
      />
      <AdminBilingualField
        label="How much time"
        hint="Optional, such as About 2 hours a month."
        maxLength={60}
        disabled={busy}
        en={{ name: `${uid}-commitment`, value: commitment, onChange: setCommitment }}
        ja={{ name: `${uid}-commitment-ja`, value: commitmentJa, onChange: setCommitmentJa }}
      />
      <div>
        <AdminTextField
          id={`${uid}-signup-url`}
          label="Sign-up link"
          type="url"
          value={signupUrl}
          onChange={(event) => setSignupUrl(event.target.value)}
          placeholder="https://forms.gle/..."
          disabled={busy}
          size="lg"
          aria-describedby={`${uid}-signup-url-hint`}
        />
        <p id={`${uid}-signup-url-hint`} className="mt-1 text-sm text-stone">
          Paste a sign-up form link, such as a Google Form. Leave empty and
          visitors will be pointed to the center’s contact details instead.
        </p>
      </div>
    </AdminInlineForm>
  );
}

export function VolunteerRolesEditor({ roles }: { roles: VolunteerRole[] }) {
  const [status, setStatus] = useState("");

  return (
    <AdminCard>
      <AdminCardHeading step={4}>Ways to help</AdminCardHeading>
      <p className="mt-1 text-sm text-stone">
        Each one appears on the home page with a button visitors can use to
        offer help. Hidden ones are kept here for later. Changes here save
        straight away.
      </p>
      <p role="status" aria-live="polite" className="mt-2 text-sm font-medium text-indigo-deep empty:mt-0">
        {status}
      </p>

      <div className="mt-5">
        <AdminOrderedList
          items={roles}
          itemNoun="way to help"
          itemLabel={itemLabel}
          addLabel="Add a way to help"
          emptyTitle="No ways to help yet"
          emptyBody="Add the volunteer roles that should appear on the home page."
          renderSummary={(role) => <VolunteerRoleSummary role={role} />}
          renderForm={(role, close, onSaved) => (
            <VolunteerRoleForm role={role} onCancel={close} onSaved={onSaved} />
          )}
          onReorder={reorderVolunteerRoles}
          onToggleVisible={setVolunteerRoleVisible}
          onDelete={deleteVolunteerRole}
          onStatus={setStatus}
        />
      </div>
    </AdminCard>
  );
}
