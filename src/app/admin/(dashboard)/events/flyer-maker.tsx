"use client";

import { useState, type ReactNode } from "react";
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
import { generateFlyerArt, type FlyerArtInput } from "./actions";

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
      <p className="font-semibold text-ink">No flyer? Let the website make one.</p>
      <p className="mt-1 text-sm text-stone">
        Pick what kind of event it is and it paints {FLYER_ART_CHOICES}{" "}
        pictures in the center’s colors, then prints the title, date and place
        on them. Pick the one you like. Change the date later and the flyer
        updates to match.
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
            <ThemeOption
              key={theme.id}
              name={theme.name}
              checked={themeId === theme.id}
              onSelect={() => setPickedTheme(theme.id)}
            >
              <span className="relative block aspect-flyer w-full">
                <Image
                  src={`/flyer-styles/${theme.id}.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 12rem"
                  className="object-cover"
                />
              </span>
            </ThemeOption>
          ))}
          <ThemeOption
            name="Something else"
            blurb="Describe it in the box below"
            checked={themeId === OTHER_THEME}
            onSelect={() => setPickedTheme(OTHER_THEME)}
          >
            <span className="grid aspect-flyer w-full grid-cols-2 grid-rows-2">
              {FLYER_THEMES.slice(0, 4).map((theme) => (
                <span key={theme.id} className="relative">
                  <Image
                    src={`/flyer-styles/${theme.id}.jpg`}
                    alt=""
                    fill
                    sizes="6rem"
                    className="object-cover"
                  />
                </span>
              ))}
            </span>
          </ThemeOption>
        </div>
      </fieldset>
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
    </div>
  );
}

function ThemeOption({
  name,
  blurb,
  checked,
  onSelect,
  children,
}: {
  name: string;
  blurb?: string;
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <label className="cursor-pointer overflow-clip rounded-lg border-4 border-transparent bg-mist hover:border-line has-checked:border-indigo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo">
      <input
        type="radio"
        name="flyer-event-type"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
      <span className="block px-2 py-1.5 text-sm font-semibold text-ink">
        {checked && <span aria-hidden="true">✓ </span>}
        {name}
        {blurb && (
          <span className="block text-xs font-normal text-ink-soft">{blurb}</span>
        )}
      </span>
    </label>
  );
}
