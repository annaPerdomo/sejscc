"use client";

import { useEffect, useId, useState } from "react";
import { upload } from "@vercel/blob/client";
import { AdminBilingualField } from "@/components/admin/admin-bilingual-field";
import { AdminCard, AdminCardHeading } from "@/components/admin/admin-card";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import { AdminInlineForm } from "@/components/admin/admin-inline-form";
import { AdminOrderedList } from "@/components/admin/admin-ordered-list";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import type { BoardMember } from "@/db/schema";
import {
  createBoardMember,
  deleteBoardMember,
  reorderBoardMembers,
  setBoardMemberVisible,
  updateBoardMember,
  type BoardMemberInput,
} from "./actions";

type PhotoState =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "file"; file: File; previewUrl: string; uploadedUrl?: string };

function itemLabel(member: BoardMember) {
  return member.name;
}

function BoardMemberSummary({ member }: { member: BoardMember }) {
  return (
    <div className="flex items-center gap-3">
      {member.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photoUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full border border-line object-cover"
        />
      ) : (
        <PhotoPlaceholder label="" shape="circle" className="h-12 w-12 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{member.name}</p>
        {member.role && <p className="truncate text-sm text-stone">{member.role}</p>}
      </div>
    </div>
  );
}

function BoardMemberForm({
  member,
  onCancel,
  onSaved,
}: {
  member?: BoardMember;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = useId();
  const [name, setName] = useState(member?.name ?? "");
  const [nameJa, setNameJa] = useState(member?.nameJa ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [roleJa, setRoleJa] = useState(member?.roleJa ?? "");
  const [photoState, setPhotoState] = useState<PhotoState>({ kind: "unchanged" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const baselinePhotoUrl = member?.photoUrl ?? null;
  const photoValue =
    photoState.kind === "file"
      ? photoState.previewUrl
      : photoState.kind === "removed"
        ? null
        : baselinePhotoUrl;

  const previewUrl = photoState.kind === "file" ? photoState.previewUrl : null;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFileChosen(file: File | null) {
    if (!file) return;
    setPhotoState({ kind: "file", file, previewUrl: URL.createObjectURL(file) });
  }

  async function handleSave() {
    if (busy) return;
    if (!name.trim()) {
      setNameError("Please fill in the English name.");
      return;
    }
    setNameError(null);
    setError(null);
    setBusy(true);
    try {
      let photoUrl: string | null;
      if (photoState.kind === "file") {
        if (photoState.uploadedUrl) {
          photoUrl = photoState.uploadedUrl;
        } else {
          const result = await upload(
            `board/members/${photoState.file.name}`,
            photoState.file,
            { access: "public", handleUploadUrl: "/api/upload" }
          );
          photoUrl = result.url;
          setPhotoState({ ...photoState, uploadedUrl: photoUrl });
        }
      } else if (photoState.kind === "removed") {
        photoUrl = null;
      } else {
        photoUrl = baselinePhotoUrl;
      }

      const input: BoardMemberInput = { name, nameJa, role, roleJa, photoUrl };
      if (member) {
        await updateBoardMember(member.id, input);
        onSaved(`${name} saved.`);
      } else {
        await createBoardMember(input);
        onSaved("Board member added.");
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this board member. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminInlineForm onCancel={onCancel} onSubmit={() => void handleSave()} busy={busy} error={error}>
      <AdminBilingualField
        label="Name"
        maxLength={80}
        disabled={busy}
        en={{
          name: `${uid}-name`,
          value: name,
          onChange: setName,
          error: nameError ?? undefined,
        }}
        ja={{ name: `${uid}-name-ja`, value: nameJa, onChange: setNameJa }}
      />
      <AdminBilingualField
        label="Title"
        hint="Their role on the board, such as President or Treasurer. Optional."
        maxLength={60}
        disabled={busy}
        en={{ name: `${uid}-role`, value: role, onChange: setRole }}
        ja={{ name: `${uid}-role-ja`, value: roleJa, onChange: setRoleJa }}
      />
      <AdminImagePicker
        label="Photo"
        hint="Optional. A square headshot works best."
        value={photoValue}
        onFileChosen={onFileChosen}
        previewShape="circle"
        disabled={busy}
      />
    </AdminInlineForm>
  );
}

export function BoardMembersEditor({ members }: { members: BoardMember[] }) {
  const [status, setStatus] = useState("");

  return (
    <AdminCard>
      <AdminCardHeading step={3}>Board members</AdminCardHeading>
      <p className="mt-1 text-sm text-stone">
        Shown as a list of names next to the board photo. Photos and titles
        are optional. Changes here save straight away.
      </p>
      <p role="status" aria-live="polite" className="mt-2 text-sm font-medium text-indigo-deep empty:mt-0">
        {status}
      </p>

      <div className="mt-5">
        <AdminOrderedList
          items={members}
          itemNoun="board member"
          itemLabel={itemLabel}
          addLabel="Add a board member"
          emptyTitle="No board members yet"
          emptyBody="Add the people who should appear on the home page."
          renderSummary={(member) => <BoardMemberSummary member={member} />}
          renderForm={(member, close, onSaved) => (
            <BoardMemberForm member={member} onCancel={close} onSaved={onSaved} />
          )}
          onReorder={reorderBoardMembers}
          onToggleVisible={setBoardMemberVisible}
          onDelete={deleteBoardMember}
          onStatus={setStatus}
        />
      </div>
    </AdminCard>
  );
}
