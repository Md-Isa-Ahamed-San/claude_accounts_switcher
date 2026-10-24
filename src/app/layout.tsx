import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "~/components/Providers";

export const metadata: Metadata = {
  title: "Claude Multi-Deck — Desktop Hub & Switcher",
  description: "Windows Desktop Account Hub & Instant Switcher for multiple Claude Desktop instances.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-ground text-foreground antialiased selection:bg-claude/20 selection:text-claude">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
