import type { Metadata } from "next";

import { Providers } from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Australian Finance Dashboard",
  description: "Live ASX stocks, AUD FX rates, and cryptocurrency prices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
