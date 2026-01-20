import { Noto_Sans_JP, IBM_Plex_Sans } from "next/font/google";

export const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans-jp",
  preload: true,
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

export const fontVariables = `${notoSansJP.variable} ${ibmPlexSans.variable}`;
