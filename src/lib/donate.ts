export const ZEFFY_DONATION_URL =
  "https://www.zeffy.com/en-US/donation-form/donation-to-southeast-japanese-school-and-community-center";

// Zeffy randomizes the prefilled amount on every load; pinning it keeps the
// total stable. Its suggested-amount buttons still vary — changing that needs a
// campaign setting we don't control.
const DEFAULT_DONATION_AMOUNT = 300;

export const ZEFFY_DONATION_EMBED_URL = `https://www.zeffy.com/embed/donation-form/donation-to-southeast-japanese-school-and-community-center?amount=${DEFAULT_DONATION_AMOUNT}`;
