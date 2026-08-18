import type { Metadata } from "next";
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
        className={`${jost.variable} ${shipporiMincho.variable} ${zenMaruGothic.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
