"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import type { UndoState } from "@/components/admin/inline-edit/use-undo";
import type { MemberTextFieldName, RoleTextFieldName } from "@/components/volunteer-section";
import type { BoardMember, VolunteerRole } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import {
  MEMBER_TEXT_FIELDS,
  ROLE_TEXT_FIELDS,
  englishMemberValue,
  englishRoleValue,
  japaneseMemberValue,
  japaneseRoleValue,
  textFieldValue,
  withEnglishMemberValue,
  withEnglishRoleValue,
  withJapaneseMemberValue,
  withJapaneseRoleValue,
} from "@/lib/volunteer-fields";
import {
  addBoardMember,
  addVolunteerRole,
  deleteBoardMember,
  deleteVolunteerRole,
  reorderBoardMembers,
  reorderVolunteerRoles,
  setBoardMemberVisible,
  setVolunteerRoleVisible,
  updateMemberText,
  updateRoleText,
} from "./actions";
import { focusByKey, type OpenTargetState } from "./open-target";

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

export function useBoardLists({
  initialMembers,
  initialRoles,
  editState,
  undo,
  setStatus,
}: {
  initialMembers: BoardMember[];
  initialRoles: VolunteerRole[];
  editState: OpenTargetState;
  undo: UndoState;
  setStatus: (status: EditBarStatus) => void;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [roles, setRoles] = useState(initialRoles);
  const [listBusy, setListBusy] = useState<string | null>(null);
  const [memberOptionsId, setMemberOptionsId] = useState<string | null>(null);
  const [roleOptionsId, setRoleOptionsId] = useState<string | null>(null);

  function saveError(e: unknown): string {
    return e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
  }

  function openMemberOptions(id: string) {
    setRoleOptionsId(null);
    setMemberOptionsId(id);
  }

  function closeMemberOptions() {
    const id = memberOptionsId;
    setMemberOptionsId(null);
    if (id) setTimeout(() => focusByKey(`member-options-${id}`), 0);
  }

  function openRoleOptions(id: string) {
    setMemberOptionsId(null);
    setRoleOptionsId(id);
  }

  function closeRoleOptions() {
    const id = roleOptionsId;
    setRoleOptionsId(null);
    if (id) setTimeout(() => focusByKey(`role-options-${id}`), 0);
  }

  async function saveMemberText(
    member: BoardMember,
    field: MemberTextFieldName,
    fieldLang: Locale,
    raw: string
  ) {
    const spec = MEMBER_TEXT_FIELDS[field];
    const trimmed = raw.trim();
    const nextValue = textFieldValue(spec.required, fieldLang, trimmed);
    const apply = (row: BoardMember, value: string | null) =>
      fieldLang === "en"
        ? withEnglishMemberValue(row, field, value)
        : withJapaneseMemberValue(row, field, value);
    const description = `Changed ${fieldLang === "en" ? spec.label : `Japanese ${spec.label}`}.`;

    setMembers((current) => current.map((m) => (m.id === member.id ? apply(m, nextValue) : m)));
    setStatus({ kind: "saving" });
    try {
      await updateMemberText(member.id, field, fieldLang, raw);
      setStatus({ kind: "saved", message: description });
      const previousRaw =
        fieldLang === "en" ? englishMemberValue(member, field) : japaneseMemberValue(member, field);
      undo.record({
        description,
        undo: async () => {
          const revertValue = textFieldValue(spec.required, fieldLang, previousRaw);
          setMembers((current) =>
            current.map((m) => (m.id === member.id ? apply(m, revertValue) : m))
          );
          try {
            await updateMemberText(member.id, field, fieldLang, previousRaw);
            router.refresh();
          } catch (e) {
            setMembers((current) =>
              current.map((m) => (m.id === member.id ? apply(m, nextValue) : m))
            );
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
    } catch (e) {
      setMembers((current) => current.map((m) => (m.id === member.id ? member : m)));
      setStatus({ kind: "error", message: saveError(e) });
      throw e;
    }
  }

  async function saveRoleText(
    role: VolunteerRole,
    field: RoleTextFieldName,
    fieldLang: Locale,
    raw: string
  ) {
    const spec = ROLE_TEXT_FIELDS[field];
    const trimmed = raw.trim();
    const nextValue = textFieldValue(spec.required, fieldLang, trimmed);
    const apply = (row: VolunteerRole, value: string | null) =>
      fieldLang === "en"
        ? withEnglishRoleValue(row, field, value)
        : withJapaneseRoleValue(row, field, value);
    const description = `Changed ${fieldLang === "en" ? spec.label : `Japanese ${spec.label}`}.`;

    setRoles((current) => current.map((r) => (r.id === role.id ? apply(r, nextValue) : r)));
    setStatus({ kind: "saving" });
    try {
      await updateRoleText(role.id, field, fieldLang, raw);
      setStatus({ kind: "saved", message: description });
      const previousRaw =
        fieldLang === "en" ? englishRoleValue(role, field) : japaneseRoleValue(role, field);
      undo.record({
        description,
        undo: async () => {
          const revertValue = textFieldValue(spec.required, fieldLang, previousRaw);
          setRoles((current) => current.map((r) => (r.id === role.id ? apply(r, revertValue) : r)));
          try {
            await updateRoleText(role.id, field, fieldLang, previousRaw);
            router.refresh();
          } catch (e) {
            setRoles((current) => current.map((r) => (r.id === role.id ? apply(r, nextValue) : r)));
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
    } catch (e) {
      setRoles((current) => current.map((r) => (r.id === role.id ? role : r)));
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

  async function moveRole(
    id: string,
    direction: "up" | "down"
  ): Promise<{ to: number; length: number } | void> {
    if (listBusy) return;
    const index = roles.findIndex((r) => r.id === id);
    const to = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || to < 0 || to >= roles.length) return;
    const previousOrder = roles.map((r) => r.id);
    const next = [...roles];
    [next[index], next[to]] = [next[to], next[index]];
    const postChangeOrder = next.map((r) => r.id);

    setRoles(next);
    setListBusy(id);
    setStatus({ kind: "saving" });
    try {
      await reorderVolunteerRoles(postChangeOrder);
      const title = next[to].title;
      setStatus({ kind: "saved", message: `${title} is now number ${to + 1} of ${next.length}.` });
      undo.record({
        description: `Moved ${title}.`,
        undo: async () => {
          setRoles((current) => reorderById(current, previousOrder));
          try {
            await reorderVolunteerRoles(previousOrder);
            router.refresh();
          } catch (e) {
            setRoles((current) => reorderById(current, postChangeOrder));
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
      return { to, length: next.length };
    } catch (e) {
      setRoles((current) => reorderById(current, previousOrder));
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

  async function toggleRoleVisible(id: string) {
    if (listBusy) return;
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    const next = !role.visible;
    setRoles((current) => current.map((r) => (r.id === id ? { ...r, visible: next } : r)));
    setListBusy(id);
    setStatus({ kind: "saving" });
    try {
      await setVolunteerRoleVisible(id, next);
      setStatus({
        kind: "saved",
        message: `${role.title} is now ${next ? "showing on the website" : "hidden"}.`,
      });
      undo.record({
        description: `${next ? "Showed" : "Hid"} ${role.title}.`,
        undo: async () => {
          setRoles((current) => current.map((r) => (r.id === id ? { ...r, visible: !next } : r)));
          try {
            await setVolunteerRoleVisible(id, !next);
            router.refresh();
          } catch (e) {
            setRoles((current) => current.map((r) => (r.id === id ? { ...r, visible: next } : r)));
            setStatus({ kind: "error", message: saveError(e) });
            throw e;
          }
        },
      });
      router.refresh();
    } catch (e) {
      setRoles((current) => current.map((r) => (r.id === id ? { ...r, visible: !next } : r)));
      setStatus({ kind: "error", message: saveError(e) });
    } finally {
      setListBusy(null);
    }
  }

  async function removeMember(id: string) {
    const index = members.findIndex((m) => m.id === id);
    const neighbor = members[index + 1] ?? members[index - 1];
    await deleteBoardMember(id);
    setMembers((current) => current.filter((m) => m.id !== id));
    closeMemberOptions();
    undo.clear();
    setStatus({ kind: "saved", message: "Removed from the page." });
    setTimeout(() => focusByKey(neighbor ? `member-options-${neighbor.id}` : "add-member-button"), 0);
  }

  async function removeRole(id: string) {
    const index = roles.findIndex((r) => r.id === id);
    const neighbor = roles[index + 1] ?? roles[index - 1];
    await deleteVolunteerRole(id);
    setRoles((current) => current.filter((r) => r.id !== id));
    closeRoleOptions();
    undo.clear();
    setStatus({ kind: "saved", message: "Removed from the page." });
    setTimeout(() => focusByKey(neighbor ? `role-options-${neighbor.id}` : "add-role-button"), 0);
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
    setStatus({ kind: "saved", message: "Board member added." });
    router.refresh();
    setTimeout(() => focusByKey(`member-name-${id}`), 0);
  }

  async function addRole(title: string, description: string) {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const { id } = await addVolunteerRole(trimmedTitle, trimmedDescription);
    setRoles((current) => [
      ...current,
      {
        id,
        title: trimmedTitle,
        titleJa: null,
        description: trimmedDescription,
        descriptionJa: null,
        commitment: null,
        commitmentJa: null,
        signupUrl: null,
        sortOrder: current.length,
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    editState.close({ kind: "add-role" });
    undo.clear();
    setStatus({ kind: "saved", message: "Way to help added." });
    router.refresh();
    setTimeout(() => focusByKey(`role-options-${id}`), 0);
  }

  return {
    members,
    setMembers,
    roles,
    setRoles,
    listBusy,
    memberOptionsId,
    roleOptionsId,
    openMemberOptions,
    closeMemberOptions,
    openRoleOptions,
    closeRoleOptions,
    saveMemberText,
    saveRoleText,
    moveMember,
    moveRole,
    toggleMemberVisible,
    toggleRoleVisible,
    removeMember,
    removeRole,
    addMember,
    addRole,
  };
}

function reorderById<T extends { id: string }>(current: T[], order: string[]): T[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  return order.map((id) => byId.get(id)).filter((item): item is T => !!item);
}
