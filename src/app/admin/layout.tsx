import type { Metadata } from "next";
import { MadeWithLove } from "@/components/made-with-love";
import { jost, shipporiMincho, zenMaruGothic } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "SEJSCC Admin",
    template: "%s · SEJSCC Admin",
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${jost.variable} ${shipporiMincho.variable} ${zenMaruGothic.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        {children}
        <footer className="border-t border-line bg-white px-4 py-4 text-center">
          <MadeWithLove
            madeWith="Made with"
            by="by"
            className="text-xs text-stone"
          />
        </footer>
      </body>
    </html>
  );
}
