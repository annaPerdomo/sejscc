// The demo event list, shared by seed-demo-events.mts (writes the rows) and
// make-demo-flyers.mts (draws a flyer for each one).

import { CENTER_ADDRESS } from "../src/lib/center.ts";
import type { EventRepeat, events } from "../src/db/schema.ts";

export const CENTER = CENTER_ADDRESS;
export const PARK = "Norwalk Park, 13000 Clarkdale Ave., Norwalk, CA 90650";

// Marks every seeded row, on screen and for the seeder's own delete guards, so
// demo content is never mistaken for — or deletes — real Center information.
export const TITLE_PREFIX = "[EXAMPLE] ";

// Live pages the Center really runs, so a demo click lands somewhere real.
export const NYS = "https://www.norwalkyouthsports.org/";
export const JUDO = "http://www.norwalkjudo.com/";
export const SCHOOL_REGISTRATION = "https://www.sejscc.org/online-registration/";
export const POKER_SIGNUP =
  "https://docs.google.com/forms/d/e/1FAIpQLScp_CjU4YrLeRI7ZA7kaoW-TFbTA0ar6VXjXFk7iKLgqAlmoA/viewform";

// Rows earlier versions of this script wrote and no longer list below. Deleted
// on every run, so a database seeded before the change still comes out clean.
export const RETIRED_SLUGS = [
  "monthly-bingo-2026-10-03",
  "monthly-bingo-2026-11-07",
  "monthly-bingo-2026-12-05",
  "monthly-bingo-2027-02-06",
  "nikkei-seniors-november-2026",
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

export type DemoEventKind =
  | "festival"
  | "bingo"
  | "sports"
  | "market"
  | "tradition"
  | "food"
  | "school"
  | "music"
  | "community";

export type DemoEvent = {
  slug: string;
  kind: DemoEventKind;
  title: string;
  date: string;
  description?: string;
  wide?: boolean;
  start?: string;
  end?: string;
  flyer?: string;
  noFlyer?: boolean;
  location?: string;
  repeat?: Exclude<EventRepeat, "none">;
  until?: string;
  signup?: string;
  status?: (typeof events.$inferSelect)["status"];
};

// `flyer` names a file in the flyers directory (--flyers=..., default
// ./materials); without one, make-demo-flyers.mts draws a stand-in. `noFlyer`
// opts out of both, so the board can see a card with no flyer at all. `repeat` +
// `until` post a single row that moves itself forward.
export const DEMO_EVENTS: DemoEvent[] = [
  {
    slug: "shichi-go-san-2025",
    kind: "tradition",
    title: "Shichi-Go-San Kimono Day",
    date: "2025-11-15",
    start: "09:00",
    end: "12:15",
    description:
      "Students learn about the Seven-Five-Three festival, and a few have the chance to be dressed in traditional kimono for photographs.",
  },
  {
    slug: "shinnenkai-2026",
    kind: "food",
    title: "Shinnenkai New Year Luncheon",
    date: "2026-01-10",
    start: "11:30",
    end: "14:30",
    description:
      "The Center welcomes the new year with ozoni, a short program, and the annual thank-you to our volunteers. Open to all members and their families.",
  },
  {
    slug: "setsubun-2026",
    kind: "tradition",
    title: "Setsubun Mamemaki",
    date: "2026-02-07",
    start: "09:00",
    end: "12:15",
    description:
      "Students chase the oni out of the classrooms with roasted soybeans and eat one bean for each year of their age to bring good luck for the year ahead.",
  },
  {
    slug: "hinamatsuri-2026",
    kind: "tradition",
    title: "Hinamatsuri Doll Display",
    date: "2026-03-07",
    start: "09:00",
    end: "12:15",
    description:
      "The hina-ningyo display is set up in the hall for the doll festival. Students visit the display by class and learn about the Emperor and Empress's court.",
  },
  {
    slug: "hanami-2026",
    kind: "festival",
    title: "Hanami Spring Picnic",
    date: "2026-04-11",
    start: "10:00",
    end: "13:00",
    location: PARK,
    description:
      "Classes walk to the park to see the blossoms and share a bento lunch together. Parent volunteers are always needed for the walk over.",
  },
  {
    slug: "tanabata-2026",
    kind: "tradition",
    title: "Tanabata Star Festival",
    date: "2026-07-11",
    start: "09:00",
    end: "12:00",
    description:
      "Students write their wishes on tanzaku and hang them on the tanabata tree in the hall.",
  },
  {
    slug: "nikkei-seniors-luncheon",
    kind: "food",
    title: "Nikkei Seniors Monthly Luncheon",
    date: "2026-09-08",
    start: "11:30",
    end: "14:30",
    repeat: "monthly",
  },
  {
    slug: "back-to-school-day-2026",
    kind: "school",
    wide: true,
    title: "Back to School Day",
    date: "2026-09-19",
    start: "09:00",
    end: "12:15",
    signup: SCHOOL_REGISTRATION,
    description:
      "Parents sit in on their child's classroom to see the curriculum and meet the sensei. A short PTA meeting follows in the hall.",
  },
  {
    slug: "nys-basketball-opening-day-2026",
    kind: "sports",
    title: "NYS Basketball Opening Day",
    date: "2026-09-26",
    start: "09:00",
    end: "16:00",
    signup: NYS,
    description:
      "Opening day for the Norwalk Youth Sports fall season. Team photos in the morning, games all afternoon, snack bar open in the gym.\n\nPlayers register for the season through Norwalk Youth Sports — sign up before opening day so your child is placed on a team.",
  },
  {
    slug: "norwalk-judo-fall-tournament-2026",
    kind: "sports",
    wide: true,
    title: "Norwalk Judo Fall Tournament",
    date: "2026-10-10",
    start: "08:00",
    end: "15:00",
    signup: JUDO,
    description:
      "Norwalk Judo hosts visiting dojos from across Southern California. Spectators are welcome in the gym; please no outside food on the mat side.\n\nCompetitors enter through their own dojo — entries close the Monday before the tournament.",
  },
  {
    slug: "shichi-go-san-2026",
    kind: "tradition",
    title: "Shichi-Go-San Kimono Day",
    date: "2026-11-14",
    start: "09:00",
    end: "12:15",
  },
  {
    slug: "mochitsuki-2026",
    kind: "food",
    wide: true,
    title: "Mochitsuki & Toshikoshi Soba",
    date: "2026-12-12",
    start: "09:00",
    end: "13:00",
    description:
      "Year-end mochi pounding on the patio followed by toshikoshi soba in the hall. Volunteers are needed from 7:00 AM to set up the usu and steamers.",
  },
  {
    slug: "hikari-taiko-winter-concert-2026",
    kind: "music",
    wide: true,
    title: "Hikari Taiko Winter Concert",
    date: "2026-12-19",
    start: "18:00",
    end: "20:00",
  },
  {
    slug: "shinnenkai-2027",
    kind: "food",
    wide: true,
    title: "Shinnenkai & General Membership Meeting",
    date: "2027-01-09",
    start: "11:30",
    end: "14:30",
    description:
      "Ozoni, a short New Year program, and the annual membership meeting where the board reports on the year and introduces incoming members.",
  },
  {
    slug: "oshogatsu-ozoni-day-2027",
    kind: "tradition",
    title: "Oshogatsu Ozoni Day at the Gakuen",
    date: "2027-01-16",
    start: "09:00",
    end: "12:15",
    description:
      "Students are served ozoni to welcome the new year and learn about oshogatsu traditions in their classrooms.",
  },
  {
    slug: "setsubun-2027",
    kind: "tradition",
    title: "Setsubun Mamemaki",
    date: "2027-02-13",
    start: "09:00",
    end: "12:15",
    description:
      "Roasted soybeans, an oni or two, and a good-luck start to the year for every class.",
  },
  {
    slug: "hinamatsuri-2027",
    kind: "tradition",
    title: "Hinamatsuri Doll Display & Open House",
    date: "2027-03-06",
    start: "09:00",
    end: "13:00",
    description:
      "The hina-ningyo display is up in the hall, and prospective families are invited to visit classrooms and meet the sensei after 11:00 AM.",
  },
  {
    slug: "kendo-spring-taikai-2027",
    kind: "sports",
    wide: true,
    title: "Norwalk Kendo Dojo Spring Taikai",
    date: "2027-03-20",
    start: "08:30",
    end: "16:00",
    description:
      "An all-day tournament in the gym with dojos from the Southern California Kendo Federation. Spectators welcome; please keep the walkways clear.",
  },
  {
    slug: "community-clean-up-day-2027",
    kind: "community",
    wide: true,
    title: "Community Clean-Up Day",
    date: "2027-04-03",
    start: "08:00",
    end: "12:00",
    description:
      "Bring gloves and a rake. Every group that uses the Center pitches in on the grounds, the kitchen, and the storage rooms. Lunch is provided for volunteers.",
  },
  {
    slug: "hanami-2027",
    kind: "festival",
    wide: true,
    title: "Hanami Spring Picnic",
    date: "2027-04-10",
    start: "10:00",
    end: "13:00",
    location: PARK,
    description:
      "Classes walk to the park to see the blossoms and share a bento lunch. Parent volunteers needed for the walk over.",
  },
  {
    slug: "ohanashikai-2027",
    kind: "school",
    title: "Ohanashikai Speech Program",
    date: "2027-05-01",
    start: "09:30",
    end: "12:00",
    description:
      "Students present a short speech in Japanese on stage, showing what they have learned over the year. Families are welcome to attend.",
  },
  {
    slug: "kodomo-no-hi-2027",
    kind: "tradition",
    title: "Kodomo no Hi Koinobori Day",
    date: "2027-05-08",
    start: "09:00",
    end: "12:15",
    description:
      "Koi no bori, samurai helmets, and musha ningyo are displayed for Children's Day, with a presentation for each class.",
  },
  {
    slug: "fall-registration-opens-2027",
    kind: "school",
    title: "Fall Semester Registration Opens",
    date: "2027-06-05",
    signup: SCHOOL_REGISTRATION,
    description:
      "Online registration for the fall semester opens for returning and new students. Email gakuen@sejscc.org with any questions about placement.",
  },
  {
    slug: "cultural-festival-2027",
    kind: "festival",
    title: "2027 Cultural Festival",
    date: "2027-06-12",
    start: "10:00",
    end: "15:00",
    description:
      "Student performances, taiko, food booths, game booths, and a raffle. Admission is free and the whole community is invited.",
  },
  {
    slug: "gakuen-closing-ceremony-2027",
    kind: "school",
    title: "Gakuen Closing Ceremony & Graduation",
    date: "2027-06-26",
    start: "09:00",
    end: "12:00",
    description:
      "The shuryoshiki ceremony closes the school year, with certificates for every student and recognition for our graduating level 12 class.",
  },
  {
    slug: "first-day-of-school-2027",
    kind: "school",
    title: "First Day of School — Fall Semester Begins",
    date: "2027-08-21",
    start: "08:45",
    end: "12:15",
    description:
      "The fall semester opens with the shigyoshiki ceremony. Kindergarten through level 3 begin at 8:45 AM; levels 4 through 12 begin at 9:00 AM.",
  },
  {
    slug: "poker-casino-night-2027",
    kind: "community",
    title: "3rd Annual NYS/WNB Poker & Casino Night",
    date: "2027-08-28",
    start: "18:00",
    end: "22:00",
    flyer: "Cursor_and_Update_Sign_Up_HyperlinkUpd…WNB-PokerTournament2026_pdf.png",
    signup: POKER_SIGNUP,
    description:
      "Texas hold 'em tournament plus casino side games, dinner, and a raffle. Buy-in includes dinner. Must be 21 or older to play.\n\nSeating is limited — sign up ahead rather than at the door.",
  },

  {
    slug: "ikebana-summer-demonstration-2027",
    kind: "tradition",
    title: "Ikebana Summer Demonstration & Tea",
    date: "2027-07-10",
    start: "14:00",
    end: "16:00",
    status: "draft",
    description:
      "Tanaka sensei demonstrates summer arrangements, followed by tea in room 11. Class members will have arrangements on display.",
  },
  {
    slug: "ukulele-hula-recital-2027",
    kind: "music",
    wide: true,
    title: "Ukulele & Hula Spring Recital",
    date: "2027-02-27",
    start: "13:00",
    end: "15:00",
    status: "draft",
    description:
      "The Monday ukulele group and the Wednesday hula classes share an afternoon program in the hall. Refreshments after.",
  },
];
