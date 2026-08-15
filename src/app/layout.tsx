import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Southeast Japanese School & Community Center",
    template: "%s · SEJSCC",
  },
  description:
    "A home for Japanese language, culture, and community in Norwalk, California. Japanese school, judo, basketball, cultural events, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
