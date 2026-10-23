"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { expectOk } from "@/lib/action-result";
import {
  FLYER_ART_CHOICES,
  FLYER_IDEA_MAX_LENGTH,
  FLYER_THEMES,
  OTHER_THEME,
  themeForTitle,
} from "@/lib/flyer-art";
import { composeFlyer, type FlyerLettering, type FlyerStyle } from "@/lib/flyer-compose";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminDisclosure } from "@/components/admin/admin-disclosure";
import {
  AdminCharacterCount,
  AdminOptional,
  AdminSelect,
  AdminTextArea,
} from "@/components/admin/admin-field";
import { templatesForTheme } from "@/lib/flyer-templates";
import { generateFlyerArt, type FlyerArtInput } from "./actions";
import { FlyerWordsControls } from "./flyer-words";
import { useLetteredPreviews } from "./use-lettered-previews";

type Choice = { artUrl: string; previewUrl: string };

export function FlyerMaker({
  active,
  request,
  lettering,
  artUrl,
  style,
  previewUrl,
  updating,
  onChoose,
  onStyleChange,
}: {
  active: boolean;
  request: Omit<FlyerArtInput, "idea" | "themeId">;
  lettering: FlyerLettering;
  artUrl: string | null;
  style: FlyerStyle;
  previewUrl: string | null;
  updating: boolean;
  onChoose: (artUrl: string, previewUrl: string) => void;
  onStyleChange: (next: FlyerStyle) => void;
}) {
  const [picking, setPicking] = useState(!artUrl);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const switchedRef = useRef(false);

  const [pickedTheme, setPickedTheme] = useState<string | null>(null);
  const themeId = pickedTheme ?? themeForTitle(request.title) ?? OTHER_THEME;
  const templates = templatesForTheme(themeId);
  const templatePreviews = useLetteredPreviews(
    active && picking ? templates.map((template) => ({ key: template.src, artUrl: template.src })) : [],
    lettering
  );

  const [idea, setIdea] = useState("");
  const [painted, setPainted] = useState<Choice[]>([]);
  const [painting, setPainting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (switchedRef.current) headingRef.current?.focus();
  }, [picking]);

  function showPicker(next: boolean) {
    switchedRef.current = true;
    setPicking(next);
  }

  function choose(chosenUrl: string, chosenPreview: string) {
    if (chosenUrl !== artUrl) onChoose(chosenUrl, chosenPreview);
    showPicker(false);
  }

  async function paint() {
    if (painting) return;
    setError(null);
    if (!request.title.trim()) {
      setError("Give the event a title first, so the pictures can match it.");
      return;
    }
    setPainting(true);
    try {
      const artUrls = expectOk(await generateFlyerArt({ ...request, idea, themeId }));
      const made = await Promise.all(
        artUrls.map(async (url) => ({
          artUrl: url,
          previewUrl: URL.createObjectURL(await composeFlyer(url, lettering)),
        }))
      );
      for (const old of painted) {
        if (old.artUrl !== artUrl) URL.revokeObjectURL(old.previewUrl);
      }
      setPainted(made);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Couldn’t paint pictures right now. Please try again in a minute."
      );
    } finally {
      setPainting(false);
    }
  }

  if (!picking && artUrl) {
    return (
      <FlyerWordsControls
        headingRef={headingRef}
        artUrl={artUrl}
        lettering={lettering}
        style={style}
        previewUrl={previewUrl}
        updating={updating}
        onChange={onStyleChange}
        onChangePicture={() => showPicker(true)}
      />
    );
  }

  return (
    <div className="mt-6">
      <h3 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink focus:outline-none">
        Pick a picture
      </h3>
      <p className="mt-1 text-base text-ink-soft">
        Your title, date and place are already printed on each one. Tap the
        one you like. You can move the words afterwards.
      </p>
      {artUrl && (
        <div className="mt-3">
          <AdminButton onClick={() => showPicker(false)}>
            <span aria-hidden="true">← </span>Keep the picture I have
          </AdminButton>
        </div>
      )}

      <div className="mt-4 max-w-sm">
        <AdminSelect
          size="lg"
          label="Kind of event"
          value={themeId}
          aria-describedby="flyer-theme-hint"
          onChange={(e) => setPickedTheme(e.target.value)}
        >
          {FLYER_THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
          <option value={OTHER_THEME}>Show every picture</option>
        </AdminSelect>
        <p id="flyer-theme-hint" className="mt-1 text-sm text-stone">
          We guessed from your title. Change it to see other pictures.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {templates.map((template) => (
          <PictureChoice
            key={template.src}
            name={template.name}
            chosen={template.src === artUrl}
            previewUrl={templatePreviews[template.src] ?? null}
            fallbackSrc={template.src}
            onChoose={(preview) => choose(template.src, preview)}
          />
        ))}
      </div>

      <AdminDisclosure className="mt-6" summary="Don’t see one you like? Have new pictures painted">
        <p className="mt-4 text-base text-ink-soft">
          The website can paint {FLYER_ART_CHOICES} new pictures for this
          event. It takes about half a minute.
        </p>
        <div className="mt-4">
          <AdminTextArea
            label={
              <>
                Anything you’d like in the picture? <AdminOptional />
              </>
            }
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            maxLength={FLYER_IDEA_MAX_LENGTH}
            rows={2}
            placeholder="e.g. a stack of pancakes with syrup, kids dancing in yukata, our koi pond"
          />
          <AdminCharacterCount value={idea} max={FLYER_IDEA_MAX_LENGTH} />
          <p className="mt-1 text-sm text-stone">
            Describe the picture, not the words. The title, date and place are
            added for you.
          </p>
        </div>
        <div className="mt-4">
          <AdminButton variant="primary" aria-disabled={painting} onClick={paint}>
            {painting
              ? "Painting your pictures…"
              : painted.length
                ? `Paint ${FLYER_ART_CHOICES} more`
                : `Paint ${FLYER_ART_CHOICES} pictures`}
          </AdminButton>
        </div>
        <p role="status" className="mt-2 text-base text-ink-soft">
          {painting
            ? "This takes about half a minute."
            : painted.length
              ? `${painted.length} new pictures are ready. Tap one to use it.`
              : ""}
        </p>
        {error && (
          <div className="mt-2">
            <AdminAlert>{error}</AdminAlert>
          </div>
        )}
        {painted.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {painted.map((choice, i) => (
              <PictureChoice
                key={choice.artUrl}
                name={`New picture ${i + 1}`}
                chosen={choice.artUrl === artUrl}
                previewUrl={choice.previewUrl}
                onChoose={(preview) => choose(choice.artUrl, preview)}
              />
            ))}
          </div>
        )}
      </AdminDisclosure>
    </div>
  );
}

function PictureChoice({
  name,
  chosen,
  previewUrl,
  fallbackSrc,
  onChoose,
}: {
  name: string;
  chosen: boolean;
  previewUrl: string | null;
  fallbackSrc?: string;
  onChoose: (previewUrl: string) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      aria-disabled={!previewUrl}
      onClick={() => {
        if (previewUrl) onChoose(previewUrl);
      }}
      className={`overflow-clip rounded-lg border-4 bg-mist text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo aria-disabled:cursor-wait ${
        chosen ? "border-indigo" : "border-transparent hover:border-line"
      }`}
    >
      <span className="relative block aspect-flyer w-full">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          fallbackSrc && (
            <Image
              src={fallbackSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, 12rem"
              className="object-cover"
            />
          )
        )}
      </span>
      <span className="block px-2 py-2 text-center text-base font-medium text-ink">
        {chosen && <span aria-hidden="true">✓ </span>}
        {name}
        {chosen && <span className="block text-sm text-ink-soft">Your picture now</span>}
        {!previewUrl && (
          <span className="block text-sm font-normal text-ink-soft">Getting it ready…</span>
        )}
      </span>
    </button>
  );
}
