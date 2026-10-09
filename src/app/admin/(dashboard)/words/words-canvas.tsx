"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { EditBar, type EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { useOpenTarget } from "@/components/admin/inline-edit/use-open-target";
import { useUndo } from "@/components/admin/inline-edit/use-undo";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { readPath } from "@/lib/object-path";
import { SITE_TEXT_PAGES, type SiteTextField } from "@/lib/site-text-fields";
import { resetSiteText, updateSiteText } from "./actions";

type OverrideValue = { en: string | null; ja: string | null };
type OverridesRecord = Record<string, OverrideValue>;

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

const NO_OVERRIDE: OverrideValue = { en: null, ja: null };

const KIND_TEXT_CLASS: Record<SiteTextField["kind"], string> = {
  heading: "font-display text-2xl text-ink",
  body: "text-lg leading-relaxed text-ink-soft",
  short: "text-base text-ink",
};

function stringAt(dict: Dictionary, path: string): string {
  const value = readPath(dict, path);
  return typeof value === "string" ? value : "";
}

export function WordsCanvas({
  overrides: initialOverrides,
  en,
  ja,
}: {
  overrides: OverridesRecord;
  en: Dictionary;
  ja: Dictionary;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(initialOverrides);
  const [lang, setLang] = useState<Locale>("en");
  const [status, setStatus] = useState<EditBarStatus>({ kind: "idle" });

  const editState = useOpenTarget();
  const undo = useUndo();

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

  function overrideFor(path: string): OverrideValue {
    return overrides[path] ?? NO_OVERRIDE;
  }

  function withOverride(path: string, forLang: Locale, value: string | null): OverridesRecord {
    const current = overrideFor(path);
    return { ...overrides, [path]: { ...current, [forLang]: value } };
  }

  function renderField(fieldSpec: SiteTextField) {
    const current = overrideFor(fieldSpec.path);
    const overrideValue = lang === "en" ? current.en : current.ja;
    const changed = overrideValue !== null;

    const dictValue = stringAt(lang === "en" ? en : ja, fieldSpec.path);
    const value = overrideValue ?? dictValue;
    const fallback = lang === "ja" && !dictValue ? stringAt(en, fieldSpec.path) : undefined;

    const description = `Changed ${fieldSpec.label}.`;

    async function save(next: string) {
      const trimmed = next.trim();
      const toStore = trimmed === dictValue ? "" : trimmed;
      const previous = current[lang];
      setOverrides(withOverride(fieldSpec.path, lang, toStore || null));
      setStatus({ kind: "saving" });
      try {
        await updateSiteText(fieldSpec.path, lang, toStore);
        setStatus({ kind: "saved", message: description });
        undo.record({
          description,
          undo: async () => {
            setOverrides(withOverride(fieldSpec.path, lang, previous));
            try {
              if (previous === null) {
                await resetSiteText(fieldSpec.path, lang);
              } else {
                await updateSiteText(fieldSpec.path, lang, previous);
              }
              router.refresh();
            } catch (e) {
              setOverrides(withOverride(fieldSpec.path, lang, toStore || null));
              const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
              setStatus({ kind: "error", message });
              throw e;
            }
          },
        });
        router.refresh();
      } catch (e) {
        setOverrides(withOverride(fieldSpec.path, lang, previous));
        const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
        setStatus({ kind: "error", message });
        throw e;
      }
    }

    async function reset() {
      const previous = current[lang];
      const resetDescription = `Put back the original ${fieldSpec.label.toLowerCase()}.`;
      setOverrides(withOverride(fieldSpec.path, lang, null));
      setStatus({ kind: "saving" });
      try {
        await resetSiteText(fieldSpec.path, lang);
        setStatus({ kind: "saved", message: resetDescription });
        undo.record({
          description: resetDescription,
          undo: async () => {
            setOverrides(withOverride(fieldSpec.path, lang, previous));
            try {
              await updateSiteText(fieldSpec.path, lang, previous ?? "");
              router.refresh();
            } catch (e) {
              setOverrides(withOverride(fieldSpec.path, lang, null));
              const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
              setStatus({ kind: "error", message });
              throw e;
            }
          },
        });
        router.refresh();
      } catch (e) {
        setOverrides(withOverride(fieldSpec.path, lang, previous));
        const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
        setStatus({ kind: "error", message });
      }
    }

    return (
      <div
        key={fieldSpec.path}
        className="border-t border-line py-4 first:border-t-0 first:pt-0"
      >
        <div className={KIND_TEXT_CLASS[fieldSpec.kind]}>
          <EditableText
            key={`${fieldSpec.path}-${lang}`}
            label={`${fieldSpec.label} — ${lang === "en" ? "English" : "Japanese"}`}
            noun={fieldSpec.label}
            value={value}
            fallback={fallback}
            multiline={fieldSpec.kind !== "heading"}
            maxLength={fieldSpec.max}
            required={false}
            {...editState.fieldProps(fieldSpec.path)}
            onSave={save}
          />
        </div>
        {changed && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AdminBadge tone="pending">Changed</AdminBadge>
            <button
              type="button"
              onClick={() => void reset()}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-deep hover:underline"
            >
              Put the original words back
            </button>
          </div>
        )}
      </div>
    );
  }

  async function onUndo() {
    const error = await undo.runUndo();
    setStatus(error ? { kind: "error", message: error } : { kind: "idle" });
    document.getElementById("admin-edit-bar")?.focus();
  }

  return (
    <div>
      <EditBar
        lang={lang}
        onLangChange={handleLangChange}
        status={status}
        viewHref="/"
        undo={
          undo.entry
            ? { description: undo.entry.description, busy: undo.undoing, onUndo: () => void onUndo() }
            : undefined
        }
      />

      <div className="mt-6 flex flex-wrap gap-3">
        {SITE_TEXT_PAGES.map((page) => (
          <a key={page.id} href={`#words-${page.id}`} className={buttonClass("secondary")}>
            {page.label}
          </a>
        ))}
      </div>

      <div className="mt-8 space-y-12">
        {SITE_TEXT_PAGES.map((page) => (
          <section key={page.id} id={`words-${page.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl text-ink">{page.label}</h2>
              <a
                href={page.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-indigo-deep underline hover:text-indigo"
              >
                Open this page<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <div className="mt-4 space-y-6">
              {page.sections.map((pageSection) => (
                <AdminCard key={pageSection.id}>
                  <h3 className="font-display text-lg text-ink">{pageSection.label}</h3>
                  <div className="mt-2">{pageSection.fields.map(renderField)}</div>
                </AdminCard>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
