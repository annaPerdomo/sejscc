"use server";

import { headers } from "next/headers";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/admin";
import { sendEmail } from "@/lib/resend";
import { signInSender } from "@/lib/sign-in-email";
import { DETAILS_MAX, PAGE_MAX, REQUEST_KINDS, SUMMARY_MAX } from "./request-kinds";

type SiteRequest = {
  kind: string;
  summary: string;
  details: string;
  page: string;
};

function singleLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function sendRequest(request: SiteRequest): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();

    const kind = REQUEST_KINDS.find((k) => k.value === request.kind);
    if (!kind) throw new AdminError("Please choose what kind of request this is.");

    const summary = singleLine(request.summary);
    if (!summary) throw new AdminError("Please give your request a short title.");
    if (summary.length > SUMMARY_MAX) {
      throw new AdminError(`Please keep the title to ${SUMMARY_MAX} characters or fewer.`);
    }

    const details = request.details.trim();
    if (!details) throw new AdminError("Please describe what you need in the details box.");
    if (details.length > DETAILS_MAX) {
      throw new AdminError(`Please keep the details to ${DETAILS_MAX} characters or fewer.`);
    }

    const page = singleLine(request.page);
    if (page.length > PAGE_MAX) {
      throw new AdminError(`Please keep the page to ${PAGE_MAX} characters or fewer.`);
    }

    const to = process.env.SUPPORT_EMAIL_TO?.trim();
    if (!to) {
      console.error("SUPPORT_EMAIL_TO is not set, so requests can't be delivered.");
      throw new AdminError(
        "Requests can’t be sent from here yet. Please email your web developer directly for now."
      );
    }

    const browser = (await headers()).get("user-agent") ?? "Unknown";
    const sender = user.name ? `${user.name} <${user.email}>` : (user.email ?? "Unknown");

    try {
      await sendEmail({
        purpose: "request",
        from: signInSender(),
        to,
        replyTo: user.email ?? undefined,
        subject: `[SEJSCC ${kind.subject}] ${summary}`,
        text: [
          kind.title,
          "",
          summary,
          "",
          details,
          "",
          "—",
          `From: ${sender}`,
          `Page: ${page || "Not given"}`,
          `Browser: ${browser}`,
        ].join("\n"),
      });
    } catch (error) {
      console.error(error);
      throw new AdminError(
        "Your request couldn’t be sent just now. Please try again in a few minutes."
      );
    }
  });
}
