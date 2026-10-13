import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { jost, shipporiMincho, zenMaruGothic } from "../fonts";
import { hasLocale, localePath, locales } from "@/lib/i18n";
import { getDictionaryFor } from "@/lib/dictionaries";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Google drops relative hreflang URLs, so every page's alternates need a base.
const siteUrl = new URL(process.env.SITE_URL ?? "https://sejscc.org");

// SITE_URL can name a domain that doesn't serve this site yet, so previews take
// the image from Vercel's production domain: the project's shortest custom
// domain. Move a new domain's DNS before adding it to the project, or every
// link preview loses its image.
const ogImageUrl = new URL(
  "/og-image.jpg",
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : siteUrl,
);

type Props = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    metadataBase: siteUrl,
    title: {
      default: dict.meta.siteTitle,
      template: dict.meta.titleTemplate,
    },
    description: dict.meta.siteDescription,
    openGraph: {
      type: "website",
      locale: lang === "ja" ? "ja_JP" : "en_US",
      siteName: dict.meta.siteTitle,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: dict.meta.ogImageAlt,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
    alternates: {
      canonical: localePath(lang, "/"),
      languages: {
        en: "/",
        ja: "/ja",
        "x-default": "/",
      },
    },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  // iOS Safari paints the html background behind the toolbar and in the
  // overscroll bounce, where body's near-white would band against the footer.
  return (
    <html lang={lang} className="bg-navy">
      <body
        className={`${jost.variable} ${shipporiMincho.variable} ${zenMaruGothic.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
