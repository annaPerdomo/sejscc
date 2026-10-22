"use client";

import { useState } from "react";
import Image from "next/image";
import { expectOk } from "@/lib/action-result";
import {
  FLYER_ART_CHOICES,
  FLYER_IDEA_MAX_LENGTH,
  FLYER_THEMES,
  OTHER_THEME,
  themeForTitle,
} from "@/lib/flyer-art";
import { composeFlyer, type FlyerLettering } from "@/lib/flyer-compose";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton } from "@/components/admin/admin-button";
import {
  AdminCharacterCount,
  AdminOptional,
  AdminTextArea,
} from "@/components/admin/admin-field";
import { AdminOptionTile } from "@/components/admin/admin-option-tile";
import { FLYER_TEMPLATES, templatesForTheme } from "@/lib/flyer-templates";
import { generateFlyerArt, type FlyerArtInput } from "./actions";
import { useLetteredPreviews } from "./use-lettered-previews";

type Choice = { artUrl: string; previewUrl: string };

export function FlyerMaker({
  request,
  lettering,
  chosenArtUrl,
  onChoose,
}: {
  request: Omit<FlyerArtInput, "idea" | "themeId">;
  lettering: FlyerLettering;
  chosenArtUrl: string | null;
  onChoose: (artUrl: string, previewUrl: string) => void;
}) {
  const [idea, setIdea] = useState("");
  const [pickedTheme, setPickedTheme] = useState<string | null>(null);
  const themeId = pickedTheme ?? themeForTitle(request.title) ?? OTHER_THEME;
  const [source, setSource] = useState<"ready" | "paint">("ready");
  const templates = templatesForTheme(themeId);
  const templatePreviews = useLetteredPreviews(
    source === "ready"
      ? templates.map((template) => ({ key: template.src, artUrl: template.src }))
      : [],
    lettering
  );
  const [choices, setChoices] = useState<Choice[]>([]);
  const [making, setMaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function make() {
    if (making) return;
    setError(null);
    if (!request.title.trim()) {
      setError("Give the event a title first, so the picture can match it.");
      return;
    }
    setMaking(true);
    try {
      const artUrls = expectOk(await generateFlyerArt({ ...request, idea, themeId }));
      const made = await Promise.all(
        artUrls.map(async (artUrl) => ({
          artUrl,
          previewUrl: URL.createObjectURL(await composeFlyer(artUrl, lettering)),
        }))
      );
      for (const old of choices) {
        if (old.artUrl !== chosenArtUrl) URL.revokeObjectURL(old.previewUrl);
      }
      setChoices(made);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Couldn’t make a flyer right now. Please try again in a minute."
      );
    } finally {
      setMaking(false);
    }
  }

  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="font-semibold text-ink">Make a flyer</h3>
      <p className="mt-1 text-sm text-stone">
        Pick the kind of event, then choose a ready-made design or have the
        website paint new pictures. The title, date and place are printed on
        for you, and they update when the event changes.
      </p>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-ink">
          What kind of event is it?
        </legend>
        <p className="mt-1 text-xs text-stone">
          We guessed from your title. Pick another if it’s not right.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {FLYER_THEMES.map((theme) => (
            <AdminOptionTile
              key={theme.id}
              inputName="flyer-event-type"
              name={theme.name}
              checked={themeId === theme.id}
              onSelect={() => setPickedTheme(theme.id)}
            >
              <span className="relative block aspect-flyer w-full">
                <Image
                  src={templatesForTheme(theme.id)[0].src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 12rem"
                  className="object-cover"
                />
              </span>
            </AdminOptionTile>
          ))}
          <AdminOptionTile
            inputName="flyer-event-type"
            name="Something else"
            blurb="See every design, or describe your own"
            checked={themeId === OTHER_THEME}
            onSelect={() => setPickedTheme(OTHER_THEME)}
          >
            <span className="grid aspect-flyer w-full grid-cols-2 grid-rows-2">
              {FLYER_TEMPLATES.slice(0, 4).map((template) => (
                <span key={template.id} className="relative">
                  <Image
                    src={template.src}
                    alt=""
                    fill
                    sizes="6rem"
                    className="object-cover"
                  />
                </span>
              ))}
            </span>
          </AdminOptionTile>
        </div>
      </fieldset>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-ink">
          How do you want the picture?
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <AdminOptionTile
            inputName="flyer-picture-source"
            name="Use a ready-made design"
            blurb="Ready right away. Pick one below."
            checked={source === "ready"}
            onSelect={() => setSource("ready")}
          />
          <AdminOptionTile
            inputName="flyer-picture-source"
            name="Paint new pictures"
            blurb="Takes about half a minute. Describe an idea if you like."
            checked={source === "paint"}
            onSelect={() => setSource("paint")}
          />
        </div>
      </fieldset>
      {source === "ready" ? (
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-ink">Pick a design</legend>
          <p className="mt-1 text-sm text-stone">
            These are free and ready now. Tap one to use it.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templates.map((template) => {
              const chosen = template.src === chosenArtUrl;
              const previewUrl = templatePreviews[template.src];
              return (
                <button
                  key={template.src}
                  type="button"
                  aria-pressed={chosen}
                  aria-disabled={!previewUrl}
                  onClick={() => {
                    if (previewUrl) onChoose(template.src, previewUrl);
                  }}
                  className={`overflow-clip rounded-lg border-4 bg-mist text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    chosen ? "border-indigo" : "border-transparent hover:border-line"
                  }`}
                >
                  <span className="relative block aspect-flyer w-full">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <Image
                        src={template.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, 12rem"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="block px-2 py-1.5 text-center text-sm font-medium text-ink">
                    {template.name}
                    {chosen && (
                      <span className="block">
                        <span aria-hidden="true">✓ </span>Chosen
                      </span>
                    )}
                    {!previewUrl && (
                      <span className="block font-normal text-ink-soft">
                        Getting it ready…
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <>
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
            <p className="mt-1 text-xs text-stone">
              Want something custom? Describe it here — your idea comes first and
              the event type fills in the rest. Describe the picture, not the
              words: the title, date and place are added for you.
            </p>
          </div>
          <div className="mt-4">
            <AdminButton variant="primary" aria-disabled={making} onClick={make}>
              {making
                ? "Painting your flyers…"
                : choices.length
                  ? `Make ${FLYER_ART_CHOICES} more`
                  : "Make me a flyer"}
            </AdminButton>
          </div>
          <p role="status" className="mt-2 text-sm text-stone">
            {making
              ? "This takes about half a minute."
              : choices.length
                ? `${choices.length} flyers are ready. Pick one below.`
                : ""}
          </p>
          {error && (
            <div className="mt-2">
              <AdminAlert>{error}</AdminAlert>
            </div>
          )}
          {choices.length > 0 && (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-ink">
                Pick a flyer
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {choices.map((choice, i) => {
                  const chosen = choice.artUrl === chosenArtUrl;
                  return (
                    <button
                      key={choice.artUrl}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => onChoose(choice.artUrl, choice.previewUrl)}
                      className={`overflow-clip rounded-lg border-4 bg-mist text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                        chosen ? "border-indigo" : "border-transparent hover:border-line"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={choice.previewUrl}
                        alt={`Flyer option ${i + 1}`}
                        className="aspect-flyer w-full object-cover"
                      />
                      <span className="block px-2 py-1.5 text-center text-sm font-medium text-ink">
                        {chosen ? (
                          <>
                            <span aria-hidden="true">✓ </span>Chosen
                          </>
                        ) : (
                          `Option ${i + 1}`
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        </>
      )}
    </div>
  );
}
