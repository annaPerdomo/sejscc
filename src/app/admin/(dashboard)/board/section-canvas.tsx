"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EditBar, type EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { useUndo } from "@/components/admin/inline-edit/use-undo";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import {
  VolunteerSection,
  type SectionTextField,
  type VolunteerSectionLabels,
} from "@/components/volunteer-section";
import type { BoardMember, VolunteerRole, VolunteerSectionRow } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import type { ImageSize } from "@/lib/image-size";
import {
  SECTION_TEXT_FIELDS,
  englishSectionValue,
  japaneseSectionValue,
  withEnglishSectionValue,
  withJapaneseSectionValue,
} from "@/lib/volunteer-fields";
import { toVolunteerSectionView } from "@/lib/volunteers-view";
import { updateMemberPhoto, updateRoleSignupUrl, updateSectionText } from "./actions";
import { FirstVisitHint } from "./first-visit-hint";
import { ItemOptionsDialog } from "./item-options-dialog";
import { AddMemberRow, MemberControls, MemberPhotoField, renderMemberField } from "./member-row";
import { focusByKey, useOpenTarget } from "./open-target";
import { AddRoleRow, RoleControls, RoleSignupField, renderRoleField } from "./role-row";
import { useSectionPhotoDialog } from "./section-photo-dialog";
import { useBoardLists } from "./use-board-lists";

const FIELD_DISPLAY_LABELS: Record<SectionTextField, string> = {
  title: "Heading",
  intro: "Introduction",
  volunteersNote: "Note about volunteers",
  contactNote: "Contact sentence",
  contactLinkLabel: "Contact link words",
  waysTitle: "Ways to help heading",
  waysIntro: "Ways to help introduction",
};

const FIELD_MULTILINE: Record<SectionTextField, boolean> = {
  title: false,
  intro: true,
  volunteersNote: true,
  contactNote: true,
  contactLinkLabel: false,
  waysTitle: false,
  waysIntro: true,
};

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

export function SectionCanvas({
  section: initialSection,
  members: initialMembers,
  roles: initialRoles,
  photoSize,
  labels,
}: {
  section: VolunteerSectionRow;
  members: BoardMember[];
  roles: VolunteerRole[];
  photoSize: ImageSize | null;
  labels: { en: VolunteerSectionLabels; ja: VolunteerSectionLabels };
}) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [lang, setLang] = useState<Locale>("en");
  const [status, setStatus] = useState<EditBarStatus>({ kind: "idle" });

  const editState = useOpenTarget();
  const undo = useUndo();
  const lists = useBoardLists({ initialMembers, initialRoles, editState, undo, setStatus });
  const { renderPhotoEdit, dialog: photoDialog } = useSectionPhotoDialog({
    section,
    setSection,
    setStatus,
    undo,
  });

  useUnsavedChangesGuard(editState.isDirty);

  function handleLangChange(nextLang: Locale) {
    if (nextLang === lang) return;
    const blockedMessage = editState.blockLanguageSwitch();
    if (blockedMessage) {
      setStatus({ kind: "error", message: blockedMessage });
      return;
    }
    editState.closeForLanguageSwitch();
    setLang(nextLang);
  }

  function renderTextEdit(field: SectionTextField): ReactNode {
    const englishText = englishSectionValue(section, field);
    const value = lang === "en" ? englishText : japaneseSectionValue(section, field);
    const noun =
      lang === "en" ? SECTION_TEXT_FIELDS[field].label : `Japanese ${SECTION_TEXT_FIELDS[field].label}`;
    const description = `Changed ${FIELD_DISPLAY_LABELS[field]}.`;

    return (
      <EditableText
        key={`${field}-${lang}`}
        label={`${FIELD_DISPLAY_LABELS[field]} — ${lang === "en" ? "English" : "Japanese"}`}
        noun={noun}
        value={value}
        fallback={lang === "ja" ? englishText : undefined}
        multiline={FIELD_MULTILINE[field]}
        maxLength={SECTION_TEXT_FIELDS[field].max}
        required={lang === "en"}
        {...editState.fieldProps({ kind: "section", field })}
        onSave={async (next) => {
          const previousRaw = lang === "en" ? englishText : japaneseSectionValue(section, field);
          const previousSection = section;
          setSection(
            lang === "en"
              ? withEnglishSectionValue(section, field, next.trim())
              : withJapaneseSectionValue(section, field, next.trim() || null)
          );
          setStatus({ kind: "saving" });
          try {
            await updateSectionText(field, lang, next);
            setStatus({ kind: "saved", message: description });
            undo.record({
              description,
              undo: async () => {
                setSection(
                  lang === "en"
                    ? withEnglishSectionValue(previousSection, field, previousRaw)
                    : withJapaneseSectionValue(previousSection, field, previousRaw || null)
                );
                try {
                  await updateSectionText(field, lang, previousRaw);
                  router.refresh();
                } catch (e) {
                  setSection(
                    lang === "en"
                      ? withEnglishSectionValue(previousSection, field, next.trim())
                      : withJapaneseSectionValue(previousSection, field, next.trim() || null)
                  );
                  const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
                  setStatus({ kind: "error", message });
                  throw e;
                }
              },
            });
            router.refresh();
          } catch (e) {
            setSection(previousSection);
            const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
            setStatus({ kind: "error", message });
            throw e;
          }
        }}
      />
    );
  }

  async function onUndo() {
    const error = await undo.runUndo();
    setStatus(error ? { kind: "error", message: error } : { kind: "idle" });
    document.getElementById("admin-edit-bar")?.focus();
  }

  async function onMoveMember(id: string, direction: "up" | "down") {
    const result = await lists.moveMember(id, direction);
    if (!result) return;
    const { to, length } = result;
    const key =
      to === 0 && to === length - 1
        ? "member-dialog-visibility"
        : to === 0
          ? "member-dialog-move-down"
          : to === length - 1
            ? "member-dialog-move-up"
            : null;
    if (key) setTimeout(() => focusByKey(key), 0);
  }

  async function onMoveRole(id: string, direction: "up" | "down") {
    const result = await lists.moveRole(id, direction);
    if (!result) return;
    const { to, length } = result;
    const key =
      to === 0 && to === length - 1
        ? "role-dialog-visibility"
        : to === 0
          ? "role-dialog-move-down"
          : to === length - 1
            ? "role-dialog-move-up"
            : null;
    if (key) setTimeout(() => focusByKey(key), 0);
  }

  const view = toVolunteerSectionView(section, lists.members, lists.roles, lang, photoSize);

  const optionsMember = lists.members.find((m) => m.id === lists.memberOptionsId) ?? null;
  const optionsRole = lists.roles.find((r) => r.id === lists.roleOptionsId) ?? null;

  return (
    <div>
      <EditBar
        lang={lang}
        onLangChange={handleLangChange}
        status={status}
        undo={
          undo.entry
            ? { description: undo.entry.description, busy: undo.undoing, onUndo: () => void onUndo() }
            : undefined
        }
      />

      <div className="section-wash-history relative overflow-clip py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 pt-6 @volunteer-sm:px-6 @volunteer-lg:px-10">
          <FirstVisitHint />
        </div>
        <div className="preview-static">
          <VolunteerSection
            view={view}
            labels={lang === "en" ? labels.en : labels.ja}
            contactHref="#"
            edit={{
              text: renderTextEdit,
              photo: renderPhotoEdit,
              memberText: (viewMember, field, value) => {
                const member = lists.members.find((m) => m.id === viewMember.id);
                if (!member) return value;
                return renderMemberField({
                  member,
                  field,
                  lang,
                  editState,
                  onSaveText: (f, fieldLang, v) => lists.saveMemberText(member, f, fieldLang, v),
                });
              },
              memberControls: (viewMember) => (
                <MemberControls
                  member={viewMember}
                  onOpenOptions={() => lists.openMemberOptions(viewMember.id)}
                />
              ),
              roleText: (viewRole, field, value) => {
                const role = lists.roles.find((r) => r.id === viewRole.id);
                if (!role) return value;
                return renderRoleField({
                  role,
                  field,
                  lang,
                  editState,
                  onSaveText: (f, fieldLang, v) => lists.saveRoleText(role, f, fieldLang, v),
                });
              },
              roleControls: (viewRole) => (
                <RoleControls
                  role={viewRole}
                  onOpenOptions={() => lists.openRoleOptions(viewRole.id)}
                />
              ),
              afterMembers: (
                <AddMemberRow
                  {...editState.fieldProps({ kind: "add-member" })}
                  onAdd={lists.addMember}
                />
              ),
              afterRoles: (
                <AddRoleRow {...editState.fieldProps({ kind: "add-role" })} onAdd={lists.addRole} />
              ),
            }}
          />
        </div>
      </div>

      <ItemOptionsDialog
        kind="member"
        open={lists.memberOptionsId !== null}
        onClose={lists.closeMemberOptions}
        itemName={optionsMember?.name ?? ""}
        index={optionsMember ? lists.members.findIndex((m) => m.id === optionsMember.id) : 0}
        total={lists.members.length}
        moveBusy={!!optionsMember && lists.listBusy === optionsMember.id}
        onMove={(direction) => {
          if (optionsMember) void onMoveMember(optionsMember.id, direction);
        }}
        visible={optionsMember?.visible ?? true}
        visibleBusy={!!optionsMember && lists.listBusy === optionsMember.id}
        onToggleVisible={() => {
          if (optionsMember) void lists.toggleMemberVisible(optionsMember.id);
        }}
        onRemove={() => (optionsMember ? lists.removeMember(optionsMember.id) : Promise.resolve())}
      >
        {optionsMember && (
          <MemberPhotoField
            member={optionsMember}
            onSaved={async (photoUrl) => {
              const previousPhotoUrl = optionsMember.photoUrl;
              lists.setMembers((current) =>
                current.map((m) => (m.id === optionsMember.id ? { ...m, photoUrl } : m))
              );
              setStatus({ kind: "saving" });
              try {
                await updateMemberPhoto(optionsMember.id, photoUrl);
                undo.clear();
                setStatus({ kind: "saved" });
                router.refresh();
              } catch (e) {
                lists.setMembers((current) =>
                  current.map((m) =>
                    m.id === optionsMember.id ? { ...m, photoUrl: previousPhotoUrl } : m
                  )
                );
                const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
                setStatus({ kind: "error", message });
                throw e;
              }
            }}
          />
        )}
      </ItemOptionsDialog>

      <ItemOptionsDialog
        kind="role"
        open={lists.roleOptionsId !== null}
        onClose={lists.closeRoleOptions}
        itemName={optionsRole?.title ?? ""}
        index={optionsRole ? lists.roles.findIndex((r) => r.id === optionsRole.id) : 0}
        total={lists.roles.length}
        moveBusy={!!optionsRole && lists.listBusy === optionsRole.id}
        onMove={(direction) => {
          if (optionsRole) void onMoveRole(optionsRole.id, direction);
        }}
        visible={optionsRole?.visible ?? true}
        visibleBusy={!!optionsRole && lists.listBusy === optionsRole.id}
        onToggleVisible={() => {
          if (optionsRole) void lists.toggleRoleVisible(optionsRole.id);
        }}
        onRemove={() => (optionsRole ? lists.removeRole(optionsRole.id) : Promise.resolve())}
      >
        {optionsRole && (
          <RoleSignupField
            role={optionsRole}
            onSaved={async (signupUrl) => {
              setStatus({ kind: "saving" });
              try {
                await updateRoleSignupUrl(optionsRole.id, signupUrl);
                lists.setRoles((current) =>
                  current.map((r) =>
                    r.id === optionsRole.id ? { ...r, signupUrl: signupUrl.trim() || null } : r
                  )
                );
                undo.clear();
                setStatus({ kind: "saved" });
                router.refresh();
              } catch (e) {
                const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
                setStatus({ kind: "error", message });
                throw e;
              }
            }}
          />
        )}
      </ItemOptionsDialog>

      {photoDialog}
    </div>
  );
}
