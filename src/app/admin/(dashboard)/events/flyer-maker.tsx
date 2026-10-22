"use client";

import { useState } from "react";
import { expectOk } from "@/lib/action-result";
import { FLYER_ART_CHOICES, FLYER_IDEA_MAX_LENGTH } from "@/lib/flyer-art";
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
  request: Omit<FlyerArtInput, "idea">;
  lettering: FlyerLettering;
  chosenArtUrl: string | null;
  onChoose: (artUrl: string, previewUrl: string) => void;
}) {
  const [idea, setIdea] = useState("");
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
      const artUrls = expectOk(await generateFlyerArt({ ...request, idea }));
      const made = await Promise.all(
        artUrls.map(async (artUrl) => ({
          artUrl,
          previewUrl: URL.createObjectURL(await composeFlyer(artUrl, lettering)),
        }))
      );
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
        It paints {FLYER_ART_CHOICES} different pictures to match your event’s
        title, description and season, then prints the title, date and place
        on them. Pick the one you like. Change the date later and the flyer
        updates to match.
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
        <p className="mt-1 text-xs text-stone">
          Describe the picture, not the words — the title, date and place are
          added for you.
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
        {making ? "This takes about half a minute." : ""}
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
                    {chosen ? "✓ Chosen" : `Option ${i + 1}`}
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
