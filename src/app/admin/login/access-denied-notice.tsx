export function AccessDeniedNotice({ contactEmail }: { contactEmail: string | null }) {
  return (
    <div className="mt-6 rounded-lg border border-line bg-mist px-5 py-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-indigo"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="size-4.5"
          >
            <rect x="4.75" y="10.5" width="14.5" height="9" rx="2" />
            <path d="M8.25 10.5V7.75a3.75 3.75 0 0 1 7.5 0v2.75" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-ink">
            You don&apos;t have access yet
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            That email address isn&apos;t on the volunteer list, so we
            couldn&apos;t send a sign-in link.
            {contactEmail ? (
              <>
                {" "}
                To ask for access, email{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-medium text-indigo underline underline-offset-4 hover:text-indigo-deep"
                >
                  {contactEmail}
                </a>
                .
              </>
            ) : (
              " Ask a board member to add you, then request a new link."
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Already a volunteer? You may have used a different address than the
            one on file — try again below.
          </p>
        </div>
      </div>
    </div>
  );
}
