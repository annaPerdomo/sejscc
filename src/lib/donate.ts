export const ZEFFY_DONATION_URL =
  "https://www.zeffy.com/en-US/donation-form/donation-to-southeast-japanese-school-and-community-center";

// Zeffy A/B-tests its suggested amounts, so without a pinned amount the
// highlighted button and the amount actually charged can disagree.
const DEFAULT_DONATION_AMOUNT = 300;

// Only Zeffy's embed variant fits an iframe without an inner scrollbar.
export const ZEFFY_DONATION_EMBED_URL = `https://www.zeffy.com/embed/donation-form/donation-to-southeast-japanese-school-and-community-center?amount=${DEFAULT_DONATION_AMOUNT}`;
