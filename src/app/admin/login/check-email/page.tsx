export default function CheckEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-mist px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-xl font-semibold text-ink">
          Check your email
        </h1>
        <p className="mt-3 text-ink-soft">
          We sent you a sign-in link. Open the email on this device and click
          the link to continue.
        </p>
      </div>
    </div>
  );
}
