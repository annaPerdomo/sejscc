import type { Metadata } from "next";
import { geist, lora } from "../fonts";
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
      <body className={`${geist.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
