"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import type { UndoState } from "@/components/admin/inline-edit/use-undo";
import type { BoardMember } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import {
  MEMBER_TEXT_FIELDS,
  englishMemberValue,
  japaneseMemberValue,
  textFieldValue,
  withEnglishMemberValue,
  withJapaneseMemberValue,
} from "@/lib/volunteer-fields";
import {
  addBoardMember,
  deleteBoardMember,
  reorderBoardMembers,
  setBoardMemberVisible,
  updateMemberFields,
} from "./actions";
import { focusByKey, type OpenTargetState } from "./open-target";

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

export function useBoardLists({
  initialMembers,
  editState,
  undo,
  setStatus,
}: {
  initialMembers: BoardMember[];
  editState: OpenTargetState;
  undo: UndoState;
  setStatus: (status: EditBarStatus) => void;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [listBusy, setListBusy] = useState<string | null>(null);
  const [memberOptionsId, setMemberOptionsId] = useState<string | null>(null);

  function saveError(e: unknown): string {
    return e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
  }

  function openMemberOptions(id: string) {
    setMemberOptionsId(id);
  }

  function closeMemberOptions() {
    const id = memberOptionsId;
    setMemberOptionsId(null);
    if (id) setTimeout(() => focusByKey(`member-button-${id}`), 0);
  }

  async function saveMemberFields(
    member: BoardMember,
    fieldLang: Locale,
    values: { name: string; role: string }
  ) {
    const nextName = textFieldValue(MEMBER_TEXT_FIELDS.name.required, fieldLang, values.name.trim());
    const nextRole = textFieldValue(MEMBER_TEXT_FIELDS.role.required, fieldLang, values.role.trim());
    const previousName =
      fieldLang === "en" ? englishMemberValue(member, "name") : japaneseMemberValue(member, "name");
    const previousRole =
      fieldLang === "en" ? englishMemberValue(member, "role") : japaneseMemberValue(member, "role");

    if (nextName === previousName && nextRole === previousRole) return;

    const apply = (row: BoardMember, name: string | null, role: string | null) => {
      const withName =
        fieldLang === "en"
          ? withEnglishMemberValue(row, "name", name)
          : withJapaneseMemberValue(row, "name", name);
      return fieldLang === "en"
        ? withEnglishMemberValue(withName, "role", role)
        : withJapaneseMemberValue(withName, "role", role);
    };
    const description = `Changed ${member.name}.`;

    setMembers((current) =>
      current.map((m) => (m.id === member.id ? apply(m, nextName, nextRole) : m))
    );
    setStatus({ kind: "saving" });
    try {
      await updateMemberFields(member.id, fieldLang, { name: values.name, role: values.role });
      setStatus({ kind: "saved", message: description });
      undo.record({
        description,
        undo: async () => {
          setMembers((current) =>
            current.map((m) => (m.id === member.id ? apply(m, previousName, previousRole) : m))
          );
          try {
            await updateMemberFields(member.id, fieldLang, {
              name: previousName,
              role: previousRole,
            });
            router.refresh();
          } catch (e) {
            setMembers((current) =>
              current.map((m) => (m.id === member.id ? apply(m, nextName, nextRole) : m))
            );
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
    } catch (e) {
      setMembers((current) =>
        current.map((m) => (m.id === member.id ? apply(m, previousName, previousRole) : m))
      );
      setStatus({ kind: "error", message: saveError(e) });
      throw e;
    }
  }

  async function moveMember(
    id: string,
    direction: "up" | "down"
  ): Promise<{ to: number; length: number } | void> {
    if (listBusy) return;
    const index = members.findIndex((m) => m.id === id);
    const to = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || to < 0 || to >= members.length) return;
    const previousOrder = members.map((m) => m.id);
    const next = [...members];
    [next[index], next[to]] = [next[to], next[index]];
    const postChangeOrder = next.map((m) => m.id);

    setMembers(next);
    setListBusy(id);
    setStatus({ kind: "saving" });
    try {
      await reorderBoardMembers(postChangeOrder);
      const name = next[to].name;
      setStatus({ kind: "saved", message: `${name} is now number ${to + 1} of ${next.length}.` });
      undo.record({
        description: `Moved ${name}.`,
        undo: async () => {
          setMembers((current) => reorderById(current, previousOrder));
          try {
            await reorderBoardMembers(previousOrder);
            router.refresh();
          } catch (e) {
            setMembers((current) => reorderById(current, postChangeOrder));
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
      return { to, length: next.length };
    } catch (e) {
      setMembers((current) => reorderById(current, previousOrder));
      setStatus({ kind: "error", message: saveError(e) });
    } finally {
      setListBusy(null);
    }
  }

  async function toggleMemberVisible(id: string) {
    if (listBusy) return;
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const next = !member.visible;
    setMembers((current) => current.map((m) => (m.id === id ? { ...m, visible: next } : m)));
    setListBusy(id);
    setStatus({ kind: "saving" });
    try {
      await setBoardMemberVisible(id, next);
      setStatus({
        kind: "saved",
        message: `${member.name} is now ${next ? "showing on the website" : "hidden"}.`,
      });
      undo.record({
        description: `${next ? "Showed" : "Hid"} ${member.name}.`,
        undo: async () => {
          setMembers((current) => current.map((m) => (m.id === id ? { ...m, visible: !next } : m)));
          try {
            await setBoardMemberVisible(id, !next);
            router.refresh();
          } catch (e) {
            setMembers((current) => current.map((m) => (m.id === id ? { ...m, visible: next } : m)));
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
    } catch (e) {
      setMembers((current) => current.map((m) => (m.id === id ? { ...m, visible: !next } : m)));
      setStatus({ kind: "error", message: saveError(e) });
    } finally {
      setListBusy(null);
    }
  }

  async function removeMember(id: string) {
    const index = members.findIndex((m) => m.id === id);
    const removed = members[index];
    const neighbor = members[index + 1] ?? members[index - 1];
    await deleteBoardMember(id);
    setMembers((current) => current.filter((m) => m.id !== id));
    closeMemberOptions();
    undo.clear();
    setStatus({ kind: "saved", message: `Removed ${removed?.name ?? "the board member"} from the page.` });
    setTimeout(() => focusByKey(neighbor ? `member-button-${neighbor.id}` : "add-member-button"), 0);
  }

  async function addMember(name: string) {
    const trimmed = name.trim();
    const { id } = await addBoardMember(trimmed);
    setMembers((current) => [
      ...current,
      {
        id,
        name: trimmed,
        nameJa: null,
        role: null,
        roleJa: null,
        photoUrl: null,
        sortOrder: current.length,
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    editState.close({ kind: "add-member" });
    undo.clear();
    setStatus({ kind: "saved", message: `Added ${trimmed} to the page.` });
    router.refresh();
    setTimeout(() => focusByKey(`member-button-${id}`), 0);
  }

  return {
    members,
    setMembers,
    listBusy,
    memberOptionsId,
    openMemberOptions,
    closeMemberOptions,
    saveMemberFields,
    moveMember,
    toggleMemberVisible,
    removeMember,
    addMember,
  };
}

function reorderById<T extends { id: string }>(current: T[], order: string[]): T[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  return order.map((id) => byId.get(id)).filter((item): item is T => !!item);
}
