export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6ef] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#e5dccb] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-[#1f2a44]">
          Check your email
        </h1>
        <p className="mt-3 text-[#6b6355]">
          We sent you a sign-in link. Open the email on this device and click
          the link to continue.
        </p>
      </div>
    </div>
  );
}
