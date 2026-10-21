import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Clarity from "@/components/Clarity";

export const metadata: Metadata = {
  title: "Paper Trail",
  description: "A shared money ledger for student orgs, PTAs, teams, and small nonprofits.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Paper Trail", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1f6f5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Clarity />
      </body>
    </html>
  );
}
