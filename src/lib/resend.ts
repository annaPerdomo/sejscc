type Email = {
  purpose: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendEmail({ purpose, from, to, subject, text, html, replyTo }: Email) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTH_RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html, reply_to: replyTo }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend rejected the ${purpose} email (${response.status}): ${await response.text()}`
    );
  }
}
