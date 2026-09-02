// The demo event list, shared by seed-demo-events.mjs (writes the rows) and
// make-demo-flyers.mjs (draws a flyer for each one).

// Must match CENTER_ADDRESS in src/lib/center.ts exactly, or venueLabel() stops
// collapsing seeded rows to "At the center". Copied because .mjs can't import TS.
export const CENTER = "14615 S. Gridley Rd., Norwalk, CA 90650";
export const PARK = "Norwalk Park, 13000 Clarkdale Ave., Norwalk, CA 90650";

// Marks every seeded row, on screen and for the seeder's own delete guards, so
// demo content is never mistaken for — or deletes — real Center information.
export const TITLE_PREFIX = "[TEST] ";

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
];

// `flyer` names a file in the flyers directory (--flyers=..., default
// ./materials); without one, make-demo-flyers.mjs draws a stand-in. `noFlyer`
// opts out of both, so the board can see a card with no flyer at all. `repeat` +
// `until` post a single row that moves itself forward.
export const DEMO_EVENTS = [
  {
    slug: "cultural-festival-2025",
    kind: "festival",
    title: "62nd Annual SEJSCC Cultural Festival & Ondo",
    date: "2025-06-07",
    start: "15:00",
    end: "21:00",
    flyer: "2025Festival Flyer.pdf",
    description:
      "Bring the entire family and enjoy a summer day with us. Saturday June 7th, 3–9 PM and Sunday June 8th, 2–8 PM.\n\nJapanese cultural performances and demonstrations, a \"happyfunsmile\" live performance on Sunday from 4–5 PM, festival games, bingo, ikebana displays, and delicious food.\n\nFree ondo dance lessons Monday and Thursday evenings, 7:30–8:30 PM. Raffle tickets are $5 each, with a $1,500 grand prize and a Las Vegas getaway package; drawing begins Sunday at 7:30 PM.",
  },
  {
    slug: "monthly-bingo-2025-09-06",
    kind: "bingo",
    wide: true,
    title: "Monthly Bingo Games — Hosted by NYS",
    date: "2025-09-06",
    start: "17:00",
    end: "21:00",
    description:
      "Norwalk Youth Sports hosts September bingo in the main hall. Doors open at 5:00 PM and games begin at 6:00 PM. Snack bar open all evening; proceeds support the youth basketball program.",
  },
  {
    slug: "undokai-2025",
    kind: "sports",
    wide: true,
    title: "Gakuen Undokai (Field Day)",
    date: "2025-10-18",
    start: "09:00",
    end: "12:00",
    location: PARK,
    description:
      "Every student at the Japanese school takes part in the annual athletic meet — relays, tamaire, and the tug-of-war. Families are welcome to bring chairs and cheer.",
  },
  {
    slug: "holiday-boutique-2025",
    kind: "market",
    title: "2025 Holiday Boutique & Pancake Breakfast",
    date: "2025-10-25",
    start: "08:00",
    end: "14:00",
    description:
      "Handmade crafts, Japanese goods, and a pancake breakfast served in the hall. Breakfast is $8 for adults and $5 for children. Vendor tables are organized by the Gakuen parents.",
  },
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
    slug: "mochitsuki-2025",
    kind: "food",
    title: "Mochitsuki & Toshikoshi Soba",
    date: "2025-12-13",
    start: "09:00",
    end: "13:00",
    description:
      "Traditional mochi pounding on the patio with the usu and kine, followed by year-end soba in the hall. Bring a container if you would like to take mochi home.",
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
    slug: "ohanashikai-2026",
    kind: "school",
    wide: true,
    title: "Ohanashikai Speech Program",
    date: "2026-05-02",
    start: "09:30",
    end: "12:00",
    description:
      "Students from every level present a short speech in Japanese on stage. Koi no bori are flown outside for Children's Day.",
  },
  {
    slug: "cultural-festival-2026",
    kind: "festival",
    wide: true,
    title: "2026 Cultural Festival",
    date: "2026-06-13",
    start: "10:00",
    end: "15:00",
    description:
      "The school's biggest day of the year: student performances, taiko, food booths, game booths, and a raffle. Admission is free and the whole community is invited.",
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
    slug: "first-day-of-school-2026",
    kind: "school",
    title: "First Day of School — Fall Semester Begins",
    date: "2026-08-15",
    start: "08:45",
    end: "12:15",
    description:
      "The fall semester opens with the shigyoshiki ceremony. Kindergarten through level 3 begin at 8:45 AM; levels 4 through 12 begin at 9:00 AM.",
  },

  {
    slug: "nikkei-seniors-luncheon",
    kind: "food",
    title: "Nikkei Seniors Monthly Luncheon",
    date: "2026-09-08",
    start: "11:30",
    end: "14:30",
    repeat: "monthly",
    description:
      "The Nikkei Seniors meet the second Tuesday of every month for lunch, bingo, and a guest speaker. New members are always welcome — come as a guest first and see whether it suits you.",
  },
  {
    slug: "monthly-bingo-2026-09-12",
    kind: "bingo",
    noFlyer: true,
    title: "Monthly Bingo Games — Hosted by Gakuen",
    date: "2026-09-12",
    start: "17:00",
    end: "21:00",
    description:
      "The Japanese school hosts September bingo. Doors open at 5:00 PM, games begin at 6:00 PM. Tokyo Central gift certificates are available at the door in $10 denominations.\n\nSeptember only: the game moves to the second Saturday. Bingo returns to its usual first Saturday in October.",
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
    slug: "monthly-bingo",
    kind: "bingo",
    title: "Monthly Bingo Games",
    date: "2026-10-03",
    start: "17:00",
    end: "21:00",
    repeat: "monthly",
    description:
      "Bingo in the main hall on the first Saturday of the month. Doors open at 5:00 PM and games begin at 6:00 PM.\n\nA different group hosts each month — Norwalk Youth Sports, the Gakuen, Hikari Taiko, Judo, and Kendo all take a turn — and the snack bar proceeds go to whichever group is hosting. Bring your own dauber or buy one at the door. All ages welcome.",
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
    slug: "undokai-2026",
    kind: "sports",
    wide: true,
    title: "Gakuen Undokai (Field Day)",
    date: "2026-10-17",
    start: "09:00",
    end: "12:00",
    location: PARK,
    description:
      "The annual athletic meet for every student at the Japanese school. Wear your class color and bring a hat — we are outdoors all morning.",
  },
  {
    slug: "holiday-boutique-2026",
    kind: "market",
    title: "2026 Holiday Craft Fair",
    date: "2026-10-24",
    start: "08:00",
    end: "12:30",
    flyer: "2026-Holiday-Boutique-1.png",
    description:
      "Free admission. Handmade crafts and Japanese goods from vendors throughout the hall.\n\nNew for 2026: vendor self-checkout at each booth. Forms of accepted payment will vary by vendor.\n\nPlease also join us for the NYS Basketball pancake fundraiser in the MPR, 7–11 AM, and Judo's lunch fundraiser in the gym from 8:30 AM.",
  },
  {
    slug: "shichi-go-san-2026",
    kind: "tradition",
    title: "Shichi-Go-San Kimono Day",
    date: "2026-11-14",
    start: "09:00",
    end: "12:15",
    description:
      "Students learn about the Seven-Five-Three festival, and a few are dressed in traditional kimono for photographs in front of the hall.",
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
    description:
      "Hikari Taiko closes out the year with a concert in the hall, including pieces from the youth group. Doors open at 5:30 PM; suggested donation $10.",
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
