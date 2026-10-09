"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EditBar, type EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditableLink } from "@/components/admin/inline-edit/editable-link";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { useUndo } from "@/components/admin/inline-edit/use-undo";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import {
  VolunteerSection,
  type SectionTextField,
  type VolunteerSectionLabels,
} from "@/components/volunteer-section";
import type { BoardMember, VolunteerSectionRow } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import type { ImageSize } from "@/lib/image-size";
import {
  SECTION_TEXT_FIELDS,
  contactLinkUrlForEditing,
  englishSectionValue,
  japaneseSectionValue,
  normalizeContactLinkUrl,
  withEnglishSectionValue,
  withJapaneseSectionValue,
} from "@/lib/volunteer-fields";
import { toVolunteerSectionView } from "@/lib/volunteers-view";
import { updateContactLink, updateMemberPhoto, updateSectionText } from "./actions";
import { MemberPanel } from "./item-options-dialog";
import { AddMemberRow, MemberButton, MemberFieldsForm, MemberPhotoField } from "./member-row";
import { focusByKey, useOpenTarget } from "./open-target";
import { useSectionPhotoDialog } from "./section-photo-dialog";
import { useBoardLists } from "./use-board-lists";

const FIELD_DISPLAY_LABELS: Record<SectionTextField, string> = {
  title: "Heading",
  intro: "Introduction",
  volunteersNote: "Note about volunteers",
  contactNote: "Contact sentence",
  contactLinkLabel: "Contact link",
};

const FIELD_MULTILINE: Record<SectionTextField, boolean> = {
  title: false,
  intro: true,
  volunteersNote: true,
  contactNote: true,
  contactLinkLabel: false,
};

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

export function SectionCanvas({
  section: initialSection,
  members: initialMembers,
  photoSize,
  labels,
}: {
  section: VolunteerSectionRow;
  members: BoardMember[];
  photoSize: ImageSize | null;
  labels: { en: VolunteerSectionLabels; ja: VolunteerSectionLabels };
}) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [lang, setLang] = useState<Locale>("en");
  const [status, setStatus] = useState<EditBarStatus>({ kind: "idle" });
  const [memberFieldsSaving, setMemberFieldsSaving] = useState(false);
  const memberFieldsDirtyRef = useRef(false);

  const editState = useOpenTarget();
  const undo = useUndo();
  const lists = useBoardLists({ initialMembers, editState, undo, setStatus });
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

  function renderContactLinkEdit(): ReactNode {
    const field = "contactLinkLabel";
    const englishText = englishSectionValue(section, field);
    const value = lang === "en" ? englishText : japaneseSectionValue(section, field);
    const noun =
      lang === "en" ? SECTION_TEXT_FIELDS[field].label : `Japanese ${SECTION_TEXT_FIELDS[field].label}`;
    const description = "Changed the contact link.";

    function withLink(row: VolunteerSectionRow, words: string, url: string | null) {
      const withWords =
        lang === "en"
          ? withEnglishSectionValue(row, field, words.trim())
          : withJapaneseSectionValue(row, field, words.trim() || null);
      return { ...withWords, contactLinkUrl: url };
    }

    return (
      <EditableLink
        key={`${field}-${lang}`}
        label={`Contact link — ${lang === "en" ? "English" : "Japanese"}`}
        noun={noun}
        value={value}
        fallback={lang === "ja" ? englishText : undefined}
        url={section.contactLinkUrl}
        maxLength={SECTION_TEXT_FIELDS[field].max}
        required={lang === "en"}
        {...editState.fieldProps({ kind: "section", field })}
        onSave={async (words, url) => {
          const previousSection = section;
          const previousUrlForEditing = contactLinkUrlForEditing(section.contactLinkUrl);
          const nextUrl = normalizeContactLinkUrl(url);
          setSection(withLink(section, words, nextUrl));
          setStatus({ kind: "saving" });
          try {
            await updateContactLink(lang, words, url);
            setStatus({ kind: "saved", message: description });
            undo.record({
              description,
              undo: async () => {
                setSection(previousSection);
                try {
                  await updateContactLink(lang, value, previousUrlForEditing);
                  router.refresh();
                } catch (e) {
                  setSection(withLink(previousSection, words, nextUrl));
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

  function openMemberPanel(id: string) {
    memberFieldsDirtyRef.current = false;
    setMemberFieldsSaving(false);
    lists.openMemberOptions(id);
  }

  function requestCloseMemberPanel() {
    if (memberFieldsSaving) return;
    if (memberFieldsDirtyRef.current && !confirm("Leave without saving your changes?")) return;
    lists.closeMemberOptions();
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

  const view = toVolunteerSectionView(section, lists.members, lang, photoSize);

  const optionsMember = lists.members.find((m) => m.id === lists.memberOptionsId) ?? null;

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

      <div className="section-wash-history relative overflow-clip pb-10 sm:pb-14">
        <div className="preview-static">
          <VolunteerSection
            view={view}
            labels={lang === "en" ? labels.en : labels.ja}
            contactHref="#"
            edit={{
              text: renderTextEdit,
              contactLink: renderContactLinkEdit,
              photo: renderPhotoEdit,
              member: (viewMember, content) => (
                <MemberButton
                  member={viewMember}
                  content={content}
                  onOpen={() => openMemberPanel(viewMember.id)}
                />
              ),
              afterMembers: (
                <AddMemberRow
                  {...editState.fieldProps({ kind: "add-member" })}
                  onAdd={lists.addMember}
                />
              ),
            }}
          />
        </div>
      </div>

      <MemberPanel
        open={lists.memberOptionsId !== null}
        onClose={requestCloseMemberPanel}
        busy={memberFieldsSaving}
        memberName={optionsMember?.name ?? ""}
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
        photo={
          optionsMember && (
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
          )
        }
      >
        {optionsMember && (
          <MemberFieldsForm
            key={`${optionsMember.id}-${lang}`}
            member={optionsMember}
            lang={lang}
            onSave={async (name, role) => {
              await lists.saveMemberFields(optionsMember, lang, { name, role });
              lists.closeMemberOptions();
            }}
            onDirtyChange={(dirty) => {
              memberFieldsDirtyRef.current = dirty;
            }}
            onSavingChange={setMemberFieldsSaving}
          />
        )}
      </MemberPanel>

      {photoDialog}
    </div>
  );
}
