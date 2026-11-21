import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quillbrook Bakehouse | Portfolio sample",
  description:
    "A demo landing page for an invented bakery: today's bakes, prices and order-ahead requests. Built by jdcreative.studiodesign.",
  // An invented business, so keep it out of search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
