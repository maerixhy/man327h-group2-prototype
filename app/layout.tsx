import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Mrs_Saint_Delafield } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { themeScript } from "@/lib/theme";
import Clarity from "@/components/Clarity";

const text = Instrument_Sans({ subsets: ["latin"], variable: "--font-text" });
const figures = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-figures" });
const signature = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400", variable: "--font-signature" });

export const metadata: Metadata = {
  title: "Paper Trail",
  description: "A shared money ledger for student orgs, PTAs, teams, and small nonprofits.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Paper Trail", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#131210" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${text.variable} ${figures.variable} ${signature.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Clarity />
      </body>
    </html>
  );
}
