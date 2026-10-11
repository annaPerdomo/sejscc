import { unstable_rethrow } from "next/navigation";

const UNEXPECTED_MESSAGE = "Something went wrong saving this. Please try again.";

/** An error whose message is a plain sentence safe to show a volunteer. */
export class AdminError extends Error {}

export type ActionResult<T = void> = { ok: true; value: T } | { ok: false; message: string };

// React replaces a thrown server action's message with a generic notice in
// production builds, so volunteer-facing messages travel back as a value.
export async function runAction<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: UNEXPECTED_MESSAGE };
  }
}

export function expectOk<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.message);
  return result.value;
}
