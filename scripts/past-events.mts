// The center's real events, April 2025 through December 2026, gathered from
// sejscc.org, the monthly newsletter and the Parents' Group emails.
import { POKER_SIGNUP } from "./demo-events.mts";

export type PastEvent = {
  slug: string;
  title: string;
  date: string;
  start?: string;
  end?: string;
  description?: string;
  flyer?: string;
  location?: string;
  signup?: string;
  status?: "published" | "archived";
};

export const PAST_EVENTS: PastEvent[] = [
  {
    slug: "clean-up-day-2025",
    title: "Annual Center Clean-Up Day",
    date: "2025-04-26",
    start: "12:00",
    description:
      "Members and families pitch in to tidy the grounds, classrooms and dojo before the spring events.",
  },
  {
    slug: "recognition-dinner-2025",
    title: "SEJSCC Recognition Dinner",
    date: "2025-05-10",
    start: "17:30",
    end: "20:30",
    description:
      "An evening honoring the volunteers and supporters who keep the center running, with dinner served by Gakuen families.",
  },
  {
    slug: "ohanashikai-2025",
    title: "Ohanashikai Speech Program",
    date: "2025-05-17",
    start: "09:30",
    description:
      "Japanese School students present speeches and stories in Japanese for family and friends.",
  },
  {
    slug: "cultural-festival-2025",
    title: "62nd Annual Cultural Festival & Ondo",
    date: "2025-06-07",
    start: "15:00",
    end: "21:00",
    flyer: "cultural-festival-2025.pdf",
    description:
      "Saturday June 7, 3–9 PM and Sunday June 8, 2–8 PM. Traditional music and dancing, festival games, bingo, martial-arts demonstrations, taiko, ikebana displays and food.\n\nFree ondo lessons Monday and Thursday evenings 7:30–8:30 PM. Raffle tickets $5: cash prizes up to $1,500 and a Las Vegas getaway; drawing Sunday 7:30 PM.",
  },
  {
    slug: "poker-night-2025",
    title: "NYS & WNB Poker Night and Social",
    date: "2025-07-19",
    start: "17:00",
    flyer: "poker-night-2025.png",
    description:
      "Texas Hold ’Em tournament and social evening hosted by Norwalk Youth Sports and Wednesday Night Basketball. Come to play, or just for dinner and a drink.",
  },
  {
    slug: "centennial-celebration-2025",
    title: "100th Anniversary Celebration Dinner",
    date: "2025-07-26",
    start: "17:00",
    description:
      "One hundred years since Norwalk Gakuen opened its doors in 1925: a celebration dinner with members, alumni and friends from every organization at the center.",
  },
  {
    slug: "panda-express-fundraiser-2025",
    title: "Panda Express Fundraiser Day",
    date: "2025-08-14",
    location: "Online — any Panda Express, nationwide",
    description:
      "Order online on August 14 with code 9005182 at checkout and Panda Express gives 28% back to the center.",
  },
  {
    slug: "first-day-of-school-2025",
    title: "First Day of Japanese School",
    date: "2025-08-16",
    start: "09:00",
    end: "12:30",
    description: "The 2025–26 school year begins. Welcome back, and welcome to our new families.",
  },
  {
    slug: "college-workshop-2025",
    title: "Free College Workshop",
    date: "2025-08-23",
    start: "10:00",
    end: "12:00",
    flyer: "college-workshop-2025.png",
    description:
      "For parents and students: the college application process, financial aid, and help with the personal statement.",
  },
  {
    slug: "monthly-bingo-2025-09-06",
    title: "Monthly Bingo — Hosted by Gakuen",
    date: "2025-09-06",
    start: "16:30",
    end: "20:30",
    description:
      "Each organization at the center takes a turn hosting the monthly bingo dinner. This month Japanese School serves an udon dinner.",
  },
  {
    slug: "undokai-2025",
    title: "Gakuen Undokai (Field Day)",
    date: "2025-10-04",
    start: "09:00",
    end: "13:00",
    description:
      "Japanese School’s annual sports day: relays, tug-of-war and games for every level, with families cheering from the sidelines.",
  },
  {
    slug: "pancake-breakfast-2025",
    title: "NYS Pancake Breakfast & Holiday Boutique",
    date: "2025-10-25",
    start: "07:00",
    end: "12:30",
    description:
      "Hawaiian-style breakfast of pancakes, Portuguese sausage, eggs and rice, 7–11 AM; $8 pre-sale, $10 at the door. The boutique in the gym sells homemade crafts, snacks and gifts.\n\nThe parking lot closes for the day — please park in the neighborhood or at Gerdes Park.",
  },
  {
    slug: "mochitsuki-2025",
    title: "Norwalk Judo Mochitsuki Fundraiser",
    date: "2025-12-13",
    start: "08:00",
    end: "12:00",
    flyer: "mochitsuki-2025.pdf",
    description:
      "Traditionally pounded mochi for the New Year, made by Norwalk Judo. Pre-orders by mail, postmarked by November 30; quantities are limited.",
  },
  {
    slug: "one-mans-dream-2026-01",
    title: "Grateful Crane Ensemble: One Man’s Dream",
    date: "2026-01-25",
    start: "14:00",
    flyer: "one-mans-dream-2026-01.png",
    signup: "https://forms.gle/i3oRjVgipsAuRbGF6",
    description:
      "The premiere of a dramatic musical tracing the history of Southeast Japanese School, performed live on our stage by the Grateful Crane Ensemble.",
  },
  {
    slug: "sees-candies-2026",
    title: "Sweets for Your Sweets — See’s Candies Fundraiser",
    date: "2026-02-20",
    flyer: "sees-candies-2026.pdf",
    location: "Online store",
    signup: "https://www.yumraising.com/store/spring-2026-sejscc-caf2",
    description:
      "The center’s online See’s Candies store is open February 20 to March 20; a share of every order goes toward the kitchen renovation. Orders of $75 or more ship free.",
  },
  {
    slug: "recognition-dinner-2026",
    title: "SEJSCC Recognition Awards Dinner",
    date: "2026-04-18",
    start: "17:30",
    flyer: "recognition-dinner-2026.png",
    signup: "https://forms.gle/LwSUstLShKVZhwsE9",
    description:
      "Honoring Ronald H. Kuroda, Max Uyekawa and Mike Perez for outstanding service, with special recognition of Dick and Diane Mercer, and the Koichi & Toyo Nerio Scholarships for graduating seniors from NYS and Norwalk Judo.\n\nIsland-style bento dinner; $35 adults, $18 high school and younger. RSVP by March 28.",
  },
  {
    slug: "ohanashikai-2026",
    title: "Ohanashikai Speech Program",
    date: "2026-05-16",
    start: "09:30",
    description:
      "Japanese School students present speeches and stories in Japanese for family and friends.",
  },
  {
    slug: "cultural-festival-2026",
    title: "2026 Cultural Festival",
    date: "2026-06-13",
    start: "15:00",
    end: "21:00",
    flyer: "cultural-festival-2026.pdf",
    description:
      "Saturday June 13 and Sunday June 14. Performances, games, bingo, ikebana and food, with a char siu bao booth ($4 each, $10 for 3, $18 for 6, $32 a dozen; pre-orders by June 5).\n\nRaffle grand prize $1,500.",
  },
  {
    slug: "one-mans-dream-2026-06",
    title: "One Man’s Dream — Encore Performance",
    date: "2026-06-20",
    start: "14:00",
    flyer: "one-mans-dream-2026-06.png",
    description:
      "Back by popular demand: the Grateful Crane Ensemble returns with the musical about the school’s founding.",
  },
  {
    slug: "first-day-of-school-2026",
    title: "First Day of Japanese School",
    date: "2026-08-15",
    start: "09:00",
    end: "12:30",
    description: "The 2026–27 school year begins. Welcome back, and welcome to our new families.",
  },
  {
    slug: "poker-casino-night-2026",
    title: "2nd Annual NYS/WNB Poker & Casino Night",
    date: "2026-08-29",
    start: "17:00",
    flyer: "poker-casino-night-2026.png",
    signup: POKER_SIGNUP,
    description:
      "Poker tournament, casino games, dinner and drinks, hosted by Norwalk Youth Sports and Wednesday Night Basketball.",
  },
  {
    slug: "monthly-bingo-2026-09-12",
    title: "Monthly Bingo — Hosted by Gakuen",
    date: "2026-09-12",
    start: "16:30",
    end: "20:30",
    description:
      "Each organization at the center takes a turn hosting the monthly bingo dinner. This month it is Japanese School’s turn.",
  },
  {
    slug: "undokai-2026",
    title: "Gakuen Undokai (Field Day)",
    date: "2026-10-03",
    start: "09:00",
    end: "13:00",
    description:
      "Japanese School’s annual sports day: relays, tug-of-war and games for every level, with families cheering from the sidelines.",
  },
  {
    slug: "monthly-bingo-2026-10-03",
    title: "Monthly Bingo — Hosted by WNB & SNB",
    date: "2026-10-03",
    start: "16:30",
    end: "20:30",
    description:
      "Each organization at the center takes a turn hosting the monthly bingo dinner. This month Wednesday Night Basketball and Sunday Night Basketball host.",
  },
  {
    slug: "pancake-breakfast-2026",
    title: "NYS 33rd Annual Pancake Breakfast",
    date: "2026-10-24",
    start: "07:00",
    end: "11:00",
    flyer: "pancake-breakfast-2026.pdf",
    description:
      "Pancakes, Portuguese sausage, eggs and rice, with juice and coffee in the dojo. $8 pre-sale at the office, $10 at the door.\n\nThe parking lot is closed for the day.",
  },
  {
    slug: "holiday-boutique-2026",
    title: "2026 Holiday Boutique",
    date: "2026-10-24",
    start: "08:00",
    end: "12:30",
    flyer: "holiday-boutique-2026.png",
    description:
      "Homemade crafts, snacks and gifts in the gym, including the SEJSCC happi coat booth, alongside the pancake breakfast. Norwalk Judo serves takoyaki, karaage, mochi ice cream and Spam musubi from 8:30 AM until sold out.",
  },
  {
    slug: "monthly-bingo-2026-11-07",
    title: "Monthly Bingo — Hosted by Ikebana & Dance",
    date: "2026-11-07",
    start: "16:30",
    end: "20:30",
    description:
      "Each organization at the center takes a turn hosting the monthly bingo dinner. This month the Ikebana and dance groups host.",
  },
  {
    slug: "keiro-no-hi-2026",
    title: "Keiro no Hi — Respect for Elders Luncheon",
    date: "2026-11-08",
    start: "12:00",
    flyer: "keiro-no-hi-2026.pdf",
    signup: "https://www.sejscc.org/wp-content/uploads/2026/10/Tomodachi-2026-10.pdf",
    description:
      "Lunch at noon honoring our members aged 80 and over, who dine free; guests and members under 80, $15. Pickup and home delivery available. Reserve by October 24 — no walk-ins.",
  },
  {
    slug: "reverse-draw-2026",
    title: "Reverse Draw Dinner & Dance",
    date: "2026-11-14",
    start: "17:00",
    flyer: "reverse-draw-2026.png",
    signup: "https://forms.gle/wn7PESi4pQeBLNdY6",
    description:
      "A $100 ticket is a chance at $5,000 — and includes dinner and the social dance that follows the drawing: line dancing, freestyle and partner dancing.\n\nProceeds go toward the kitchen upgrade and its health-department permit. You need not be present to win.",
  },
  {
    slug: "monthly-bingo-2026-12-05",
    title: "Monthly Bingo — Hosted by the Seniors",
    date: "2026-12-05",
    start: "16:30",
    end: "20:30",
    description:
      "Each organization at the center takes a turn hosting the monthly bingo dinner. This month the Seniors host.",
  },
  {
    slug: "toshikoshi-soba-2026",
    title: "Toshikoshi Soba & Holiday Visitor",
    date: "2026-12-19",
    start: "09:30",
    end: "12:00",
    description:
      "Japanese School’s last day of the year: year-end soba for the students and a visit from a certain holiday guest.",
  },
];

export const REPLACED_DEMO_SLUGS: string[] = [
  "cultural-festival-2025",
  "monthly-bingo-2025-09-06",
  "undokai-2025",
  "holiday-boutique-2025",
  "mochitsuki-2025",
  "ohanashikai-2026",
  "cultural-festival-2026",
  "first-day-of-school-2026",
  "monthly-bingo-2026-09-12",
  "monthly-bingo",
  "undokai-2026",
  "holiday-boutique-2026",
];
