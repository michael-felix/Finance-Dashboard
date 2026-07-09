import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { Footer } from "@/components/Footer";
import { THEME_INIT_SCRIPT } from "@/context/ThemeContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Australian Finance Dashboard",
  description: "Live ASX stocks, AUD FX rates, and cryptocurrency prices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        {/* Static, no user input; avoids a flash of the wrong theme before React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
