import { Jost, Shippori_Mincho, Zen_Maru_Gothic } from "next/font/google";

export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru-gothic",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
});
