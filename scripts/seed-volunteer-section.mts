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

const sectionRows: { id?: unknown }[] = await sql`
  insert into volunteer_section (
    id, title, title_ja, intro, intro_ja, photo_alt, photo_alt_ja,
    volunteers_note, volunteers_note_ja, contact_note, contact_note_ja,
    contact_link_label, contact_link_label_ja
  )
  values (
    ${SECTION.id}, ${SECTION.title}, ${SECTION.titleJa}, ${SECTION.intro}, ${SECTION.introJa},
    ${SECTION.photoAlt}, ${SECTION.photoAltJa}, ${SECTION.volunteersNote}, ${SECTION.volunteersNoteJa},
    ${SECTION.contactNote}, ${SECTION.contactNoteJa}, ${SECTION.contactLinkLabel}, ${SECTION.contactLinkLabelJa}
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
