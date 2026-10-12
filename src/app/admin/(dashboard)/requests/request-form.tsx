"use client";

import { useId, useState, type FormEvent } from "react";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import {
  AdminCharacterCount,
  AdminOptional,
  AdminRequired,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-field";
import { expectOk } from "@/lib/action-result";
import { sendRequest } from "./actions";
import {
  DETAILS_MAX,
  PAGE_MAX,
  REQUEST_KINDS,
  SUMMARY_MAX,
  type RequestKind,
} from "./request-kinds";

const DETAILS_HINT: Record<RequestKind, string> = {
  bug: "What were you trying to do, what did you expect, and what happened instead? Copy any error message word for word.",
  update: "What should change, and what should it say or look like afterwards?",
  feature: "What would you like to be able to do, and who would it help?",
};

export function RequestForm({ email }: { email: string | null }) {
  const kindName = useId();
  const [kind, setKind] = useState<RequestKind | null>(null);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [page, setPage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setSent(false);
    if (!kind) {
      setError("Please choose what kind of request this is.");
      return;
    }
    if (!summary.trim()) {
      setError("Please give your request a short title.");
      return;
    }
    if (!details.trim()) {
      setError("Please describe what you need in the details box.");
      return;
    }
    setBusy(true);
    try {
      expectOk(await sendRequest({ kind, summary, details, page }));
      setSent(true);
      setKind(null);
      setSummary("");
      setDetails("");
      setPage("");
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Your request couldn’t be sent just now. Please try again in a few minutes."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 flex items-center gap-3 font-display text-xl text-ink">
          What is this about? <AdminRequired />
        </legend>
        {REQUEST_KINDS.map((option) => (
          <KindChoice
            key={option.value}
            name={kindName}
            checked={kind === option.value}
            onChange={() => setKind(option.value)}
            title={option.title}
            description={option.description}
          />
        ))}
      </fieldset>

      <AdminCard>
        <div className="flex flex-col gap-6">
          <div>
            <AdminTextField
              size="lg"
              label={<>A short title <AdminRequired /></>}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={SUMMARY_MAX}
              placeholder="e.g. The flyer won’t upload on the Events page"
            />
            <AdminCharacterCount value={summary} max={SUMMARY_MAX} />
          </div>

          <div>
            <AdminTextArea
              size="lg"
              label={<>Details <AdminRequired /></>}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={DETAILS_MAX}
              rows={8}
              placeholder={kind ? DETAILS_HINT[kind] : "Tell us as much as you can."}
            />
            <AdminCharacterCount value={details} max={DETAILS_MAX} />
          </div>

          <AdminTextField
            size="lg"
            label={<>Which page is it on? <AdminOptional /></>}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            maxLength={PAGE_MAX}
            placeholder="e.g. the Events page, or paste the web address"
          />
        </div>

        {error && (
          <div className="mt-6">
            <AdminAlert>{error}</AdminAlert>
          </div>
        )}
        <div className="mt-6">
          <AdminFormActions>
            <p role="status" aria-live="polite" className="mr-auto text-sm font-medium text-indigo-deep">
              {sent && !error
                ? `Sent — thank you!${email ? ` Replies will come to ${email}.` : ""}`
                : ""}
            </p>
            <AdminButton type="submit" variant="primary" disabled={busy}>
              {busy ? "Sending…" : "Send Request"}
            </AdminButton>
          </AdminFormActions>
        </div>
      </AdminCard>
    </form>
  );
}

function KindChoice({
  name,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-5 ${
        checked ? "border-indigo bg-white" : "border-line bg-white/60"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1.5 h-5 w-5 shrink-0 accent-indigo"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl text-ink">{title}</span>
        <span className="mt-1 block text-base text-ink-soft">{description}</span>
      </span>
    </label>
  );
}
