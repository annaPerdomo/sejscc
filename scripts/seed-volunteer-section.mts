import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const SECTION = {
  id: "home",
  title: "Board of Directors",
  titleJa: "運営理事会",
  intro:
    "SEJSCC is entirely volunteer-run. The board sets direction on behalf of the community it serves.",
  introJa:
    "SEJSCCはすべてボランティアで運営されています。理事会が地域の皆さんに代わって方針を定めています。",
  photoAlt:
    "The 2025 board of directors standing together in the gym in front of the center's banner, many wearing blue leis",
  photoAltJa:
    "センターの横断幕の前に並ぶ2025年度の理事の皆さん。多くが青いレイを掛けています",
  volunteersNote:
    "They're only part of the picture — dozens of volunteers teach classes, coach teams, run the kitchen, and keep the center open every week.",
  volunteersNoteJa:
    "理事会はほんの一部です。数多くのボランティアが、授業を教え、チームを指導し、厨房を担い、毎週センターを開き続けています。",
  contactNote: "To reach a board member, leave a message with",
  contactNoteJa: "理事会のメンバーへご連絡の際は、",
  contactLinkLabel: "the center.",
  contactLinkLabelJa: "センターまで伝言をお残しください。",
  waysTitle: "Ways to help",
  waysTitleJa: "お手伝いの方法",
  waysIntro:
    "No experience needed — just a few hours and a friendly face. Pick something that fits and we'll show you the rest.",
  waysIntroJa:
    "経験は不要です。少しの時間と笑顔があれば大丈夫。できそうなものを選んでいただければ、あとは私たちがご案内します。",
};

const MEMBERS = [
  "Dean Wada",
  "Simon Yao",
  "Carrie Nakatani",
  "Tye Masaki",
  "Ernie Nishii",
  "Masa Lau",
  "Colleen Sonoda",
  "Miki Suzuki",
  "Karrie Takeuchi",
  "Rich Tamaki",
];

const ROLES = [
  {
    title: "Teach a class",
    titleJa: "授業を教える",
    description:
      "Share a skill or hobby with the community by leading one of our weekly classes.",
    descriptionJa:
      "毎週の教室のひとつを担当し、得意なことや趣味を地域の皆さんに教えてください。",
  },
  {
    title: "Coach a team",
    titleJa: "チームを指導する",
    description: "Coach one of our youth or adult sports teams through the season.",
    descriptionJa: "ユースまたは成人のスポーツチームをシーズンを通して指導してください。",
  },
  {
    title: "Help in the kitchen",
    titleJa: "厨房を手伝う",
    description:
      "Help prepare and serve food for a festival, keirokai, or weekly gathering.",
    descriptionJa:
      "祭りや敬老会、週ごとの集まりで食事の準備や提供を手伝ってください。",
  },
  {
    title: "Keep the center open",
    titleJa: "センターを開き続ける",
    description:
      "Open up, lock up, or help staff the front desk so events can run smoothly.",
    descriptionJa:
      "開錠・施錠や受付を手伝い、行事がスムーズに進むよう支えてください。",
  },
];

const sectionRows: { id?: unknown }[] = await sql`
  insert into volunteer_section (
    id, title, title_ja, intro, intro_ja, photo_alt, photo_alt_ja,
    volunteers_note, volunteers_note_ja, contact_note, contact_note_ja,
    contact_link_label, contact_link_label_ja, ways_title, ways_title_ja,
    ways_intro, ways_intro_ja
  )
  values (
    ${SECTION.id}, ${SECTION.title}, ${SECTION.titleJa}, ${SECTION.intro}, ${SECTION.introJa},
    ${SECTION.photoAlt}, ${SECTION.photoAltJa}, ${SECTION.volunteersNote}, ${SECTION.volunteersNoteJa},
    ${SECTION.contactNote}, ${SECTION.contactNoteJa}, ${SECTION.contactLinkLabel}, ${SECTION.contactLinkLabelJa},
    ${SECTION.waysTitle}, ${SECTION.waysTitleJa}, ${SECTION.waysIntro}, ${SECTION.waysIntroJa}
  )
  on conflict (id) do nothing
  returning id
`;
console.log(
  sectionRows.length
    ? "Inserted the volunteer_section row."
    : "volunteer_section already has a row — left alone."
);

const [{ count: memberCount }] = (await sql`
  select count(*)::int as count from board_member
`) as { count: number }[];

if (memberCount === 0) {
  const ids = MEMBERS.map(() => crypto.randomUUID());
  const sortOrders = MEMBERS.map((_, i) => i);
  await sql`
    insert into board_member (id, name, sort_order, visible)
    select id, name, sort_order, true
    from unnest(${ids}::text[], ${MEMBERS}::text[], ${sortOrders}::int[])
      as t(id, name, sort_order)
  `;
  console.log(`Inserted ${MEMBERS.length} board member(s).`);
} else {
  console.log("board_member already has rows — left alone.");
}

const [{ count: roleCount }] = (await sql`
  select count(*)::int as count from volunteer_role
`) as { count: number }[];

if (roleCount === 0) {
  const ids = ROLES.map(() => crypto.randomUUID());
  const titles = ROLES.map((role) => role.title);
  const titlesJa = ROLES.map((role) => role.titleJa);
  const descriptions = ROLES.map((role) => role.description);
  const descriptionsJa = ROLES.map((role) => role.descriptionJa);
  const sortOrders = ROLES.map((_, i) => i);
  await sql`
    insert into volunteer_role (
      id, title, title_ja, description, description_ja, sort_order, visible
    )
    select id, title, title_ja, description, description_ja, sort_order, false
    from unnest(
      ${ids}::text[], ${titles}::text[], ${titlesJa}::text[],
      ${descriptions}::text[], ${descriptionsJa}::text[], ${sortOrders}::int[]
    ) as t(id, title, title_ja, description, description_ja, sort_order)
  `;
  console.log(`Inserted ${ROLES.length} draft volunteer role(s) (hidden).`);
} else {
  console.log("volunteer_role already has rows — left alone.");
}
